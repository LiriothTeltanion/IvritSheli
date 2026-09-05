"""
Module: Supabase bearer verification boundary
Purpose: Hold the SEC-02 cost bounds and the verification rules of the optional bearer path.
Author: Kevin "Lirioth" Cusnir
Date: 2026-09-05 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH. No test here touches the network.

Why this file exists.

Before it, the optional Supabase bearer path had no tests at all. That is a
public authentication surface: everything it does happens before the caller has
proved anything, and an unknown key id sent it to fetch a key set over the
network with an eight second timeout, in Starlette's bounded thread pool, which
is the same pool that resolves ordinary cookie sessions.

Two kinds of assertion live here and they are not interchangeable. The cost
tests count how many times the key lookup was reached, because a control that
rejects a token *after* paying for it has not defended anything. The correctness
tests prove that none of that bounding widened what is accepted.

The key resolver is injected, so nothing here reaches Supabase, and the clock is
injected, so the cache expiry test is deterministic instead of slow.
"""

from __future__ import annotations

import base64
import json
import threading
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from ivrit_sheli.supabase_bearer import (
    MAX_BEARER_TOKEN_BYTES,
    MAX_NEGATIVE_KIDS,
    NEGATIVE_KID_TTL_SECONDS,
    SupabaseBearerVerifier,
)

BASE = "https://project.supabase.co"
ISSUER = f"{BASE}/auth/v1"
KID = "real-signing-key-1"


class FakeSigningKey:
    """Shaped like the object PyJWKClient returns: the key hangs off `.key`."""

    def __init__(self, key: Any) -> None:
        self.key = key


class CountingResolver:
    """A key resolver that records how often the expensive step was reached."""

    def __init__(self, key: Any = None, error: Exception | None = None) -> None:
        self.calls = 0
        self._key = key
        self._error = error
        self.gate: threading.Event | None = None

    def __call__(self, _token: str) -> FakeSigningKey:
        self.calls += 1
        if self.gate is not None:
            self.gate.wait(2)
        if self._error is not None:
            raise self._error
        return FakeSigningKey(self._key)


@pytest.fixture(scope="module")
def keypair() -> tuple[Any, Any]:
    """One EC key pair for the whole module; generating it per test is waste."""
    private = ec.generate_private_key(ec.SECP256R1())
    return private, private.public_key()


def _claims(**overrides: Any) -> dict[str, Any]:
    """A well-formed Supabase access-token payload."""
    now = datetime.now(tz=timezone.utc)
    payload: dict[str, Any] = {
        "sub": "6f1c9d2e-0000-4000-8000-abcdefabcdef",
        "aud": "authenticated",
        "iss": ISSUER,
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "email": "learner@example.test",
        "user_metadata": {"full_name": "Una Aprendiz"},
    }
    payload.update(overrides)
    return payload


def _signed(private: Any, *, kid: str = KID, **claim_overrides: Any) -> str:
    """Mint a genuinely ES256-signed token."""
    return jwt.encode(
        _claims(**claim_overrides), private, algorithm="ES256", headers={"kid": kid}
    )


def _unsigned(header: dict[str, Any]) -> str:
    """Craft a token with an arbitrary header and a signature that is not one.

    Used for the cheap gates: they must reject before any signature is examined,
    so a real signature would prove nothing about them.
    """

    def segment(value: dict[str, Any]) -> str:
        raw = json.dumps(value).encode("utf-8")
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    return f"{segment(header)}.{segment(_claims())}.not-a-signature"


# ---------------------------------------------------------------------------
# Cost bounds. Every assertion here is about `resolver.calls`, because the
# defence is "the expensive step was never reached", not "the token was refused".
# ---------------------------------------------------------------------------


def test_an_oversized_token_never_reaches_the_key_lookup() -> None:
    """Nothing legitimate is four kilobytes; parsing one is work for a stranger."""
    resolver = CountingResolver()
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    assert verifier.resolve("a" * (MAX_BEARER_TOKEN_BYTES + 1)) is None
    assert resolver.calls == 0


def test_a_header_that_will_not_parse_never_reaches_the_key_lookup() -> None:
    """Garbage is an ordinary event on a public endpoint, not a fault."""
    resolver = CountingResolver()
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    for junk in ("", "not-a-jwt", "a.b.c", "...", "Bearer something"):
        assert verifier.resolve(junk) is None
    assert resolver.calls == 0


def test_hs256_is_refused_before_the_network() -> None:
    """Algorithm confusion: a published public key is a guessable HMAC secret."""
    resolver = CountingResolver()
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    assert verifier.resolve(_unsigned({"alg": "HS256", "kid": KID})) is None
    assert verifier.resolve(_unsigned({"alg": "none", "kid": KID})) is None
    assert resolver.calls == 0, "a rejected algorithm must not cost a key fetch"


def test_a_malformed_or_missing_key_id_is_refused_before_the_network() -> None:
    """The key id becomes a cache key, so it is bounded and checked first."""
    resolver = CountingResolver()
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    bad_kids: list[Any] = ["k" * 129, "has spaces", "has\nnewline", "", 12345, None]
    for kid in bad_kids:
        header = {"alg": "ES256"}
        if kid is not None:
            header["kid"] = kid
        assert verifier.resolve(_unsigned(header)) is None
    assert resolver.calls == 0


def test_an_unknown_key_id_is_looked_up_once_and_then_remembered() -> None:
    """The whole attack was one outbound fetch per request. This is the fix."""
    resolver = CountingResolver(error=RuntimeError("no key for this kid"))
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)
    token = _unsigned({"alg": "ES256", "kid": "attacker-chosen-kid"})

    for _ in range(25):
        assert verifier.resolve(token) is None

    assert resolver.calls == 1, "twenty-five probes must cost one lookup, not twenty-five"


def test_a_provider_failure_fails_closed_and_is_not_retried_in_a_loop() -> None:
    """If the provider is unreachable, hammering it changes nothing."""
    resolver = CountingResolver(error=TimeoutError("provider did not answer"))
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)
    token = _unsigned({"alg": "ES256", "kid": "key-during-an-outage"})

    for _ in range(10):
        assert verifier.resolve(token) is None
    assert resolver.calls == 1


def test_the_negative_cache_expires_so_a_rotated_key_is_picked_up(
    keypair: tuple[Any, Any],
) -> None:
    """A defence that never forgets would outlive a legitimate key rotation."""
    private, public = keypair
    now = [1_000.0]
    resolver = CountingResolver(error=RuntimeError("not published yet"))
    verifier = SupabaseBearerVerifier(
        BASE, key_resolver=resolver, clock=lambda: now[0]
    )
    token = _signed(private)

    assert verifier.resolve(token) is None
    assert verifier.resolve(token) is None
    assert resolver.calls == 1, "still inside the remembered window"

    now[0] += NEGATIVE_KID_TTL_SECONDS + 1
    verifier._key_resolver = CountingResolver(key=public)  # the key is published now
    identity = verifier.resolve(token)

    assert identity is not None, "a rotated key must be reachable after the window"


def test_the_negative_cache_is_bounded_by_its_own_limit() -> None:
    """The cache is keyed by strings the caller chooses, so it cannot grow freely."""
    resolver = CountingResolver(error=RuntimeError("unknown"))
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    for index in range(MAX_NEGATIVE_KIDS + 50):
        verifier.resolve(_unsigned({"alg": "ES256", "kid": f"kid-{index}"}))

    assert len(verifier._unknown_kids) <= MAX_NEGATIVE_KIDS


def test_only_one_key_lookup_runs_at_a_time() -> None:
    """Queueing behind a slow provider would rebuild the stall being prevented."""
    resolver = CountingResolver(error=RuntimeError("unknown"))
    resolver.gate = threading.Event()
    verifier = SupabaseBearerVerifier(BASE, key_resolver=resolver)

    first_started = threading.Event()

    def slow_probe() -> None:
        first_started.set()
        verifier.resolve(_unsigned({"alg": "ES256", "kid": "slow-kid"}))

    worker = threading.Thread(target=slow_probe, daemon=True)
    worker.start()
    assert first_started.wait(2)

    # While that one holds the permit, a different key id must be turned away
    # immediately rather than queued behind it.
    assert verifier.resolve(_unsigned({"alg": "ES256", "kid": "other-kid"})) is None
    assert resolver.calls == 1

    resolver.gate.set()
    worker.join(3)


# ---------------------------------------------------------------------------
# Correctness. Bounding cost must not have widened what is accepted.
# ---------------------------------------------------------------------------


def test_a_valid_token_becomes_a_session_identity(keypair: tuple[Any, Any]) -> None:
    """The point of the path: a real token still works."""
    private, public = keypair
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))

    identity = verifier.resolve(_signed(private))

    assert identity is not None
    assert identity.user.id == "6f1c9d2e-0000-4000-8000-abcdefabcdef"
    assert identity.user.display_name == "Una Aprendiz"
    assert identity.user.login == "learner@example.test"
    assert identity.csrf_hash == ""
    assert identity.expires_at > datetime.now(tz=timezone.utc)


def test_a_token_signed_by_another_key_is_refused(keypair: tuple[Any, Any]) -> None:
    """A verified signature is the entire basis of this path's trust."""
    _, public = keypair
    impostor = ec.generate_private_key(ec.SECP256R1())
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))

    assert verifier.resolve(_signed(impostor)) is None


def test_an_expired_token_is_refused(keypair: tuple[Any, Any]) -> None:
    """Expiry is required, not optional."""
    private, public = keypair
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))
    stale = int((datetime.now(tz=timezone.utc) - timedelta(hours=2)).timestamp())

    assert verifier.resolve(_signed(private, exp=stale)) is None


def test_a_foreign_issuer_or_audience_is_refused(keypair: tuple[Any, Any]) -> None:
    """A token minted for another project must not open this one."""
    private, public = keypair
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))

    assert verifier.resolve(_signed(private, iss="https://evil.example/auth/v1")) is None
    assert verifier.resolve(_signed(private, aud="anon")) is None


def test_a_token_without_a_subject_is_refused(keypair: tuple[Any, Any]) -> None:
    """No subject means no learner to be, so there is nothing to authenticate."""
    private, public = keypair
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))

    assert verifier.resolve(_signed(private, sub="")) is None


def test_hostile_user_metadata_cannot_change_the_identity_shape(
    keypair: tuple[Any, Any],
) -> None:
    """`user_metadata` is provider-controlled data, not a structure to trust."""
    private, public = keypair
    verifier = SupabaseBearerVerifier(BASE, key_resolver=CountingResolver(key=public))

    identity = verifier.resolve(_signed(private, user_metadata="not-an-object"))

    assert identity is not None
    assert identity.user.display_name == "Learner"
