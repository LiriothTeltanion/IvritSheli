"""
Module: Supabase bearer verification boundary
Purpose: Verify one Supabase access token without letting an unauthenticated caller decide how much work the process does.
Author: Kevin "Lirioth" Cusnir
Date: 2026-09-05 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH.

SEC-02. What this module is defending against.

The optional Supabase bearer path is authentication, so everything it does
happens *before* the caller has proved anything. The previous implementation
handed the raw token straight to `PyJWKClient.get_signing_key_from_jwt`, and
that method decodes the JOSE header, reads `kid`, and — when the key id is not
in its cache — refetches the whole key set over the network with an eight second
timeout.

Three consequences, none of which needed a valid token:

1. A caller could pick a fresh random `kid` per request and make every request
   perform an outbound HTTPS fetch.
2. That fetch is blocking, so it runs in Starlette's bounded thread pool. The
   same pool resolves ordinary cookie sessions and serves every synchronous
   route, so enough concurrent unknown-kid requests stall the whole application
   for signed-in learners, not only the attacker.
3. Nothing bounded the token's size, so the header parser could be handed as
   much data as the HTTP layer would carry.

The controls here are ordered cheapest first, so the expensive step is reached
only by something already shaped like a real token:

    size gate -> header parse -> algorithm gate -> key-id gate
    -> negative cache -> single-flight admission -> network

The verifier deliberately never widens what is accepted. Signature, issuer,
audience, expiry and the required claims are still checked by PyJWT exactly as
before, and an unverified token is never trusted for any reason.

`HS256` stays absent from the allowed algorithms on purpose: the JWKS publishes
public keys, and a public key also works as a guessable HMAC secret, which is
the classic algorithm-confusion attack.
"""

from __future__ import annotations

import logging
import re
import threading
import time
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any

from ivrit_sheli.cloud_store import AuthUser, SessionIdentity

LOGGER = logging.getLogger(__name__)

# Supabase access tokens are signed with an asymmetric key published as a JWKS.
SUPABASE_JWT_ALGORITHMS = ("ES256", "RS256")

# A Supabase access token is a few hundred bytes. Four kilobytes is generous
# enough that no legitimate token is refused and small enough that the header
# parser is never handed a payload worth sending.
MAX_BEARER_TOKEN_BYTES = 4096

# Key ids are base64url in practice. Anchored, bounded, and checked before the
# value is ever used to build a cache key or reach the network.
KID_PATTERN = re.compile(r"\A[A-Za-z0-9._~+/=-]{1,128}\Z")

# How long an unknown key id is remembered as unknown. Long enough that a burst
# costs one fetch rather than thousands, short enough that a genuine key
# rotation is picked up without a restart.
NEGATIVE_KID_TTL_SECONDS = 300.0

# The negative cache is caller-controlled, so it is bounded and evicts oldest
# first. Without this the defence against unbounded fetches would become an
# unbounded dictionary instead.
MAX_NEGATIVE_KIDS = 512

# Lower than the eight seconds this used to allow. A provider that has not
# answered in five seconds is not about to rescue this request, and the caller
# is unauthenticated.
JWKS_TIMEOUT_SECONDS = 5


class SupabaseBearerVerifier:
    """Verify Supabase access tokens with bounded, caller-independent cost.

    One instance per application. It owns the negative cache and the
    single-flight permit, which is why this is an object rather than a set of
    module functions: two applications in one process must not share a cache
    keyed by strings an attacker chooses.
    """

    def __init__(
        self,
        supabase_url: str,
        *,
        key_resolver: Any = None,
        clock: Any = time.monotonic,
    ) -> None:
        """Build a verifier for one project.

        Args:
            supabase_url: Project base URL. Trailing slashes are ignored.
            key_resolver: Optional callable taking the token and returning the
                signing key, used by tests so no test reaches the network.
            clock: Monotonic time source, injectable for deterministic tests.
        """
        self.base = supabase_url.rstrip("/")
        self._clock = clock
        self._key_resolver = key_resolver
        self._client: Any = None
        self._lock = threading.Lock()
        self._unknown_kids: OrderedDict[str, float] = OrderedDict()
        # Non-blocking single flight. A second request that arrives while a
        # refresh is running is refused immediately rather than queued: queueing
        # would rebuild the very stall this is here to prevent.
        self._refresh_permit = threading.BoundedSemaphore(1)

    # -- cheap gates ------------------------------------------------------

    def _key_id(self, token: str) -> str | None:
        """Return the key id of a plausibly-shaped token, or None to reject.

        Every check here is local and constant-ish work. Nothing in this method
        touches the network, the thread pool or the cache.
        """
        if not token or len(token.encode("utf-8", "ignore")) > MAX_BEARER_TOKEN_BYTES:
            return None
        try:
            import jwt

            header = jwt.get_unverified_header(token)
        except Exception:
            # A header that will not parse is an ordinary event, not a fault.
            return None
        if not isinstance(header, dict):
            return None
        if header.get("alg") not in SUPABASE_JWT_ALGORITHMS:
            # Refused before the key set is fetched, so an algorithm-confusion
            # attempt cannot even cost a network round trip.
            return None
        kid = header.get("kid")
        if not isinstance(kid, str) or not KID_PATTERN.match(kid):
            return None
        return kid

    # -- negative cache ---------------------------------------------------

    def _is_known_unknown(self, kid: str) -> bool:
        """Return whether this key id was recently proved absent."""
        now = self._clock()
        with self._lock:
            expires = self._unknown_kids.get(kid)
            if expires is None:
                return False
            if expires <= now:
                del self._unknown_kids[kid]
                return False
            return True

    def _remember_unknown(self, kid: str) -> None:
        """Record one absent key id, evicting the oldest beyond the bound."""
        now = self._clock()
        with self._lock:
            self._unknown_kids.pop(kid, None)
            self._unknown_kids[kid] = now + NEGATIVE_KID_TTL_SECONDS
            while len(self._unknown_kids) > MAX_NEGATIVE_KIDS:
                self._unknown_kids.popitem(last=False)

    def forget_unknown(self, kid: str) -> None:
        """Drop one negative-cache entry. Used when a key rotation is expected."""
        with self._lock:
            self._unknown_kids.pop(kid, None)

    # -- the expensive step -----------------------------------------------

    def _signing_key(self, token: str) -> Any:
        """Fetch the signing key, at most one refresh in flight at a time."""
        if self._key_resolver is not None:
            return self._key_resolver(token)
        if self._client is None:
            from jwt import PyJWKClient

            self._client = PyJWKClient(
                f"{self.base}/auth/v1/.well-known/jwks.json",
                cache_keys=True,
                lifespan=3600,
                timeout=JWKS_TIMEOUT_SECONDS,
            )
        return self._client.get_signing_key_from_jwt(token)

    def resolve(self, token: str) -> SessionIdentity | None:
        """Verify one bearer token and map it onto a session identity.

        Returns None for every rejection. The caller falls through to the cookie
        path or to an ordinary 401, and no reason is ever reported to the caller:
        distinguishing "unknown key" from "bad signature" would tell an
        unauthenticated prober which guess was closer.
        """
        kid = self._key_id(token)
        if kid is None:
            return None
        if self._is_known_unknown(kid):
            # Proved absent recently. Costs a dictionary lookup instead of an
            # outbound fetch, which is the whole point of this module.
            return None

        acquired = self._refresh_permit.acquire(blocking=False)
        if not acquired:
            # Another verification already holds the permit. Refusing now keeps
            # the thread pool free; a real client retries and finds the key
            # cached. Queueing here would recreate the stall.
            LOGGER.info("supabase bearer verification skipped while a refresh is in flight")
            return None
        try:
            signing_key = self._signing_key(token)
        except Exception:
            # PyJWKClient raises for an absent key id and for a failed fetch
            # alike. Remembering the key id is correct in both cases: if the
            # provider is unreachable, hammering it changes nothing.
            self._remember_unknown(kid)
            return None
        finally:
            self._refresh_permit.release()

        try:
            import jwt

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=list(SUPABASE_JWT_ALGORITHMS),
                audience="authenticated",
                issuer=f"{self.base}/auth/v1",
                options={"require": ["exp", "sub"]},
            )
        except Exception:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None
        metadata = payload.get("user_metadata") or {}
        if not isinstance(metadata, dict):
            metadata = {}
        return SessionIdentity(
            user=AuthUser(
                id=str(user_id),
                display_name=(
                    metadata.get("full_name") or metadata.get("name") or "Learner"
                ),
                provider="google",
                login=payload.get("email", ""),
            ),
            csrf_hash="",
            expires_at=datetime.fromtimestamp(int(payload["exp"]), tz=timezone.utc),
        )
