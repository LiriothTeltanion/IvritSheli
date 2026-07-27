"""Short-lived, user-bound evidence for server-side speech transcription."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
from typing import Any

SERVER_TRANSCRIPT_PROVIDERS = frozenset({"self_hosted", "openai"})
DEFAULT_EVIDENCE_TTL_SECONDS = 300
MAX_CLOCK_SKEW_SECONDS = 30


class SpeechEvidenceError(ValueError):
    """Raised when speech evidence is invalid, expired, or does not match."""


@dataclass(frozen=True, slots=True)
class SpeechEvidenceGrant:
    """One signed evidence token and its public expiration timestamp."""

    token: str
    evidence_id: str
    expires_at: int


class SpeechEvidenceSigner:
    """Issue and validate compact HMAC evidence without storing transcript text."""

    def __init__(
        self,
        secret: str | bytes | None = None,
        *,
        ttl_seconds: int = DEFAULT_EVIDENCE_TTL_SECONDS,
    ) -> None:
        if ttl_seconds < 1:
            raise ValueError("Speech evidence TTL must be positive")
        if secret is None or secret == "":
            self._secret = secrets.token_bytes(32)
        elif isinstance(secret, str):
            self._secret = secret.encode("utf-8")
        else:
            self._secret = bytes(secret)
        if len(self._secret) < 32:
            raise ValueError("Speech evidence secret must contain at least 32 bytes")
        self.ttl_seconds = ttl_seconds

    def issue(
        self,
        *,
        subject: str,
        provider: str,
        target_text: str,
        transcript: str,
        now: int | None = None,
    ) -> SpeechEvidenceGrant:
        """Sign exact speech-result fields for a short scoring window."""
        self._validate_fields(subject, provider, target_text, transcript)
        issued_at = int(time.time() if now is None else now)
        evidence_id = secrets.token_urlsafe(18)
        expires_at = issued_at + self.ttl_seconds
        payload = {
            "v": 1,
            "jti": evidence_id,
            "sub": subject,
            "provider": provider,
            "target_sha256": _text_digest(target_text),
            "transcript_sha256": _text_digest(transcript),
            "iat": issued_at,
            "exp": expires_at,
        }
        encoded_payload = _base64url_encode(
            json.dumps(
                payload,
                ensure_ascii=True,
                separators=(",", ":"),
                sort_keys=True,
            ).encode("utf-8")
        )
        signature = hmac.new(
            self._secret,
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        return SpeechEvidenceGrant(
            token=f"{encoded_payload}.{_base64url_encode(signature)}",
            evidence_id=evidence_id,
            expires_at=expires_at,
        )

    def verify(
        self,
        token: str,
        *,
        subject: str,
        provider: str,
        target_text: str,
        transcript: str,
        now: int | None = None,
    ) -> str:
        """Validate signature, lifetime, owner, provider, target, and transcript."""
        self._validate_fields(subject, provider, target_text, transcript)
        try:
            encoded_payload, encoded_signature = token.split(".", 1)
            if not encoded_payload or not encoded_signature or "." in encoded_signature:
                raise ValueError
            supplied_signature = _base64url_decode(encoded_signature)
        except (ValueError, UnicodeError) as error:
            raise SpeechEvidenceError("Speech evidence token is malformed") from error
        expected_signature = hmac.new(
            self._secret,
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise SpeechEvidenceError("Speech evidence token signature is invalid")
        try:
            decoded = json.loads(_base64url_decode(encoded_payload))
        except (ValueError, UnicodeError, json.JSONDecodeError) as error:
            raise SpeechEvidenceError("Speech evidence token payload is invalid") from error
        if not isinstance(decoded, dict):
            raise SpeechEvidenceError("Speech evidence token payload is invalid")
        payload = decoded
        current_time = int(time.time() if now is None else now)
        issued_at = _integer_claim(payload, "iat")
        expires_at = _integer_claim(payload, "exp")
        if issued_at > current_time + MAX_CLOCK_SKEW_SECONDS:
            raise SpeechEvidenceError("Speech evidence token is not active yet")
        if current_time >= expires_at:
            raise SpeechEvidenceError("Speech evidence token has expired")
        if expires_at - issued_at != self.ttl_seconds:
            raise SpeechEvidenceError("Speech evidence token lifetime is invalid")
        if payload.get("v") != 1:
            raise SpeechEvidenceError("Speech evidence token version is unsupported")
        expected_claims = {
            "sub": subject,
            "provider": provider,
            "target_sha256": _text_digest(target_text),
            "transcript_sha256": _text_digest(transcript),
        }
        for key, expected in expected_claims.items():
            actual = payload.get(key)
            if not isinstance(actual, str) or not hmac.compare_digest(actual, expected):
                raise SpeechEvidenceError(
                    "Speech evidence does not match this learner or transcription"
                )
        evidence_id = payload.get("jti")
        if not isinstance(evidence_id, str) or not 16 <= len(evidence_id) <= 80:
            raise SpeechEvidenceError("Speech evidence identifier is invalid")
        return evidence_id

    @staticmethod
    def _validate_fields(
        subject: str,
        provider: str,
        target_text: str,
        transcript: str,
    ) -> None:
        if not subject or not target_text or not transcript:
            raise SpeechEvidenceError("Speech evidence fields must not be empty")
        if provider not in SERVER_TRANSCRIPT_PROVIDERS:
            raise SpeechEvidenceError(
                "Speech evidence is available only for server transcription"
            )


def _text_digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _integer_claim(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise SpeechEvidenceError(f"Speech evidence {key} claim is invalid")
    return value


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.b64decode(
        value + padding,
        altchars=b"-_",
        validate=True,
    )
