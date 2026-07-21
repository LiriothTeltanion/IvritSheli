# Personalization connectors

Google Workspace connectors are separate from Google sign-in. The 2.4 login client requests only `openid profile` and cannot read Calendar, Gmail or Drive. Connector credentials, scopes, consent and production identity allowlists are configured independently; signing in with Google never authorizes mailbox, calendar or file access.

## Consent model

A connector has four states: disconnected, authorized, previewing, and imported. Authorization alone does not import content.

## Google Calendar

Recommended scope: `calendar.readonly`. Event titles, locations, and user-approved descriptions can be converted into context tags and phrase recommendations.

## Gmail

Recommended scope: `gmail.readonly`. The app should list candidate messages locally and require the learner to select a message or snippet. Full mailbox ingestion is prohibited by product design.

## Google Drive

Recommended scope: `drive.readonly`. The learner selects a file before any content is fetched or processed.

## ICS

ICS is the no-account path. The parser unfolds continued lines and extracts summary, description, location, and dates from a local file.

## Redaction

Before optional AI enrichment, redact:

- Email addresses.
- Phone numbers.
- Long numeric identifiers.
- Likely Israeli ID numbers.
- URLs with tokens.
- Street-address patterns where practical.

The preview shows the redacted payload before sending.
