"""Bounded HTTP request and layered authentication abuse controls.

``X-Forwarded-For`` is never a rate-limit identity. Direct mode uses the raw ASGI peer.
Explicit Railway mode uses exactly one syntactically valid ``X-Real-IP`` value; explicit
Render mode uses exactly one syntactically valid ``CF-Connecting-IP`` value. Both modes
require platform-provenance settings, assume ingress overwrites their trusted header, and
collapse missing, duplicated, or malformed values into one shared bucket.
"""

from __future__ import annotations

import json
import math
import threading
import time
from collections import deque
from collections.abc import Callable
from ipaddress import ip_address

from starlette.types import ASGIApp, Message, Receive, Scope, Send

AUTH_RATE_LIMIT_PATHS = frozenset(
    {
        "/api/v1/auth/github/start",
        "/api/v1/auth/github/callback",
        "/api/v1/auth/google/start",
        "/api/v1/auth/google/callback",
        "/api/v1/auth/demo",
    }
)


class RequestBodyTooLarge(RuntimeError):
    """Raised internally when a streamed request exceeds its route limit."""


class SlidingWindowLimiter:
    """Thread-safe sliding window with bounded caller-derived key cardinality."""

    def __init__(
        self,
        limit: int,
        window_seconds: int,
        *,
        max_keys: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.max_keys = max_keys
        self.clock = clock
        self._lock = threading.Lock()
        self._requests: dict[str, deque[float]] = {"__overflow__": deque()}
        self._next_full_prune = 0.0

    def allow(self, key: str) -> tuple[bool, int]:
        """Consume one slot and return ``(allowed, retry_after_seconds)``."""
        now = self.clock()
        cutoff = now - self.window_seconds
        with self._lock:
            attempts = self._requests.get(key)
            if attempts is None:
                if len(self._requests) >= self.max_keys and now >= self._next_full_prune:
                    self._prune(cutoff)
                    self._next_full_prune = now + min(float(self.window_seconds), 5.0)
                if len(self._requests) >= self.max_keys:
                    # Novel-key churn cannot evict active buckets and bypass the limit.
                    key = "__overflow__"
                attempts = self._requests.setdefault(key, deque())
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= self.limit:
                retry_after = max(1, math.ceil(attempts[0] + self.window_seconds - now))
                return False, retry_after
            attempts.append(now)
            return True, 0

    def _prune(self, cutoff: float) -> None:
        for key, attempts in tuple(self._requests.items()):
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if not attempts and key != "__overflow__":
                self._requests.pop(key, None)


class RequestBodyLimitMiddleware:
    """Reject oversized declared or streamed HTTP bodies before application work."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        default_limit: int,
        route_limits: dict[str, int] | None = None,
    ) -> None:
        self.app = app
        self.default_limit = default_limit
        self.route_limits = dict(route_limits or {})

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        limit = self.route_limits.get(scope.get("path", ""), self.default_limit)
        content_length = _content_length(scope)
        if content_length is not None and content_length > limit:
            await _send_limit_response(
                scope,
                send,
                status=413,
                code="request_body_too_large",
                message=f"Request body exceeds the {limit}-byte limit for this route.",
            )
            return

        if content_length is None:
            # Chunked requests have no trustworthy declaration. Read at most limit + one
            # chunk before route parsing, then replay the bounded messages downstream.
            buffered: deque[Message] = deque()
            buffered_bytes = 0
            while True:
                message = await receive()
                buffered.append(message)
                if len(buffered) > 4_096:
                    await _send_limit_response(
                        scope,
                        send,
                        status=413,
                        code="request_body_too_large",
                        message="Chunked request contains too many body fragments.",
                    )
                    return
                if message["type"] == "http.request":
                    buffered_bytes += len(message.get("body", b""))
                    if buffered_bytes > limit:
                        await _send_limit_response(
                            scope,
                            send,
                            status=413,
                            code="request_body_too_large",
                            message=(
                                f"Request body exceeds the {limit}-byte limit for this route."
                            ),
                        )
                        return
                    if not message.get("more_body", False):
                        break
                elif message["type"] == "http.disconnect":
                    break

            async def replay_receive() -> Message:
                if buffered:
                    return buffered.popleft()
                return {"type": "http.disconnect"}

            await self.app(scope, replay_receive, send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    raise RequestBodyTooLarge
            return message

        response_started = False

        async def tracked_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except RequestBodyTooLarge:
            if response_started:  # Defensive: body-consuming routes respond only after parsing.
                raise
            await _send_limit_response(
                scope,
                send,
                status=413,
                code="request_body_too_large",
                message=f"Request body exceeds the {limit}-byte limit for this route.",
            )


class AuthRateLimitMiddleware:
    """Apply per-client auth buckets plus a higher endpoint circuit breaker."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        client_requests_per_window: int,
        global_requests_per_window: int,
        window_seconds: int,
        client_key_mode: str,
        max_client_keys: int,
    ) -> None:
        if client_key_mode not in {"direct", "railway", "render"}:
            raise ValueError("client_key_mode must be direct, railway, or render")
        self.app = app
        self.client_key_mode = client_key_mode
        self.client_limiter = SlidingWindowLimiter(
            client_requests_per_window,
            window_seconds,
            max_keys=max_client_keys,
        )
        self.global_limiter = SlidingWindowLimiter(
            global_requests_per_window,
            window_seconds,
            max_keys=len(AUTH_RATE_LIMIT_PATHS) + 1,
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get("path", "")
        if scope["type"] == "http" and path in AUTH_RATE_LIMIT_PATHS:
            globally_allowed, global_retry = self.global_limiter.allow(path)
            client_key = f"{path}|{_client_identity(scope, self.client_key_mode)}"
            client_allowed, client_retry = self.client_limiter.allow(client_key)
            if not globally_allowed or not client_allowed:
                retry_after = max(global_retry, client_retry, 1)
                await _send_limit_response(
                    scope,
                    send,
                    status=429,
                    code=(
                        "auth_global_rate_limit_exceeded"
                        if not globally_allowed
                        else "rate_limit_exceeded"
                    ),
                    message="Too many authentication attempts. Retry after the indicated delay.",
                    extra_headers=[(b"retry-after", str(retry_after).encode("ascii"))],
                )
                return
        await self.app(scope, receive, send)


def _client_identity(scope: Scope, mode: str) -> str:
    """Return a bounded identity without ever consulting X-Forwarded-For."""
    trusted_header = {
        "railway": b"x-real-ip",
        "render": b"cf-connecting-ip",
    }.get(mode)
    if trusted_header is not None:
        values = [
            value
            for name, value in scope.get("headers", [])
            if name.lower() == trusted_header
        ]
        if len(values) != 1:
            return f"{mode}:unresolved"
        try:
            client_ip = ip_address(values[0].decode("ascii").strip()).compressed
        except (UnicodeDecodeError, ValueError):
            return f"{mode}:unresolved"
        return f"{mode}:{client_ip}"
    client = scope.get("client")
    if not client:
        return "direct:unresolved"
    raw_host = str(client[0]).strip()[:255]
    try:
        raw_host = ip_address(raw_host).compressed
    except ValueError:
        raw_host = raw_host.casefold() or "unresolved"
    return f"direct:{raw_host}"


def _content_length(scope: Scope) -> int | None:
    for name, value in scope.get("headers", []):
        if name.lower() != b"content-length":
            continue
        try:
            parsed = int(value)
        except ValueError:
            return None
        return max(0, parsed)
    return None


async def _send_limit_response(
    scope: Scope,
    send: Send,
    *,
    status: int,
    code: str,
    message: str,
    extra_headers: list[tuple[bytes, bytes]] | None = None,
) -> None:
    state = scope.get("state") or {}
    request_id = str(state.get("request_id") or "unknown")
    body = json.dumps(
        {
            "error": {
                "code": code,
                "message": message,
                "details": [],
                "request_id": request_id,
            }
        },
        separators=(",", ":"),
    ).encode("utf-8")
    headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode("ascii")),
    ]
    headers.extend(extra_headers or [])
    await send({"type": "http.response.start", "status": status, "headers": headers})
    await send({"type": "http.response.body", "body": body})
