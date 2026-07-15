"""
Module: personalization connectors
Purpose: Preview read-only calendar, Gmail, Drive, and local ICS context behind explicit learner consent.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import base64
import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.normalization import redact_sensitive_text
from ivrit_sheli.repository import iso_now

LOGGER = logging.getLogger(__name__)
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
GOOGLE_GMAIL_MESSAGE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}"
GOOGLE_DRIVE_FILE_URL = "https://www.googleapis.com/drive/v3/files/{file_id}"

CONTEXT_PATTERNS: tuple[tuple[str, tuple[str, ...], tuple[str, ...]], ...] = (
    ("workplace", ("meeting", "standup", "sprint", "interview", "demo", "team", "project"), ("ישיבה", "פגישה", "ראיון", "צוות", "פרויקט")),
    ("medical", ("doctor", "clinic", "hospital", "dentist", "appointment"), ("רופא", "מרפאה", "בית חולים", "תור")),
    ("bureaucracy", ("bank", "municipality", "government", "visa", "insurance", "tax"), ("בנק", "עירייה", "ממשלה", "ביטוח", "מס")),
    ("travel", ("flight", "hotel", "train", "airport", "trip", "travel"), ("טיסה", "מלון", "רכבת", "שדה תעופה", "נסיעה")),
    ("shopping", ("shop", "store", "delivery", "package", "supermarket"), ("חנות", "משלוח", "חבילה", "סופר")),
)

PHRASE_PACKS: dict[str, list[dict[str, str]]] = {
    "workplace": [
        {"hebrew": "אפשר לעבור על זה יחד?", "en": "Can we go over this together?", "es": "¿Podemos revisarlo juntos?"},
        {"hebrew": "אני אטפל בזה.", "en": "I’ll take care of it.", "es": "Me encargaré de eso."},
        {"hebrew": "מה הצעד הבא?", "en": "What is the next step?", "es": "¿Cuál es el siguiente paso?"},
    ],
    "medical": [
        {"hebrew": "אני צריך לקבוע תור.", "en": "I need to schedule an appointment.", "es": "Necesito concertar una cita."},
        {"hebrew": "איפה זה כואב?", "en": "Where does it hurt?", "es": "¿Dónde duele?"},
        {"hebrew": "יש לי מרשם.", "en": "I have a prescription.", "es": "Tengo una receta."},
    ],
    "bureaucracy": [
        {"hebrew": "אילו מסמכים צריך להביא?", "en": "Which documents should I bring?", "es": "¿Qué documentos debo llevar?"},
        {"hebrew": "אפשר לקבל אישור בכתב?", "en": "Can I receive written confirmation?", "es": "¿Puedo recibir confirmación por escrito?"},
        {"hebrew": "לא הבנתי את הסעיף הזה.", "en": "I did not understand this section.", "es": "No entendí esta sección."},
    ],
    "travel": [
        {"hebrew": "מאיזה רציף הרכבת יוצאת?", "en": "Which platform does the train leave from?", "es": "¿De qué andén sale el tren?"},
        {"hebrew": "ההזמנה על שמי.", "en": "The reservation is under my name.", "es": "La reserva está a mi nombre."},
        {"hebrew": "כמה זמן הנסיעה?", "en": "How long is the journey?", "es": "¿Cuánto dura el viaje?"},
    ],
    "shopping": [
        {"hebrew": "אפשר לשלם באשראי?", "en": "Can I pay by card?", "es": "¿Puedo pagar con tarjeta?"},
        {"hebrew": "מתי המשלוח יגיע?", "en": "When will the delivery arrive?", "es": "¿Cuándo llegará la entrega?"},
        {"hebrew": "יש את זה במידה אחרת?", "en": "Do you have this in another size?", "es": "¿Lo tienen en otra talla?"},
    ],
    "daily_life": [
        {"hebrew": "אפשר להגיד את זה שוב?", "en": "Can you say that again?", "es": "¿Puedes decirlo otra vez?"},
        {"hebrew": "לאט יותר, בבקשה.", "en": "More slowly, please.", "es": "Más despacio, por favor."},
        {"hebrew": "למה אתה מתכוון?", "en": "What do you mean?", "es": "¿Qué quieres decir?"},
    ],
}


@dataclass(frozen=True, slots=True)
class ContextPreview:
    """Safe connector preview before importing learning material.

    Args:
        source: Connector name.
        title: Human-readable source title.
        context_label: Detected learning context.
        redacted_excerpt: Bounded PII-reduced text.
        redactions: Applied redaction labels.
        phrases: Suggested trilingual phrase pack.
        metadata: Non-secret source metadata.

    Example:
        >>> ContextPreview("ics", "Demo", "workplace", "Demo", (), [], {}).source
        'ics'
    """

    source: str
    title: str
    context_label: str
    redacted_excerpt: str
    redactions: tuple[str, ...]
    phrases: list[dict[str, str]]
    metadata: dict[str, Any]


class ConnectorError(RuntimeError):
    """Raised when a read-only connector cannot produce a safe preview."""


class GoogleReadOnlyConnector:
    """Minimal direct Google REST adapter for explicitly selected resources.

    Args:
        settings: OAuth credentials or access token.
        session: Optional HTTP session for tests.

    Example:
        Calls require user-provided OAuth configuration and read-only scopes.
    """

    def __init__(
        self, settings: Settings, session: requests.Session | None = None
    ) -> None:
        self.settings = settings
        self.session = session or requests.Session()

    def calendar_preview(self, days: int = 14, max_results: int = 20) -> list[ContextPreview]:
        """Read upcoming primary-calendar event summaries.

        Args:
            days: Look-ahead window.
            max_results: Maximum events.

        Returns:
            Safe event previews.

        Raises:
            ConnectorError: If authentication or HTTP fails.

        Example:
            HTTP behavior is exercised with fake sessions in tests.
        """
        now = datetime.now(timezone.utc)
        payload = self._get_json(
            GOOGLE_CALENDAR_EVENTS_URL,
            params={
                "timeMin": now.isoformat(),
                "timeMax": (now + timedelta(days=days)).isoformat(),
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": str(max_results),
                "fields": "items(id,summary,description,location,start,end,htmlLink)",
            },
        )
        previews: list[ContextPreview] = []
        for event in payload.get("items", []) or []:
            title = str(event.get("summary") or "Untitled event")
            text = "\n".join(
                str(value)
                for value in (title, event.get("location"), event.get("description"))
                if value
            )
            previews.append(
                build_context_preview(
                    "google_calendar",
                    title,
                    text,
                    {
                        "event_id": event.get("id"),
                        "start": (event.get("start") or {}).get("dateTime") or (event.get("start") or {}).get("date"),
                        "end": (event.get("end") or {}).get("dateTime") or (event.get("end") or {}).get("date"),
                    },
                )
            )
        return previews

    def gmail_preview(self, message_id: str) -> ContextPreview:
        """Read one explicitly selected Gmail message.

        Args:
            message_id: Gmail message identifier selected by the user.

        Returns:
            Safe message preview.

        Raises:
            ConnectorError: If message cannot be read.

        Example:
            HTTP behavior is exercised with fake sessions in tests.
        """
        if not message_id.strip():
            raise ValueError("message_id is required")
        payload = self._get_json(
            GOOGLE_GMAIL_MESSAGE_URL.format(message_id=message_id),
            params={"format": "full"},
        )
        headers = {
            str(row.get("name", "")).lower(): str(row.get("value", ""))
            for row in (payload.get("payload") or {}).get("headers", []) or []
        }
        title = headers.get("subject") or "Selected Gmail message"
        body = decode_gmail_payload(payload.get("payload") or {})
        # The connector intentionally excludes sender/recipient fields from AI-ready text.
        text = f"{title}\n{body or payload.get('snippet', '')}"
        return build_context_preview(
            "google_gmail",
            title,
            text,
            {"message_id": message_id, "thread_id": payload.get("threadId")},
        )

    def drive_preview(self, file_id: str) -> ContextPreview:
        """Read metadata and text for one explicitly selected Drive file.

        Args:
            file_id: Drive file identifier selected by the user.

        Returns:
            Safe file preview.

        Raises:
            ConnectorError: If the file cannot be read or is unsupported.

        Example:
            HTTP behavior is exercised with fake sessions in tests.
        """
        if not file_id.strip():
            raise ValueError("file_id is required")
        metadata = self._get_json(
            GOOGLE_DRIVE_FILE_URL.format(file_id=file_id),
            params={"fields": "id,name,mimeType,modifiedTime,webViewLink,size"},
        )
        mime_type = str(metadata.get("mimeType") or "")
        headers = self._headers()
        if mime_type == "application/vnd.google-apps.document":
            url = GOOGLE_DRIVE_FILE_URL.format(file_id=file_id) + "/export"
            response = self.session.get(
                url,
                params={"mimeType": "text/plain"},
                headers=headers,
                timeout=(10, 60),
            )
        elif mime_type.startswith("text/") or mime_type in {"application/json", "text/markdown"}:
            url = GOOGLE_DRIVE_FILE_URL.format(file_id=file_id)
            response = self.session.get(
                url,
                params={"alt": "media"},
                headers=headers,
                timeout=(10, 60),
            )
        else:
            raise ConnectorError(
                "Only Google Docs, text, Markdown, and JSON files are supported for previews"
            )
        try:
            response.raise_for_status()
        except requests.RequestException as error:
            raise ConnectorError(f"Google Drive file read failed: {error}") from error
        title = str(metadata.get("name") or "Selected Drive file")
        return build_context_preview(
            "google_drive",
            title,
            response.text[:50_000],
            {
                "file_id": file_id,
                "mime_type": mime_type,
                "modified_time": metadata.get("modifiedTime"),
            },
        )

    def _get_json(self, url: str, params: dict[str, str]) -> dict[str, Any]:
        """Perform one authenticated Google GET request.

        Args:
            url: Google REST endpoint.
            params: Query parameters.

        Returns:
            Decoded JSON object.

        Raises:
            ConnectorError: If request or decoding fails.

        Example:
            Used by all Google preview methods.
        """
        try:
            response = self.session.get(
                url,
                params=params,
                headers=self._headers(),
                timeout=(10, 60),
            )
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as error:
            raise ConnectorError(f"Google read-only request failed: {error}") from error
        if not isinstance(payload, dict):
            raise ConnectorError("Google returned an unexpected response shape")
        return payload

    def _headers(self) -> dict[str, str]:
        """Build authorization headers, refreshing when needed.

        Returns:
            HTTP headers.

        Raises:
            ConnectorError: If OAuth credentials are unavailable.

        Example:
            Used internally before REST requests.
        """
        token = self.settings.google_access_token or self._refresh_access_token()
        return {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    def _refresh_access_token(self) -> str:
        """Exchange a refresh token for a short-lived access token.

        Returns:
            Access token.

        Raises:
            ConnectorError: If OAuth settings or token exchange fail.

        Example:
            HTTP behavior is exercised with fake sessions in tests.
        """
        required = (
            self.settings.google_client_id,
            self.settings.google_client_secret,
            self.settings.google_refresh_token,
        )
        if not all(required):
            raise ConnectorError("Google OAuth read-only credentials are not configured")
        try:
            response = self.session.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.settings.google_client_id,
                    "client_secret": self.settings.google_client_secret,
                    "refresh_token": self.settings.google_refresh_token,
                    "grant_type": "refresh_token",
                },
                timeout=(10, 30),
            )
            response.raise_for_status()
            token = str(response.json().get("access_token") or "")
        except (requests.RequestException, ValueError) as error:
            raise ConnectorError(f"Google OAuth refresh failed: {error}") from error
        if not token:
            raise ConnectorError("Google OAuth response did not include an access token")
        return token


class ConnectorService:
    """Track local connector state and import approved phrase suggestions.

    Args:
        settings: Application settings.
        database: Learner database.
        google: Optional Google adapter override.

    Example:
        >>> from pathlib import Path
        >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
        >>> db = Database(Path(":memory:")); db.initialize()
        >>> len(ConnectorService(settings, db).states()) >= 4
        True
    """

    CONNECTOR_NAMES = ("ics", "google_calendar", "google_gmail", "google_drive")

    def __init__(
        self,
        settings: Settings,
        database: Database,
        google: GoogleReadOnlyConnector | None = None,
    ) -> None:
        self.settings = settings
        self.database = database
        self.google = google or GoogleReadOnlyConnector(settings)
        self._ensure_rows()

    def states(self) -> list[dict[str, Any]]:
        """Return local connector states without tokens.

        Returns:
            Connector status rows.

        Example:
            >>> from pathlib import Path
            >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> ConnectorService(settings, db).states()[0]["status"]
            'available'
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            return [
                {
                    **dict(row),
                    "scopes": json.loads(row["scopes_json"]),
                    "metadata": json.loads(row["metadata_json"]),
                }
                for row in connection.execute(
                    "SELECT * FROM connector_states ORDER BY connector"
                ).fetchall()
            ]
        finally:
            if should_close:
                connection.close()

    def preview_ics(self, source: Path) -> list[ContextPreview]:
        """Parse a local ICS file into safe event previews.

        Args:
            source: Calendar file selected by the user.

        Returns:
            Safe event context previews.

        Raises:
            FileNotFoundError: If source does not exist.
            ValueError: If file is too large.

        Example:
            Parsing behavior is covered with a temporary fixture in tests.
        """
        if not source.exists():
            raise FileNotFoundError(f"ICS file not found: {source}")
        if source.stat().st_size > 5 * 1024 * 1024:
            raise ValueError("ICS preview is limited to 5 MB")
        events = parse_ics(source.read_text(encoding="utf-8", errors="replace"))
        previews = [
            build_context_preview(
                "ics",
                event.get("summary") or "Untitled event",
                "\n".join(
                    str(event.get(key) or "")
                    for key in ("summary", "location", "description")
                ),
                {
                    "start": event.get("dtstart"),
                    "end": event.get("dtend"),
                    "uid": event.get("uid"),
                },
            )
            for event in events[:100]
        ]
        self._touch("ics", "available", ["local_file"], {"events": len(previews)})
        return previews

    def preview_google(self, service: str, resource_id: str = "") -> list[ContextPreview]:
        """Preview a bounded Google resource through a read-only adapter.

        Args:
            service: `calendar`, `gmail`, or `drive`.
            resource_id: Required message/file ID for Gmail and Drive.

        Returns:
            One or more safe previews.

        Raises:
            ValueError: If service is unsupported.
            ConnectorError: If Google cannot be read.

        Example:
            HTTP behavior is exercised with fake sessions in tests.
        """
        if service == "calendar":
            previews = self.google.calendar_preview()
            connector = "google_calendar"
            scopes = ["calendar.readonly"]
        elif service == "gmail":
            previews = [self.google.gmail_preview(resource_id)]
            connector = "google_gmail"
            scopes = ["gmail.readonly"]
        elif service == "drive":
            previews = [self.google.drive_preview(resource_id)]
            connector = "google_drive"
            scopes = ["drive.readonly"]
        else:
            raise ValueError("service must be calendar, gmail, or drive")
        self._touch(connector, "connected", scopes, {"preview_count": len(previews)})
        return previews

    def _ensure_rows(self) -> None:
        """Create non-secret connector-state rows.

        Returns:
            None.

        Example:
            Called by the constructor.
        """
        with self.database.transaction() as connection:
            for name in self.CONNECTOR_NAMES:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO connector_states(
                        connector, status, scopes_json, metadata_json
                    ) VALUES(?, 'available', '[]', '{}')
                    """,
                    (name,),
                )

    def _touch(
        self, connector: str, status: str, scopes: list[str], metadata: dict[str, Any]
    ) -> None:
        """Update safe connector metadata.

        Args:
            connector: Connector key.
            status: Local status label.
            scopes: Human-readable read-only scope labels.
            metadata: Non-secret counts and state.

        Returns:
            None.

        Example:
            Used after successful previews.
        """
        with self.database.transaction() as connection:
            connection.execute(
                """
                INSERT INTO connector_states(
                    connector, status, scopes_json, last_sync_at, consent_at, metadata_json
                ) VALUES(?, ?, ?, ?, ?, ?)
                ON CONFLICT(connector) DO UPDATE SET
                    status = excluded.status,
                    scopes_json = excluded.scopes_json,
                    last_sync_at = excluded.last_sync_at,
                    consent_at = excluded.consent_at,
                    metadata_json = excluded.metadata_json
                """,
                (
                    connector,
                    status,
                    json.dumps(scopes),
                    iso_now(),
                    iso_now(),
                    json.dumps(metadata),
                ),
            )


def build_context_preview(
    source: str, title: str, text: str, metadata: dict[str, Any]
) -> ContextPreview:
    """Create a redacted, classified, bounded connector preview.

    Args:
        source: Connector key.
        title: Display title.
        text: Selected source text.
        metadata: Safe source identifiers/dates.

    Returns:
        Context preview.

    Example:
        >>> build_context_preview("ics", "Team meeting", "Sprint planning", {}).context_label
        'workplace'
    """
    redacted, redactions = redact_sensitive_text(text)
    context = detect_context(redacted)
    return ContextPreview(
        source=source,
        title=title[:200],
        context_label=context,
        redacted_excerpt=redacted[:2000],
        redactions=tuple(redactions),
        phrases=PHRASE_PACKS.get(context, PHRASE_PACKS["daily_life"]),
        metadata=metadata,
    )


def detect_context(text: str) -> str:
    """Classify selected text into a practical Hebrew-learning context.

    Args:
        text: Redacted source text.

    Returns:
        Context label.

    Example:
        >>> detect_context("Doctor appointment")
        'medical'
    """
    lowered = text.lower()
    for label, english_terms, hebrew_terms in CONTEXT_PATTERNS:
        if any(term in lowered for term in english_terms) or any(term in text for term in hebrew_terms):
            return label
    return "daily_life"


def parse_ics(text: str) -> list[dict[str, str]]:
    """Parse a safe VEVENT subset without a heavy calendar dependency.

    Args:
        text: ICS content.

    Returns:
        Event dictionaries with decoded common fields.

    Example:
        >>> parse_ics("BEGIN:VEVENT\nSUMMARY:Demo\nEND:VEVENT")[0]["summary"]
        'Demo'
    """
    # RFC 5545 folds long lines by beginning the next physical line with whitespace.
    unfolded = re.sub(r"\r?\n[ \t]", "", text)
    events: list[dict[str, str]] = []
    for block in re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", unfolded, re.DOTALL | re.IGNORECASE):
        event: dict[str, str] = {}
        for raw_line in block.splitlines():
            line = raw_line.strip("\r")
            if ":" not in line:
                continue
            raw_key, raw_value = line.split(":", 1)
            key = raw_key.split(";", 1)[0].lower()
            if key not in {"summary", "description", "location", "dtstart", "dtend", "uid"}:
                continue
            value = (
                raw_value.replace("\\n", "\n")
                .replace("\\,", ",")
                .replace("\\;", ";")
                .replace("\\\\", "\\")
            )
            event[key] = value[:10_000]
        if event:
            events.append(event)
    return events


def decode_gmail_payload(payload: dict[str, Any]) -> str:
    """Extract bounded plain text from a Gmail MIME payload.

    Args:
        payload: Gmail API message payload.

    Returns:
        Decoded text, preferring text/plain.

    Example:
        >>> encoded = base64.urlsafe_b64encode(b"Hello").decode()
        >>> decode_gmail_payload({"mimeType": "text/plain", "body": {"data": encoded}})
        'Hello'
    """
    mime_type = str(payload.get("mimeType") or "")
    data = (payload.get("body") or {}).get("data")
    if mime_type == "text/plain" and data:
        try:
            return base64.urlsafe_b64decode(str(data) + "===").decode("utf-8", errors="replace")[:50_000]
        except (ValueError, TypeError):
            return ""
    parts = payload.get("parts") or []
    for part in parts:
        text = decode_gmail_payload(part)
        if text:
            return text
    # HTML is not returned as-is; stripping tags avoids injecting markup into the UI.
    if mime_type == "text/html" and data:
        try:
            html = base64.urlsafe_b64decode(str(data) + "===").decode("utf-8", errors="replace")
            return re.sub(r"<[^>]+>", " ", html)[:50_000]
        except (ValueError, TypeError):
            return ""
    return ""
