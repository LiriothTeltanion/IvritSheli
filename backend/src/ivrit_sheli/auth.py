"""Provider-bound OAuth, PKCE, server-side sessions, and demo authentication."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Any, Protocol
from urllib.parse import urlencode, urlparse

import requests

from ivrit_sheli import __version__
from ivrit_sheli.cloud_store import AuthUser, CloudStore, SessionIdentity
from ivrit_sheli.config import Settings


class AuthenticationError(RuntimeError):
    """Raised when an authentication attempt is invalid or incomplete."""


class AuthenticationConfigurationError(AuthenticationError):
    """Raised when a configured login route lacks required server credentials."""


class AuthenticationCapacityError(AuthenticationError):
    """Raised when bounded sign-in state is temporarily at capacity."""


class OAuthClient(Protocol):
    """Narrow provider boundary that can be replaced by deterministic test fakes."""

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str: ...
    def exchange_code(self, code: str, verifier: str, settings: Settings) -> dict[str, Any]: ...


class GitHubOAuthClient:
    """Minimal GitHub OAuth web flow with state and SHA-256 PKCE."""

    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    PROFILE_URL = "https://api.github.com/user"

    @staticmethod
    def _challenge(verifier: str) -> str:
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str:
        """Build the allow-listed GitHub authorization URL."""
        query = urlencode(
            {
                "client_id": settings.github_client_id,
                "redirect_uri": settings.github_redirect_uri,
                "scope": "read:user",
                "state": state,
                "code_challenge": self._challenge(verifier),
                "code_challenge_method": "S256",
            }
        )
        return f"{self.AUTHORIZE_URL}?{query}"

    def exchange_code(self, code: str, verifier: str, settings: Settings) -> dict[str, Any]:
        """Exchange a one-use code and return only safe profile fields."""
        token_response = requests.post(
            self.TOKEN_URL,
            headers={"Accept": "application/json", "User-Agent": f"Ivrit-Sheli/{__version__}"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
                "code_verifier": verifier,
            },
            timeout=12,
        )
        token_response.raise_for_status()
        token_payload = token_response.json()
        access_token = str(token_payload.get("access_token") or "")
        if not access_token:
            raise AuthenticationError("GitHub did not return an access token")
        profile_response = requests.get(
            self.PROFILE_URL,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {access_token}",
                "User-Agent": f"Ivrit-Sheli/{__version__}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=12,
        )
        profile_response.raise_for_status()
        profile = profile_response.json()
        if not profile.get("id") or not profile.get("login"):
            raise AuthenticationError("GitHub returned an incomplete profile")
        return {
            "id": profile["id"],
            "login": str(profile["login"])[:100],
            "name": str(profile.get("name") or profile["login"])[:100],
            "avatar_url": str(profile.get("avatar_url") or "")[:500] or None,
        }


class GoogleOAuthClient:
    """Privacy-minimal Google OIDC authorization-code flow with SHA-256 PKCE."""

    AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

    @staticmethod
    def _challenge(verifier: str) -> str:
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    @staticmethod
    def _picture_url(value: Any) -> str | None:
        """Accept only HTTPS Google-hosted profile images at the browser boundary."""
        candidate = str(value or "")[:500]
        parsed = urlparse(candidate)
        hostname = (parsed.hostname or "").casefold()
        if parsed.scheme != "https" or not (
            hostname == "googleusercontent.com"
            or hostname.endswith(".googleusercontent.com")
        ):
            return None
        return candidate

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str:
        """Build an OIDC request without asking Google for the learner's email."""
        query = urlencode(
            {
                "client_id": settings.google_auth_client_id,
                "redirect_uri": settings.google_auth_redirect_uri,
                "response_type": "code",
                "scope": "openid profile",
                "state": state,
                "code_challenge": self._challenge(verifier),
                "code_challenge_method": "S256",
                "prompt": "select_account",
            }
        )
        return f"{self.AUTHORIZE_URL}?{query}"

    def exchange_code(self, code: str, verifier: str, settings: Settings) -> dict[str, Any]:
        """Exchange one code, read minimal UserInfo, and discard all bearer tokens."""
        try:
            token_response = requests.post(
                self.TOKEN_URL,
                headers={
                    "Accept": "application/json",
                    "User-Agent": f"Ivrit-Sheli/{__version__}",
                },
                data={
                    "client_id": settings.google_auth_client_id,
                    "client_secret": settings.google_auth_client_secret,
                    "code": code,
                    "redirect_uri": settings.google_auth_redirect_uri,
                    "grant_type": "authorization_code",
                    "code_verifier": verifier,
                },
                timeout=12,
            )
            token_response.raise_for_status()
            token_payload = token_response.json()
            if not isinstance(token_payload, dict):
                raise AuthenticationError("Google returned an invalid token response")
            access_token = str(token_payload.get("access_token") or "")
            token_type = str(token_payload.get("token_type") or "Bearer")
            if not access_token or token_type.casefold() != "bearer":
                raise AuthenticationError("Google did not return a usable access token")

            profile_response = requests.get(
                self.USERINFO_URL,
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {access_token}",
                    "User-Agent": f"Ivrit-Sheli/{__version__}",
                },
                timeout=12,
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
            if not isinstance(profile, dict):
                raise AuthenticationError("Google returned an invalid profile response")
        except (requests.RequestException, ValueError) as error:
            raise AuthenticationError("Google sign-in could not be completed") from error

        subject = str(profile.get("sub") or "")[:255]
        if not subject:
            raise AuthenticationError("Google returned an incomplete profile")
        return {
            "id": subject,
            "name": str(profile.get("name") or "Learner")[:100],
            "avatar_url": self._picture_url(profile.get("picture")),
        }


@dataclass(frozen=True, slots=True)
class SessionGrant:
    """Raw bearer values returned only at the cookie-setting boundary."""

    token: str
    csrf_token: str
    identity: SessionIdentity


class AuthService:
    """Coordinate OAuth attempts and hashed server-side sessions."""

    def __init__(
        self,
        settings: Settings,
        store: CloudStore,
        oauth_client: OAuthClient | None = None,
        google_oauth_client: OAuthClient | None = None,
    ) -> None:
        self.settings = settings
        self.store = store
        self.github_oauth_client = oauth_client or GitHubOAuthClient()
        self.google_oauth_client = google_oauth_client or GoogleOAuthClient()

    def resolve(self, token: str | None) -> SessionIdentity | None:
        """Resolve a cookie bearer without revealing why it is invalid."""
        if not token:
            return None
        return self.store.resolve_session(token)

    def start_github(self, redirect_path: str = "/") -> tuple[str, str]:
        """Create a browser-bound, short-lived OAuth state and PKCE verifier."""
        return self._start_oauth(
            "github",
            self.github_oauth_client,
            self.settings.github_auth_configured,
            redirect_path,
        )

    def start_google(self, redirect_path: str = "/") -> tuple[str, str]:
        """Create a provider-bound Google OIDC state and PKCE verifier."""
        return self._start_oauth(
            "google",
            self.google_oauth_client,
            self.settings.google_auth_configured,
            redirect_path,
        )

    def _start_oauth(
        self,
        provider: str,
        client: OAuthClient,
        configured: bool,
        redirect_path: str,
    ) -> tuple[str, str]:
        if not configured:
            raise AuthenticationConfigurationError(f"{provider.title()} sign-in is not configured")
        state = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(64)
        safe_redirect = safe_redirect_path(redirect_path)
        stored = self.store.store_oauth_state(
            state,
            verifier,
            safe_redirect,
            provider=provider,
            max_active_states=self.settings.oauth_state_limit,
        )
        if not stored:
            raise AuthenticationCapacityError(
                "Sign-in is temporarily busy. Retry after existing attempts expire."
            )
        return state, client.authorize_url(state, verifier, self.settings)

    def finish_github(
        self, code: str, state: str, browser_state: str | None
    ) -> tuple[SessionGrant, str]:
        """Validate browser state, consume it once, and issue a fresh session."""
        if not code:
            raise AuthenticationError("GitHub did not return an authorization code")
        verifier, redirect_path = self._consume_oauth_state("github", state, browser_state)
        profile = self.github_oauth_client.exchange_code(code, verifier, self.settings)
        user = self.store.upsert_github_user(profile)
        return self._grant(user), redirect_path

    def finish_google(
        self, code: str, state: str, browser_state: str | None
    ) -> tuple[SessionGrant, str]:
        """Validate Google state, consume it once, and issue a fresh session."""
        if not code:
            raise AuthenticationError("Google did not return an authorization code")
        verifier, redirect_path = self._consume_oauth_state("google", state, browser_state)
        profile = self.google_oauth_client.exchange_code(code, verifier, self.settings)
        user = self.store.upsert_google_user(profile)
        return self._grant(user), redirect_path

    def cancel_github(self, state: str, browser_state: str | None) -> str:
        """Safely finish a denied OAuth attempt without creating a session."""
        _, redirect_path = self._consume_oauth_state("github", state, browser_state)
        return redirect_path

    def cancel_google(self, state: str, browser_state: str | None) -> str:
        """Safely finish a denied Google attempt without creating a session."""
        _, redirect_path = self._consume_oauth_state("google", state, browser_state)
        return redirect_path

    def start_demo(self) -> SessionGrant:
        """Issue a session for the deterministic non-admin read-only demo user."""
        return self._grant(self.store.ensure_demo_user())

    def logout(self, token: str | None) -> None:
        """Revoke the current session when present; the operation is idempotent."""
        if token:
            self.store.revoke_session(token)

    def _consume_oauth_state(
        self, provider: str, state: str, browser_state: str | None
    ) -> tuple[str, str]:
        """Validate and consume one browser- and provider-bound OAuth attempt once."""
        if not state:
            raise AuthenticationError("OAuth state validation failed")
        if browser_state is not None:
            if not hmac.compare_digest(state, browser_state):
                raise AuthenticationError("OAuth state validation failed")
        elif self.settings.session_cookie_secure or self.settings.app_env == "production":
            raise AuthenticationError("OAuth state validation failed")
        consumed = self.store.consume_oauth_state(state, provider=provider)
        if consumed is None:
            raise AuthenticationError("OAuth state is expired, mismatched, or already used")
        return consumed

    def _grant(self, user: AuthUser) -> SessionGrant:
        token = secrets.token_urlsafe(48)
        csrf_token = secrets.token_urlsafe(32)
        identity = self.store.create_session(
            user.id,
            token,
            csrf_token,
            self.settings.session_ttl_seconds,
            max_live_sessions=(
                self.settings.demo_session_limit
                if user.is_demo
                else self.settings.user_session_limit
            ),
            retention_seconds=self.settings.session_retention_seconds,
        )
        return SessionGrant(token, csrf_token, identity)


def safe_redirect_path(value: str) -> str:
    """Permit application-relative redirects and reject external/scheme-relative URLs."""
    candidate = value.strip()
    if not candidate.startswith("/") or candidate.startswith("//"):
        return "/"
    if any(character in candidate for character in ("\r", "\n", "\\")):
        return "/"
    return candidate[:500]


def auth_payload(
    identity: SessionIdentity | None,
    auth_providers: tuple[str, ...] = (),
    local_companion_url: str = "",
) -> dict[str, Any]:
    """Return the stable browser session contract."""
    user = identity.user if identity else None
    return {
        "authenticated": user is not None,
        "demo": bool(user and user.is_demo),
        "read_only": bool(user and user.is_demo),
        "user": user.public_dict() if user else None,
        "mode": "cloud",
        "auth_providers": list(auth_providers),
        "local_companion_url": local_companion_url or None,
        "capabilities": {
            "cloud_learning": True,
            "ai": True,
            "audio_scoring": True,
            "connectors": True,
            "local_first": False,
        },
    }
