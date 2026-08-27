"""
Module: package verifier
Purpose: Validate the distributable repository structure, documentation, assets, and secret hygiene.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import ast
import hashlib
import json
import re
import subprocess
import sys
from datetime import date
from ipaddress import ip_address
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit
from xml.etree import ElementTree

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python 3.10 CI uses the pinned backport.
    import tomli as tomllib

ROOT = Path(__file__).resolve().parents[1]
SEMANTIC_VERSION_PATTERN = re.compile(r"\d+\.\d+\.\d+")
SOURCE_STATUSES = frozenset({"private-candidate", "published-source-release"})
DURABLE_DEMO_STATUSES = frozenset({"unavailable", "staging-verified", "verified-live"})


def source_version() -> str:
    """Return the packaged executable version from backend project metadata."""
    try:
        package = tomllib.loads((ROOT / "backend" / "pyproject.toml").read_text(encoding="utf-8"))
        version = package.get("project", {}).get("version")
    except (OSError, tomllib.TOMLDecodeError) as error:
        raise RuntimeError(f"cannot read source version: {error}") from error
    if not isinstance(version, str) or SEMANTIC_VERSION_PATTERN.fullmatch(version) is None:
        raise RuntimeError(f"invalid backend project version: {version!r}")
    return version


def _semantic_version_tuple(value: object, *, prefix: str = "") -> tuple[int, int, int] | None:
    """Return a comparable semantic-version tuple for strict public metadata."""
    if not isinstance(value, str):
        return None
    candidate = value.removeprefix(prefix) if prefix else value
    if SEMANTIC_VERSION_PATTERN.fullmatch(candidate) is None:
        return None
    return tuple(int(part) for part in candidate.split("."))  # type: ignore[return-value]


def _is_iso_date(value: object) -> bool:
    """Return whether a manifest value is an exact ISO calendar date."""
    if not isinstance(value, str):
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def _is_public_https_url(value: object) -> bool:
    """Accept a public-looking HTTPS origin; availability still needs a live probe."""
    if not isinstance(value, str):
        return False
    parsed = urlsplit(value)
    hostname = parsed.hostname
    if not (
        parsed.scheme == "https"
        and hostname
        and parsed.username is None
        and parsed.password is None
        and parsed.path in {"", "/"}
        and not parsed.query
        and not parsed.fragment
    ):
        return False
    try:
        return ip_address(hostname).is_global
    except ValueError:
        public_hostname = hostname.rstrip(".")
        return bool(
            re.fullmatch(
                r"(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+"
                r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?",
                public_hostname,
            )
        )

REQUIRED_FILES = (
    "README.md",
    "NOVA_HANDOFF.md",
    "NOVA_PHASE4_REPORT.md",
    "AGENTS.md",
    "START_PRIVATE_PILOT.bat",
    "portfolio/project.json",
    "PACKAGE_MANIFEST.md",
    "TEST_REPORT.md",
    "PRIVACY.md",
    "TERMS.md",
    "CITATION.cff",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "SECURITY.md",
    ".env.example",
    ".github/dependabot.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/codeql.yml",
    "Dockerfile",
    "docker-compose.yml",
    "railway.toml",
    "railway-staging.toml",
    "railway-reminders.toml",
    "render.yaml",
    "backend/pyproject.toml",
    "backend/alembic.ini",
    "backend/migrations/versions/20260716_0001_cloud_identity_and_state.py",
    "backend/migrations/versions/20260718_0002_google_identity_and_oauth_provider.py",
    "backend/migrations/versions/20260727_0003_private_push_subscriptions.py",
    "backend/migrations/versions/20260727_0004_push_endpoint_ownership.py",
    "backend/migrations/versions/20260727_0005_safe_push_endpoint_transfer.py",
    "backend/src/ivrit_sheli/api.py",
    "backend/src/ivrit_sheli/auth.py",
    "backend/src/ivrit_sheli/cloud_repository.py",
    "backend/src/ivrit_sheli/cloud_store.py",
    "backend/src/ivrit_sheli/audio.py",
    "backend/src/ivrit_sheli/self_hosted_speech.py",
    "backend/src/ivrit_sheli/coach_patterns.py",
    "backend/src/ivrit_sheli/learner_model.py",
    "backend/src/ivrit_sheli/local_personal_coach.py",
    "backend/src/ivrit_sheli/push_notifications.py",
    "backend/src/ivrit_sheli/learning_core.py",
    "backend/src/ivrit_sheli/local_learning_engine.py",
    "backend/src/ivrit_sheli/hebrew_alphabet.py",
    "backend/src/ivrit_sheli/visual_spotlight.py",
    "backend/src/ivrit_sheli/repository.py",
    "backend/src/ivrit_sheli/starter_lexicon_v2.py",
    "backend/src/ivrit_sheli/starter_lexicon_v3.py",
    "backend/src/ivrit_sheli/starter_lexicon_v4.py",
    "backend/src/ivrit_sheli/STARTER_LEXICON_V4_NOTES.md",
    "backend/src/ivrit_sheli/starter_lexicon_validation.py",
    "backend/src/ivrit_sheli/db_admin.py",
    "backend/src/ivrit_sheli/request_limits.py",
    "backend/src/ivrit_sheli/api_dictionary.py",
    "backend/src/ivrit_sheli/structured_logging.py",
    "backend/tests/test_daily_practice.py",
    "backend/tests/test_learning_engines.py",
    "backend/tests/test_alphabet_studio.py",
    "backend/tests/test_visual_catalog.py",
    "backend/tests/test_visual_spotlight.py",
    "backend/tests/test_self_hosted_speech.py",
    "backend/tests/test_local_personal_coach.py",
    "backend/tests/test_listening_coach_v29.py",
    "backend/tests/test_push_notifications.py",
    "backend/tests/test_package_checksums.py",
    "frontend/package-lock.json",
    "frontend/playwright.config.ts",
    "frontend/e2e/experience.spec.ts",
    "frontend/e2e/fixtures.ts",
    "frontend/e2e/runtime.setup.ts",
    "frontend/src/App.tsx",
    "frontend/src/components/AuthGate.tsx",
    "frontend/src/components/AuthGate.test.tsx",
    "frontend/src/components/PreAccountLesson.tsx",
    "frontend/src/components/PreAccountLesson.test.tsx",
    "frontend/src/components/BeginnerOnboarding.tsx",
    "frontend/src/components/FirstStepsLesson.tsx",
    "frontend/src/components/CategoryWordIllustration.tsx",
    "frontend/src/components/CategoryWordIllustration.test.tsx",
    "frontend/src/components/category-word-illustration.css",
    "frontend/src/components/CurriculumPath.tsx",
    "frontend/src/components/CurriculumPath.test.tsx",
    "frontend/src/components/curriculum-path.css",
    "frontend/src/components/AlphabetStudio.tsx",
    "frontend/src/components/AlphabetStudio.test.tsx",
    "frontend/src/components/alphabet-studio.css",
    "frontend/src/components/DictionaryVisualCue.tsx",
    "frontend/src/components/SemanticWordIllustration.tsx",
    "frontend/src/components/SemanticWordIllustration.test.tsx",
    "frontend/src/components/semantic-scenes/CommunicationScenes.tsx",
    "frontend/src/components/semantic-scenes/AutonomyScenes.tsx",
    "frontend/src/components/semantic-scenes/RegisterScenes.tsx",
    "frontend/src/release.ts",
    "frontend/src/hooks/useOnlineStatus.ts",
    "frontend/src/hooks/usePersistentTheme.ts",
    "frontend/src/hooks/usePersistentTheme.test.tsx",
    "frontend/src/locales/en.ts",
    "frontend/src/locales/es.ts",
    "frontend/src/locales/he.ts",
    "frontend/src/locales/codeLabels.ts",
    "frontend/src/locales/localeParity.test.ts",
    "frontend/src/premium-polish.css",
    "frontend/src/components/semantic-word-illustration.css",
    "frontend/src/components/semantic-scenes/CoreDailyScenes.tsx",
    "frontend/src/components/semantic-scenes/CoreGreetingTimeScenes.tsx",
    "frontend/src/components/semantic-scenes/FamilyPlaceScenes.tsx",
    "frontend/src/components/semantic-scenes/FamilyRelationshipScenes.tsx",
    "frontend/src/components/semantic-scenes/FoodHomeScenes.tsx",
    "frontend/src/components/semantic-scenes/GreetingTimeScenes.tsx",
    "frontend/src/components/semantic-scenes/NumberScenes.tsx",
    "frontend/src/components/semantic-scenes/SemanticScenePrimitives.tsx",
    "frontend/src/components/VisualQAGallery.tsx",
    "frontend/src/components/VisualQAGallery.test.tsx",
    "frontend/src/components/visual-qa-gallery.css",
    "frontend/src/visuals/a0VisualRecipes.ts",
    "frontend/src/components/MicWordAnalyzer.tsx",
    "frontend/src/components/ProfileMenu.tsx",
    "frontend/src/components/ProfileMenu.test.tsx",
    "frontend/src/components/FinishVisitDialog.tsx",
    "frontend/src/components/VisitFinished.tsx",
    "frontend/src/components/IvritSheliWordmark.tsx",
    "frontend/src/components/IvritHebraicLetters.tsx",
    "frontend/src/components/ivrit-sheli-wordmark.css",
    "frontend/src/savedAccounts.ts",
    "frontend/src/savedAccounts.test.ts",
    "frontend/src/components/AudioPractice.tsx",
    "frontend/src/components/AudioPractice.test.tsx",
    "frontend/src/components/PersonalCoachCard.tsx",
    "frontend/src/components/PersonalCoachCard.test.tsx",
    "frontend/src/components/PersonalizationSettingsCard.tsx",
    "frontend/src/components/ReminderSettingsCard.tsx",
    "frontend/src/deviceAudioStorage.ts",
    "frontend/src/deviceAudioStorage.test.ts",
    "frontend/src/pushNotifications.ts",
    "frontend/src/pushNotifications.test.ts",
    "frontend/src/components/DictionaryDrawer.tsx",
    "frontend/src/components/DictionaryDrawer.test.tsx",
    "frontend/src/components/RegistryPanel.tsx",
    "frontend/src/components/IvritSheliBrandLockup.tsx",
    "frontend/src/components/LivingHebrewAtlas.tsx",
    "frontend/src/components/AtlasRegionVocabulary.tsx",
    "frontend/src/components/DailyPracticeSession.tsx",
    "frontend/src/components/DailyPracticeSession.test.tsx",
    "frontend/src/components/LearningCoreJourney.tsx",
    "frontend/src/components/LearningSkillMap.tsx",
    "frontend/src/learnerMode.ts",
    "frontend/src/achievement-progress.css",
    "frontend/src/learner-mode.css",
    "frontend/src/v25-private-pilot.css",
    "frontend/src/components/practice-motivation.css",
    "frontend/src/voicePreference.ts",
    "frontend/src/voicePreference.test.ts",
    "frontend/src/platform.ts",
    "frontend/src/platform.test.ts",
    "frontend/src/starterWords.ts",
    "frontend/public/manifest.webmanifest",
    "frontend/public/content/starter-dictionary-v2.8.json",
    "frontend/public/illustrations/regions/galilee.webp",
    "frontend/public/illustrations/regions/haifa-carmel.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa.webp",
    "frontend/public/illustrations/regions/jerusalem.webp",
    "frontend/public/illustrations/regions/dead-sea.webp",
    "frontend/public/illustrations/regions/negev.webp",
    "frontend/public/assets/illustrations/israel-living-atlas-v2.5.webp",
    "frontend/public/illustrations/regions/galilee-field-notes.webp",
    "frontend/public/illustrations/regions/galilee-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/haifa-carmel-field-notes.webp",
    "frontend/public/illustrations/regions/haifa-carmel-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/jerusalem-field-notes.webp",
    "frontend/public/illustrations/regions/jerusalem-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/dead-sea-field-notes.webp",
    "frontend/public/illustrations/regions/dead-sea-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/negev-field-notes.webp",
    "frontend/public/illustrations/regions/negev-field-notes-portrait.webp",
    "frontend/public/assets/illustrations/israel-living-atlas-field-notes.webp",
    "docs/ULTIMATE_BUILD_SPEC.md",
    "docs/ARCHITECTURE.md",
    "docs/ARCHITECTURE_CONSOLIDATION.md",
    "docs/AI_ENGINE.md",
    "docs/DICTIONARY.md",
    "docs/AUDIO.md",
    "docs/GAMIFICATION.md",
    "docs/PERSONALIZATION.md",
    "docs/COMPETITIVE_BENCHMARK_2026.md",
    "docs/VOCABULARY_ILLUSTRATION_SYSTEM.md",
    "docs/PRODUCT_MANIFESTO.md",
    "docs/LEARNING_SCIENCE.md",
    "docs/LEARNING_CORE_V2_6.md",
    "docs/HEBREW_ALPHABET_STUDIO.md",
    "docs/HEBREW_CONTENT_PROVENANCE.md",
    "docs/DESIGN_SYSTEM.md",
    "docs/VISUAL_BIBLE.md",
    "docs/VISUAL_ASSET_MANIFEST.md",
    "docs/CONNECTORS.md",
    "docs/API.md",
    "docs/DEPLOYMENT.md",
    "docs/USER_GUIDE.md",
    "docs/DEMO_DAY.md",
    "docs/PLAYWRIGHT_RUNBOOK.md",
    "docs/candidates/v2.12.3.md",
    "docs/BUILD_WEEK.md",
    "assets/brand/wordmark-nocturne.svg",
    "assets/brand/kc-lt-signature.svg",
    "assets/readme/cloud-architecture.svg",
    "assets/readme/proof/2.12.3/manifest.json",
    "assets/readme/proof/2.12.3/alphabet-desktop-light-es.webp",
    "assets/readme/proof/2.12.3/dictionary-desktop-dark-es.webp",
    "assets/readme/proof/2.12.3/today-desktop-dark-es.webp",
    "assets/readme/proof/2.12.3/today-desktop-dark-he.webp",
    "assets/readme/proof/2.12.3/today-phone-light-es.webp",
    "assets/readme/proof/2.12.3/ivrit-sheli-tour.gif",
    "assets/readme/ivrit-sheli-2-dashboard.png",
    "assets/readme/ivrit-sheli-2-mobile.png",
    "assets/readme/ivrit-sheli-2-hebrew-rtl.png",
    "assets/readme/ivrit-sheli-2.8-dashboard.png",
    "assets/readme/ivrit-sheli-2.8-hebrew-rtl.png",
    "assets/readme/ivrit-sheli-2.8-journey.gif",
    "assets/readme/ivrit-sheli-2.8-mobile.png",
    "assets/readme/ivrit-sheli-2.8-welcome.png",
    "assets/social/ivrit-sheli-social-preview.svg",
    "assets/social/ivrit-sheli-social-preview.png",
    "scripts/docker-entrypoint.sh",
    "scripts/drop_privileges.py",
    "scripts/start.ps1",
    "scripts/build_release_archive.py",
    "scripts/export_pwa_starter_content.py",
    "scripts/verify_container_logs.py",
    "frontend/public/notes/CANDIDATE_2.12.3.md",
)

PUBLIC_REGION_ART = (
    "frontend/public/illustrations/regions/galilee-field-notes.webp",
    "frontend/public/illustrations/regions/galilee-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/haifa-carmel-field-notes.webp",
    "frontend/public/illustrations/regions/haifa-carmel-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/jerusalem-field-notes.webp",
    "frontend/public/illustrations/regions/jerusalem-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/dead-sea-field-notes.webp",
    "frontend/public/illustrations/regions/dead-sea-field-notes-portrait.webp",
    "frontend/public/illustrations/regions/negev-field-notes.webp",
    "frontend/public/illustrations/regions/negev-field-notes-portrait.webp",
    "frontend/public/assets/illustrations/israel-living-atlas-field-notes.webp",
)

SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
)
FORBIDDEN_PUBLIC_CONTENT_FIELDS = frozenset(
    {
        "csrf",
        "email",
        "learning_due_state",
        "learning_item_id",
        "learning_status",
        "profile_id",
        "session_id",
        "token",
        "user_id",
    }
)


def verify_required_files() -> list[str]:
    """Return missing required package paths.

    Returns:
        Relative paths that do not exist.

    Example:
        >>> isinstance(verify_required_files(), list)
        True
    """
    return [relative for relative in REQUIRED_FILES if not (ROOT / relative).is_file()]


def verify_json_files() -> list[str]:
    """Parse package JSON metadata that must remain valid.

    Returns:
        Human-readable validation failures.

    Example:
        >>> isinstance(verify_json_files(), list)
        True
    """
    failures: list[str] = []
    for relative in (
        "frontend/package.json",
        "frontend/public/manifest.webmanifest",
        "frontend/public/content/starter-dictionary-v2.8.json",
        "portfolio/project.json",
        "assets/readme/proof/2.12.3/manifest.json",
    ):
        try:
            json.loads((ROOT / relative).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            failures.append(f"{relative}: {error}")
    return failures


def verify_readme_visual_proof() -> list[str]:
    """Bind the README's current visual proof to its reviewed bytes and truth state."""
    try:
        current_version = source_version()
        portfolio = json.loads(
            (ROOT / "portfolio" / "project.json").read_text(encoding="utf-8")
        )
        manifest_path = (
            ROOT / "assets" / "readme" / "proof" / current_version / "manifest.json"
        )
        manifest_text = manifest_path.read_text(encoding="utf-8")
        manifest = json.loads(manifest_text)
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError, RuntimeError) as error:
        return [f"current README visual proof could not be read: {error}"]

    failures: list[str] = []
    source_status = portfolio.get("source_status")
    expected_publication = (
        "private-candidate"
        if source_status == "private-candidate"
        else "published-source-release"
    )
    expected_scalars = {
        "schema_version": 3,
        "source_version": current_version,
        "publication_status": expected_publication,
        "latest_published_release": portfolio.get("latest_published_release"),
        "status": "approved_for_readme_use",
        "asset_count": 6,
    }
    for key, expected in expected_scalars.items():
        if manifest.get(key) != expected:
            failures.append(
                f"{manifest_path.relative_to(ROOT).as_posix()}: {key} must be {expected!r}"
            )

    if re.search(r"[A-Za-z]:[\\/]", manifest_text):
        failures.append("current README visual proof leaks an absolute Windows path")

    expected_files = {
        "alphabet-desktop-light-es.webp",
        "dictionary-desktop-dark-es.webp",
        "today-desktop-dark-es.webp",
        "today-desktop-dark-he.webp",
        "today-phone-light-es.webp",
        "ivrit-sheli-tour.gif",
    }
    assets = manifest.get("assets")
    if not isinstance(assets, list):
        return failures + ["current README visual proof assets must be a list"]
    names = [asset.get("file") for asset in assets if isinstance(asset, dict)]
    if len(assets) != len(expected_files) or set(names) != expected_files:
        failures.append("current README visual proof must list the exact six reviewed assets")
    if len(names) != len(set(names)):
        failures.append("current README visual proof contains duplicate asset names")

    proof_root = manifest_path.parent
    for asset in assets:
        if not isinstance(asset, dict):
            failures.append("current README visual proof contains a non-object asset")
            continue
        name = asset.get("file")
        digest = asset.get("sha256")
        byte_count = asset.get("bytes")
        alt = asset.get("alt")
        dimensions = asset.get("dimensions")
        if name not in expected_files:
            continue
        if not isinstance(digest, str) or re.fullmatch(r"[0-9A-F]{64}", digest) is None:
            failures.append(f"current README visual proof has an invalid digest for {name}")
            continue
        path = proof_root / name
        try:
            payload = path.read_bytes()
        except OSError as error:
            failures.append(f"current README visual proof cannot read {name}: {error}")
            continue
        if hashlib.sha256(payload).hexdigest().upper() != digest:
            failures.append(f"current README visual proof digest mismatch for {name}")
        if not isinstance(byte_count, int) or byte_count != len(payload):
            failures.append(f"current README visual proof byte count mismatch for {name}")
        if (
            not isinstance(dimensions, dict)
            or not isinstance(dimensions.get("width"), int)
            or not isinstance(dimensions.get("height"), int)
            or dimensions["width"] <= 0
            or dimensions["height"] <= 0
        ):
            failures.append(f"current README visual proof dimensions are invalid for {name}")
        if not isinstance(alt, str) or not alt.strip():
            failures.append(f"current README visual proof alt text is missing for {name}")
        readme_path = f"assets/readme/proof/{current_version}/{name}"
        if readme_path not in readme:
            failures.append(f"README.md does not reference reviewed proof asset {readme_path}")
        if name.endswith(".gif"):
            if asset.get("loop_policy") != "no-loop":
                failures.append("current README tour GIF must declare no-loop")
            if b"NETSCAPE2.0" in payload or b"ANIMEXTS1.0" in payload:
                failures.append("current README tour GIF contains a looping extension")
    return failures


def _verify_exact_keys(
    value: object, expected_keys: set[str], location: str
) -> tuple[dict[str, object] | None, list[str]]:
    """Validate that a manifest object has exactly the public contract keys."""
    if not isinstance(value, dict):
        return None, [f"portfolio/project.json: {location} must be an object"]
    actual_keys = set(value)
    failures: list[str] = []
    if missing := sorted(expected_keys - actual_keys):
        failures.append(
            f"portfolio/project.json: {location} missing keys: {', '.join(missing)}"
        )
    if unexpected := sorted(actual_keys - expected_keys):
        failures.append(
            f"portfolio/project.json: {location} has unexpected keys: {', '.join(unexpected)}"
        )
    return value, failures


def verify_portfolio_manifest() -> list[str]:
    """Keep source, publication, historical hosting, and current availability distinct."""
    path = ROOT / "portfolio" / "project.json"
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
        current_version = source_version()
    except (OSError, json.JSONDecodeError, RuntimeError) as error:
        return [f"portfolio/project.json: {error}"]

    top_level, failures = _verify_exact_keys(
        manifest,
        {
            "schema", "slug", "name", "source_version", "source_status",
            "latest_published_release", "default_branch", "repository_url",
            "durable_demo", "summary", "languages", "standard_stack",
            "optional_capabilities", "tests", "historical_deployment", "publication",
            "candidate", "visual_proof", "oauth", "privacy",
        },
        "root",
    )
    if top_level is None:
        return failures

    expected_scalars = {
        "schema": "ivrit-sheli-portfolio-project-v3",
        "slug": "ivrit-sheli",
        "name": "Ivrit Sheli — העברית שלי",
        "source_version": current_version,
        "default_branch": "main",
        "repository_url": "https://github.com/LiriothTeltanion/IvritSheli",
    }
    for key, expected in expected_scalars.items():
        if top_level.get(key) != expected:
            failures.append(
                f"portfolio/project.json: {key} must be {expected!r}, got {top_level.get(key)!r}"
            )

    source_status = top_level.get("source_status")
    if source_status not in SOURCE_STATUSES:
        failures.append(
            "portfolio/project.json: source_status must be private-candidate or "
            "published-source-release"
        )
    latest_published_release = top_level.get("latest_published_release")
    latest_version_tuple = _semantic_version_tuple(latest_published_release, prefix="v")
    current_version_tuple = _semantic_version_tuple(current_version)
    if latest_version_tuple is None:
        failures.append(
            "portfolio/project.json: latest_published_release must be a v-prefixed semantic version"
        )
    elif source_status == "published-source-release" and latest_published_release != f"v{current_version}":
        failures.append(
            "portfolio/project.json: a published source version must equal latest_published_release"
        )
    elif (
        source_status == "private-candidate"
        and current_version_tuple is not None
        and latest_version_tuple >= current_version_tuple
    ):
        failures.append(
            "portfolio/project.json: a private candidate must be newer than latest_published_release"
        )

    durable_demo, nested = _verify_exact_keys(
        top_level.get("durable_demo"),
        {"url", "status", "provider", "last_checked_on", "boundary"},
        "durable_demo",
    )
    failures.extend(nested)
    demo_status: object = None
    demo_available = False
    if durable_demo is not None:
        demo_status = durable_demo.get("status")
        if demo_status not in DURABLE_DEMO_STATUSES:
            failures.append(
                "portfolio/project.json: durable_demo.status must be unavailable, "
                "staging-verified, or verified-live"
            )
        demo_available = demo_status in {"staging-verified", "verified-live"}
        demo_url = durable_demo.get("url")
        demo_provider = durable_demo.get("provider")
        if demo_status == "unavailable":
            if demo_url is not None:
                failures.append(
                    "portfolio/project.json: durable_demo.url must be null while the demo is unavailable"
                )
            if demo_provider is not None:
                failures.append(
                    "portfolio/project.json: durable_demo.provider must be null while the demo is unavailable"
                )
        elif demo_available:
            if not _is_public_https_url(demo_url):
                failures.append(
                    "portfolio/project.json: a verified durable demo requires a public HTTPS URL "
                    "without credentials, query parameters, or fragments"
                )
            if not isinstance(demo_provider, str) or not demo_provider.strip():
                failures.append(
                    "portfolio/project.json: a verified durable demo requires a named provider"
                )
        if not _is_iso_date(durable_demo.get("last_checked_on")):
            failures.append(
                "portfolio/project.json: durable_demo.last_checked_on must be an ISO calendar date"
            )
        boundary = durable_demo.get("boundary")
        if not isinstance(boundary, str) or len(boundary.strip()) < 100:
            failures.append(
                "portfolio/project.json: durable_demo.boundary must explain the current hosting limit"
            )

    serialized_manifest = json.dumps(manifest, ensure_ascii=False).lower()
    if "trycloudflare.com" in serialized_manifest:
        failures.append(
            "portfolio/project.json: ephemeral Cloudflare Quick Tunnel URLs must not be hard-coded"
        )

    summary = top_level.get("summary")
    if not isinstance(summary, str) or not 80 <= len(summary) <= 300:
        failures.append("portfolio/project.json: summary must contain 80-300 public characters")
    elif current_version not in summary:
        failures.append("portfolio/project.json: summary must identify the current source version")
    elif source_status == "private-candidate" and "private" not in summary.lower():
        failures.append("portfolio/project.json: summary must identify a private candidate as private")
    if (
        isinstance(summary, str)
        and demo_status == "unavailable"
        and not re.search(r"(?:no|unavailable|not)[^.]{0,100}durable hosted demo", summary, re.IGNORECASE)
    ):
        failures.append("portfolio/project.json: summary must disclose that no durable hosted demo is verified")
    if isinstance(summary, str) and demo_status == "staging-verified" and "staging" not in summary.lower():
        failures.append("portfolio/project.json: summary must identify a verified staging demo as staging")
    if isinstance(summary, str) and demo_status == "verified-live" and "live demo" not in summary.lower():
        failures.append("portfolio/project.json: summary must identify a verified live demo as live")
    if top_level.get("languages") != ["en", "es", "he"]:
        failures.append("portfolio/project.json: languages must be ['en', 'es', 'he']")
    expected_standard_stack = [
        "React 19", "TypeScript", "FastAPI", "Python", "PostgreSQL 17", "SQLite",
        "Alembic", "Docker",
    ]
    if top_level.get("standard_stack") != expected_standard_stack:
        failures.append(
            "portfolio/project.json: standard_stack must describe the portable standard container"
        )
    expected_optional_capabilities = [
        "Faster Whisper private speech worker",
        "Web Push reminders",
    ]
    if top_level.get("optional_capabilities") != expected_optional_capabilities:
        failures.append(
            "portfolio/project.json: optional_capabilities must remain separate from standard_stack"
        )

    # Current source-release evidence stays separate from historical hosting proof.
    tests, nested = _verify_exact_keys(
        top_level.get("tests"),
        {"version", "scope", "backend_unique", "frontend", "frontend_files",
         "total_unique", "ordinary_backend_passed", "ordinary_backend_skipped",
         "postgresql_gate_passed", "evidence"},
        "tests",
    )
    failures.extend(nested)
    if tests is not None:
        expected_test_scope = f"{source_status}-local-verification"
        if tests.get("version") != current_version:
            failures.append("portfolio/project.json: tests.version must equal source_version")
        if tests.get("scope") != expected_test_scope:
            failures.append(
                f"portfolio/project.json: tests.scope must be {expected_test_scope!r}"
            )
        for key in (
            "backend_unique",
            "frontend",
            "frontend_files",
            "total_unique",
            "ordinary_backend_passed",
            "ordinary_backend_skipped",
            "postgresql_gate_passed",
        ):
            value = tests.get(key)
            if type(value) is not int or value < 0:
                failures.append(f"portfolio/project.json: tests.{key} must be a non-negative integer")
        backend_unique = tests.get("backend_unique")
        frontend = tests.get("frontend")
        total_unique = tests.get("total_unique")
        ordinary_backend_passed = tests.get("ordinary_backend_passed")
        if (
            type(backend_unique) is int
            and type(frontend) is int
            and type(total_unique) is int
            and total_unique != backend_unique + frontend
        ):
            failures.append(
                "portfolio/project.json: tests.total_unique must equal backend_unique + frontend"
            )
        if (
            type(backend_unique) is int
            and type(ordinary_backend_passed) is int
            and ordinary_backend_passed != backend_unique
        ):
            failures.append(
                "portfolio/project.json: tests.ordinary_backend_passed must equal backend_unique"
            )
        if tests.get("evidence") != "TEST_REPORT.md":
            failures.append("portfolio/project.json: tests.evidence must be 'TEST_REPORT.md'")

    historical_deployment, nested = _verify_exact_keys(
        top_level.get("historical_deployment"),
        {"version", "provider", "former_demo_url", "runtime", "database",
         "historical_status", "release_implementation_commit", "verified_on",
         "environment", "health_live_at_verification", "health_ready_at_verification",
         "postgresql_ready_at_verification", "dictionary_ready_at_verification",
         "dictionary_entries_at_verification", "english_entry_verified_at_verification",
         "read_only_tour_verified_at_verification", "current_availability",
         "last_checked_on", "current_http_status"},
        "historical_deployment",
    )
    failures.extend(nested)
    expected_historical_deployment = {
        "version": "2.4.0", "provider": "Railway", "runtime": "Docker",
        "former_demo_url": "https://ivritsheli-production.up.railway.app",
        "database": "PostgreSQL 17", "historical_status": "verified-on-2026-07-21",
        "release_implementation_commit": "03bf84b9268ff8be528c0fab3c670f9652ee23b0",
        "verified_on": "2026-07-21", "environment": "production",
        "health_live_at_verification": True, "health_ready_at_verification": True,
        "postgresql_ready_at_verification": True,
        "dictionary_ready_at_verification": True,
        "dictionary_entries_at_verification": 48,
        "english_entry_verified_at_verification": True,
        "read_only_tour_verified_at_verification": True,
        "current_availability": "offline", "last_checked_on": "2026-08-26",
        "current_http_status": 404,
    }
    if (
        historical_deployment is not None
        and historical_deployment != expected_historical_deployment
    ):
        failures.append(
            "portfolio/project.json: historical_deployment must preserve the dated 2.4.0 "
            "record while reporting current Railway availability as offline"
        )

    publication, nested = _verify_exact_keys(
        top_level.get("publication"),
        {"latest_git_tag", "latest_github_release", "source_version_tagged",
         "source_version_github_release_published", "release_state"},
        "publication",
    )
    failures.extend(nested)
    if publication is not None:
        source_is_published = source_status == "published-source-release"
        expected_demo_suffix = {
            "unavailable": "no-durable-demo",
            "staging-verified": "staging-verified",
            "verified-live": "verified-live-demo",
        }.get(demo_status)
        for key in ("latest_git_tag", "latest_github_release"):
            if publication.get(key) != latest_published_release:
                failures.append(
                    f"portfolio/project.json: publication.{key} must equal latest_published_release"
                )
        for key in ("source_version_tagged", "source_version_github_release_published"):
            if publication.get(key) is not source_is_published:
                failures.append(
                    f"portfolio/project.json: publication.{key} must be {source_is_published!r} "
                    f"for source_status {source_status!r}"
                )
        expected_release_state = (
            f"{current_version}-{source_status}-{expected_demo_suffix}"
            if source_status in SOURCE_STATUSES and expected_demo_suffix is not None
            else None
        )
        if publication.get("release_state") != expected_release_state:
            failures.append(
                "portfolio/project.json: publication.release_state must match the current "
                "source, publication, and durable-demo states"
            )

    candidate, nested = _verify_exact_keys(
        top_level.get("candidate"),
        {"version", "published", "coverage", "reviewed_concepts", "learner_experiences",
         "learning_engine", "personal_coach", "speech", "reminders", "semantic_visual_recipes",
         "category_visual_fallbacks", "visual_journey_regions", "alphabet_base_letters",
         "alphabet_final_forms", "alphabet_progress_persistent", "public_google_scope",
         "local_mode_without_account", "verification", "release_gate"},
        "candidate",
    )
    failures.extend(nested)
    if candidate is not None:
        fixed_expected = {
            "version": current_version,
            "published": source_status == "published-source-release",
            "coverage": "Structured A0-A2 with an explicitly experimental B1/B2 Lab",
            "reviewed_concepts": 240,
            "learner_experiences": ["Guided", "Explorer", "Experienced"],
            "learning_engine": "Deterministic LocalLearningEngine",
            "personal_coach": "Reviewed deterministic LocalPersonalCoach with bounded feedback",
            "speech": (
                "Optional self-hosted Faster Whisper small worker for Hebrew CPU INT8 "
                "transcription with a 20-second private pilot limit"
            ),
            "reminders": "Optional standards-based Web Push with one reminder per learner/local day",
            "semantic_visual_recipes": 240,
            "category_visual_fallbacks": 0,
            "visual_journey_regions": 6,
            "alphabet_base_letters": 22,
            "alphabet_final_forms": 5,
            "alphabet_progress_persistent": True,
            "public_google_scope": "openid profile",
            "local_mode_without_account": True,
        }
        for key, expected in fixed_expected.items():
            if candidate.get(key) != expected:
                failures.append(
                    f"portfolio/project.json: candidate.{key} must be {expected!r}, got {candidate.get(key)!r}"
                )
        for key in ("verification", "release_gate"):
            value = candidate.get(key)
            if not isinstance(value, str) or len(value.strip()) < 60:
                failures.append(f"portfolio/project.json: candidate.{key} must preserve a meaningful evidence boundary")
        verification = candidate.get("verification")
        if isinstance(verification, str) and current_version not in verification:
            failures.append("portfolio/project.json: candidate.verification must identify the current source version")

    visual_proof, nested = _verify_exact_keys(
        top_level.get("visual_proof"),
        {"state", "social_preview_version", "readme_screenshot_source_version",
         "readme_screenshot_status", "interactive_browser_qa"},
        "visual_proof",
    )
    failures.extend(nested)
    if visual_proof is not None:
        visual_state = str(visual_proof.get("state", ""))
        if "240" not in visual_state:
            failures.append("portfolio/project.json: visual_proof.state must record 240 exact semantic scenes")
        if current_version not in visual_state:
            failures.append("portfolio/project.json: visual_proof.state must identify the current source version")
        expected_social_preview_version = (
            latest_published_release.removeprefix("v")
            if isinstance(latest_published_release, str)
            else None
        )
        if visual_proof.get("social_preview_version") != expected_social_preview_version:
            failures.append(
                "portfolio/project.json: visual_proof.social_preview_version must identify "
                "the latest published release"
            )
        screenshot_status = visual_proof.get("readme_screenshot_status")
        if screenshot_status not in {"historical", "candidate", "verified-current"}:
            failures.append(
                "portfolio/project.json: visual_proof.readme_screenshot_status must be "
                "historical, candidate, or verified-current"
            )
        screenshot_version = visual_proof.get("readme_screenshot_source_version")
        screenshot_version_tuple = _semantic_version_tuple(screenshot_version)
        if screenshot_version_tuple is None:
            failures.append(
                "portfolio/project.json: visual_proof.readme_screenshot_source_version "
                "must be a semantic version"
            )
        elif screenshot_status in {"candidate", "verified-current"} and screenshot_version != current_version:
            failures.append(
                "portfolio/project.json: current screenshot evidence must name the current source version"
            )
        elif (
            screenshot_status == "historical"
            and current_version_tuple is not None
            and screenshot_version_tuple >= current_version_tuple
        ):
            failures.append(
                "portfolio/project.json: historical screenshot evidence must predate the current source version"
            )
        if "240" not in str(visual_proof.get("interactive_browser_qa", "")):
            failures.append("portfolio/project.json: visual QA boundary must mention the 240-scene candidate")

    oauth, nested = _verify_exact_keys(
        top_level.get("oauth"),
        {"providers", "source_contract_tested", "historical_public_release_version",
         "google_sign_in_verified_at_release", "github_successful_session_verified_at_release",
         "authenticated_session_refresh_verified_at_release",
         "onboarding_persistence_across_reload_verified_at_release",
         "logout_verified_at_release", "signed_out_reload_verified_at_release",
         "relogin_after_logout_verified_at_release", "boundary"},
        "oauth",
    )
    failures.extend(nested)
    if oauth is not None:
        if oauth.get("providers") != ["Google", "GitHub"]:
            failures.append("portfolio/project.json: OAuth providers must remain Google + GitHub")
        expected_oauth_evidence = {
            "source_contract_tested": True,
            "historical_public_release_version": "2.4.0",
            "google_sign_in_verified_at_release": True,
            "github_successful_session_verified_at_release": False,
            "authenticated_session_refresh_verified_at_release": True,
            "onboarding_persistence_across_reload_verified_at_release": True,
            "logout_verified_at_release": True,
            "signed_out_reload_verified_at_release": True,
            "relogin_after_logout_verified_at_release": False,
        }
        for key, expected in expected_oauth_evidence.items():
            if oauth.get(key) != expected:
                failures.append(
                    f"portfolio/project.json: oauth.{key} must be {expected!r}, "
                    f"got {oauth.get(key)!r}"
                )
        boundary = oauth.get("boundary")
        if (
            not isinstance(boundary, str)
            or "identity-only" not in boundary.lower()
            or "historical" not in boundary.lower()
        ):
            failures.append("portfolio/project.json: OAuth boundary must preserve identity-only Google sign-in")

    privacy, nested = _verify_exact_keys(
        top_level.get("privacy"),
        {"local_first", "demo_data_contract", "demo_mutation_contract",
         "durable_demo_currently_available", "self_service_export_in_source",
         "self_service_deletion_in_source", "contains_secrets"},
        "privacy",
    )
    failures.extend(nested)
    expected_privacy = {
        "local_first": True, "demo_data_contract": "synthetic",
        "demo_mutation_contract": "server-blocked",
        "durable_demo_currently_available": demo_available,
        "self_service_export_in_source": True, "self_service_deletion_in_source": True,
        "contains_secrets": False,
    }
    if privacy is not None and privacy != expected_privacy:
        failures.append("portfolio/project.json: privacy contract changed unexpectedly")
    return failures


def _verify_readme_release_truth(
    readme: str,
    current_version: str,
    *,
    source_status: str,
    latest_published_release: str,
    durable_demo_status: str,
    durable_demo_url: str | None,
) -> list[str]:
    """Validate README wording against explicit source-publication and hosting states."""
    failures: list[str] = []
    for fragment in (f"Ivrit Sheli {current_version}", "240"):
        if fragment not in readme:
            failures.append(f"README.md: missing release-truth fragment {fragment!r}")

    current = re.escape(current_version)
    latest = re.escape(latest_published_release)
    if source_status == "private-candidate":
        source_boundary = (
            "private candidate",
            re.compile(
                rf"(?=[^\n]*\bprivate\b)(?=[^\n]*\bcandidate\b)(?=[^\n]*{current})[^\n]+",
                flags=re.IGNORECASE,
            ),
        )
    else:
        source_boundary = (
            "published source release",
            re.compile(
                rf"(?:published|public)[^\n]{{0,100}}v?{current}[^\n]{{0,100}}source release"
                rf"|(?:published|public)[^\n]{{0,100}}source release[^\n]{{0,100}}v?{current}"
                rf"|v?{current}[^\n]{{0,100}}(?:published|public)[^\n]{{0,100}}source release"
                rf"|v?{current}[^\n]{{0,100}}source release[^\n]{{0,100}}(?:published|public)",
                flags=re.IGNORECASE,
            ),
        )

    truth_patterns = {
        source_boundary[0]: source_boundary[1],
        f"{latest_published_release} as the latest published release": re.compile(
            rf"latest published (?:release|version)[^\n]{{0,100}}{latest}"
            rf"|{latest}[^\n]{{0,100}}latest published (?:release|version)",
            flags=re.IGNORECASE,
        ),
    }
    if durable_demo_status == "unavailable":
        truth_patterns["no verified durable hosted demo"] = re.compile(
            r"(?:no|without|unavailable|unverified|not available)[^\n]{0,120}durable hosted demo"
            r"|durable hosted demo[^\n]{0,120}(?:unavailable|unverified|not verified|not available)",
            flags=re.IGNORECASE,
        )
    elif durable_demo_status == "staging-verified":
        truth_patterns["verified HTTPS staging demo"] = re.compile(
            r"(?:verified[^\n]{0,80}staging|staging[^\n]{0,80}verified)",
            flags=re.IGNORECASE,
        )
    elif durable_demo_status == "verified-live":
        truth_patterns["verified live demo"] = re.compile(
            r"(?:verified[^\n]{0,80}live demo|live demo[^\n]{0,80}verified)",
            flags=re.IGNORECASE,
        )
    for boundary, pattern in truth_patterns.items():
        if pattern.search(readme) is None:
            failures.append(f"README.md: missing release-truth boundary for {boundary}")

    if durable_demo_status in {"staging-verified", "verified-live"}:
        if not _is_public_https_url(durable_demo_url) or durable_demo_url not in readme:
            failures.append("README.md: verified durable demo must include its exact public HTTPS URL")
    elif durable_demo_status == "unavailable" and re.search(
        r"(?:current public deployed application|current[^\n]{0,80}(?:is live|is deployed)|"
        r"live app url[^\n]{0,80}https://)",
        readme,
        flags=re.IGNORECASE,
    ):
        failures.append("README.md: forbidden publication claim for an unavailable durable demo")

    forbidden_patterns: tuple[tuple[str, re.Pattern[str]], ...] = (
        (
            f"{current_version} is live or deployed",
            re.compile(rf"{current}[^\n]{{0,40}}\b(?:is live|is deployed)\b", re.IGNORECASE),
        ),
        (
            "historical 2.4.0 presented as live",
            re.compile(r"Version 2\.4\.0 is live at", re.IGNORECASE),
        ),
        (
            "historical Railway production presented as current",
            re.compile(r"Railway production still reports", re.IGNORECASE),
        ),
        (
            "ephemeral trycloudflare URL",
            re.compile(r"trycloudflare\.com", re.IGNORECASE),
        ),
    )
    for label, pattern in forbidden_patterns:
        if pattern.search(readme) is not None:
            failures.append(f"README.md: forbidden publication claim {label!r}")

    if source_status == "private-candidate" and re.search(
        rf"(?:published|public)[^\n]{{0,80}}v?{current}[^\n]{{0,80}}source release"
        rf"|v?{current}\s+(?:is\s+|—\s+)?(?:the\s+)?(?:published|public)\s+source release"
        rf"|published source release\s+(?:is\s+)?v?{current}"
        rf"|releases/tag/v?{current}",
        readme,
        flags=re.IGNORECASE,
    ):
        failures.append(
            f"README.md: forbidden publication claim for private candidate {current_version!r}"
        )
    return failures


def verify_release_truth_drift() -> list[str]:
    """Keep candidate, source-release, and durable-host claims mutually consistent."""
    try:
        current_version = source_version()
        manifest = json.loads(
            (ROOT / "portfolio" / "project.json").read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError, RuntimeError) as error:
        return [f"release truth metadata could not be read: {error}"]

    source_status = manifest.get("source_status")
    latest_published_release = manifest.get("latest_published_release")
    durable_demo = manifest.get("durable_demo")
    if source_status not in SOURCE_STATUSES:
        return ["portfolio/project.json: source_status is invalid for release-truth verification"]
    if not isinstance(latest_published_release, str):
        return ["portfolio/project.json: latest_published_release is invalid for release-truth verification"]
    if not isinstance(durable_demo, dict):
        return ["portfolio/project.json: durable_demo is invalid for release-truth verification"]
    durable_demo_status = durable_demo.get("status")
    durable_demo_url = durable_demo.get("url")
    if durable_demo_status not in DURABLE_DEMO_STATUSES:
        return ["portfolio/project.json: durable_demo.status is invalid for release-truth verification"]
    if durable_demo_url is not None and not isinstance(durable_demo_url, str):
        return ["portfolio/project.json: durable_demo.url is invalid for release-truth verification"]

    source_boundary = (
        f"Current private candidate:** `{current_version}`"
        if source_status == "private-candidate"
        else f"Current published source release:** `{current_version}`"
    )
    latest_published_version = latest_published_release.removeprefix("v")

    expected_fragments = {
        "CHANGELOG.md": (
            f"## {current_version}",
            "240/240",
            "2.4.0 — Contest Edition — 2026-07-21",
        ),
        "PACKAGE_MANIFEST.md": (
            f"Source version: `{current_version}`",
            f"Latest published source release: `{latest_published_release}`",
            "240",
        ),
        "TEST_REPORT.md": (
            source_boundary,
            "2.10.0",
            "1,047",
            "2.4.0",
        ),
        "docs/API.md": (f"{current_version}", "identity-only"),
        "docs/VOCABULARY_ILLUSTRATION_SYSTEM.md": ("240", "exact semantic"),
        "docs/DESIGN_SYSTEM.md": ("240", "semantic"),
        "docs/USER_GUIDE.md": ("240",),
        "docs/VISUAL_BIBLE.md": ("240 reviewed concepts / 240 exact semantic scenes",),
        "CITATION.cff": (
            f"version: {latest_published_version}",
            f"source release {latest_published_release}",
        ),
    }
    failures: list[str] = []
    for relative, fragments in expected_fragments.items():
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        for fragment in fragments:
            if fragment not in text:
                failures.append(f"{relative}: missing release-truth fragment {fragment!r}")

    try:
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
    except OSError as error:
        failures.append(f"README.md: {error}")
    else:
        failures.extend(
            _verify_readme_release_truth(
                readme,
                current_version,
                source_status=source_status,
                latest_published_release=latest_published_release,
                durable_demo_status=durable_demo_status,
                durable_demo_url=durable_demo_url,
            )
        )

    # A candidate must not be relabelled as a source release, and neither state
    # implies a hosted production deployment.
    forbidden = {
        "PACKAGE_MANIFEST.md": (f"v{current_version} is live",),
        "TEST_REPORT.md": (f"Current verified production:** `{current_version}`",),
    }
    if source_status == "private-candidate":
        forbidden["PACKAGE_MANIFEST.md"] += (
            f"Latest published source release: `v{current_version}`",
            f"published GitHub source release for `{current_version}`",
        )
        forbidden["TEST_REPORT.md"] += (
            f"Current published source release:** `{current_version}`",
        )
        forbidden["CITATION.cff"] = (
            f"version: {current_version}",
            f"source release v{current_version}",
        )
    for relative, fragments in forbidden.items():
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        for fragment in fragments:
            if fragment in text:
                failures.append(f"{relative}: forbidden publication claim {fragment!r}")
    return failures

def verify_brand_identity() -> list[str]:
    """Keep current package/product metadata aligned with the Ivrit Sheli brand."""
    failures: list[str] = []
    try:
        frontend_package = json.loads(
            (ROOT / "frontend" / "package.json").read_text(encoding="utf-8")
        )
        frontend_lock = json.loads(
            (ROOT / "frontend" / "package-lock.json").read_text(encoding="utf-8")
        )
        backend_package = tomllib.loads(
            (ROOT / "backend" / "pyproject.toml").read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError, tomllib.TOMLDecodeError) as error:
        return [f"brand metadata could not be parsed: {error}"]

    expected = {
        "frontend/package.json": frontend_package.get("name"),
        "frontend/package-lock.json": frontend_lock.get("name"),
        "frontend/package-lock.json packages['']": (
            frontend_lock.get("packages", {}).get("", {}).get("name")
            if isinstance(frontend_lock.get("packages"), dict)
            else None
        ),
        "backend/pyproject.toml": backend_package.get("project", {}).get("name"),
    }
    required = {
        "frontend/package.json": "ivrit-sheli-web",
        "frontend/package-lock.json": "ivrit-sheli-web",
        "frontend/package-lock.json packages['']": "ivrit-sheli-web",
        "backend/pyproject.toml": "ivrit-sheli",
    }
    for location, value in expected.items():
        if value != required[location]:
            failures.append(
                f"{location}: expected package identity {required[location]!r}, got {value!r}"
            )

    user_facing_surfaces = (
        "backend/src/ivrit_sheli/api.py",
        "backend/src/ivrit_sheli/cli.py",
        "scripts/setup.ps1",
        "scripts/setup.sh",
        "docs/USER_GUIDE.md",
        "docs/DEMO_DAY.md",
        "docs/ULTIMATE_BUILD_SPEC.md",
    )
    for relative in user_facing_surfaces:
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        if "Ivrit Sheli Ultimate" in text:
            failures.append(f"{relative}: obsolete 'Ivrit Sheli Ultimate' branding remains")

    for relative in ("scripts/setup.ps1", "scripts/setup.sh"):
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        if "ivrit-sheli-ultimate" not in text:
            failures.append(f"{relative}: retired Python distribution migration is missing")
        if "--editable backend" not in text:
            failures.append(f"{relative}: current editable Python distribution install is missing")
    return failures


def verify_source_version_surfaces() -> list[str]:
    """Keep executable and human-facing candidate versions synchronized.

    The citation is deliberately excluded: it follows the latest *published*
    release, which can lag an unpublished source candidate.
    """
    failures: list[str] = []
    try:
        expected_version = source_version()
        frontend_package = json.loads((ROOT / "frontend" / "package.json").read_text(encoding="utf-8"))
        frontend_lock = json.loads((ROOT / "frontend" / "package-lock.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, RuntimeError) as error:
        return [f"release version metadata could not be parsed: {error}"]

    structured_versions = {
        "frontend/package.json": frontend_package.get("version"),
        "frontend/package-lock.json": frontend_lock.get("version"),
        "frontend/package-lock.json packages['']": (
            frontend_lock.get("packages", {}).get("", {}).get("version")
            if isinstance(frontend_lock.get("packages"), dict) else None
        ),
    }
    for location, actual in structured_versions.items():
        if actual != expected_version:
            failures.append(f"{location}: expected {expected_version!r}, got {actual!r}")

    expected_fragments = {
        "backend/src/ivrit_sheli/__init__.py": (
            f'__version__ = "{expected_version}"',
        ),
        "backend/requirements.txt": (
            f"Ivrit Sheli {expected_version} candidate",
        ),
        "frontend/index.html": (
            f"Ivrit Sheli {expected_version}",
            f"app-icon.svg?v={expected_version}",
            f"app-icon-192.png?v={expected_version}",
        ),
        "frontend/public/manifest.webmanifest": (
            f"Ivrit Sheli {expected_version}",
        ),
        "frontend/public/sw.js": (
            f"ivrit-sheli-shell-v{expected_version}",
        ),
        "frontend/src/components/IvritSheliWordmark.tsx": (
            f"app-icon.svg?v={expected_version}",
        ),
        "frontend/src/release.ts": (
            f"RELEASE_VERSION = '{expected_version}'",
        ),
        "scripts/start.ps1": (f"v{expected_version}",),
        "START_PRIVATE_PILOT.bat": (f"Ivrit Sheli {expected_version}",),
        ".github/ISSUE_TEMPLATE/bug_report.yml": (
            f"placeholder: {expected_version}",
        ),
    }
    for relative, fragments in expected_fragments.items():
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        for fragment in fragments:
            if fragment not in text:
                failures.append(
                    f"{relative}: missing release version fragment {fragment!r}"
                )
    return failures

def verify_public_learning_assets() -> list[str]:
    """Validate the offline starter contract and 13 responsive journey assets."""
    dictionary_path = (
        ROOT / "frontend" / "public" / "content" / "starter-dictionary-v2.8.json"
    )
    failures: list[str] = []
    try:
        payload = json.loads(dictionary_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"frontend/public/content/starter-dictionary-v2.8.json: {error}"]

    if not isinstance(payload, dict):
        failures.append("offline starter dictionary must be a JSON object")
    else:
        expected_keys = {"content", "contract_version", "entries", "entry_count"}
        if set(payload) != expected_keys:
            failures.append(
                "offline starter dictionary root keys must be "
                f"{sorted(expected_keys)}, got {sorted(payload)}"
            )
        if payload.get("content") != "reviewed_starter_dictionary":
            failures.append("offline starter dictionary content identifier is invalid")
        if payload.get("contract_version") != "2.8":
            failures.append("offline starter dictionary contract_version must be '2.8'")
        entries = payload.get("entries")
        if payload.get("entry_count") != 240 or not isinstance(entries, list) or len(entries) != 240:
            failures.append("offline starter dictionary must contain exactly 240 entries")
        elif all(isinstance(entry, dict) for entry in entries):
            entry_ids = [entry.get("id") for entry in entries]
            words = [entry.get("word") for entry in entries]
            if len(set(entry_ids)) != 240:
                failures.append("offline starter dictionary entry IDs must be unique")
            if len(set(words)) != 240 or not all(
                isinstance(word, str) and word.strip() for word in words
            ):
                failures.append(
                    "offline starter dictionary Hebrew words must be non-empty and unique"
                )
            for index, entry in enumerate(entries):
                visual = entry.get("visual")
                alt = visual.get("alt") if isinstance(visual, dict) else None
                if (
                    not isinstance(visual, dict)
                    or not isinstance(visual.get("key"), str)
                    or not isinstance(alt, dict)
                    or any(
                        not isinstance(alt.get(language), str)
                        or not alt[language].strip()
                        for language in ("en", "es", "he")
                    )
                ):
                    failures.append(
                        "offline starter dictionary entry "
                        f"{index + 1} lacks a visual key or trilingual alt text"
                    )
                    break
        pending: list[tuple[str, object]] = [("payload", payload)]
        while pending:
            location, value = pending.pop()
            if isinstance(value, dict):
                forbidden = FORBIDDEN_PUBLIC_CONTENT_FIELDS.intersection(value)
                if forbidden:
                    failures.append(
                        f"offline starter dictionary exposes private fields at "
                        f"{location}: {', '.join(sorted(forbidden))}"
                    )
                pending.extend(
                    (f"{location}.{key}", child) for key, child in value.items()
                )
            elif isinstance(value, list):
                pending.extend(
                    (f"{location}[{index}]", child)
                    for index, child in enumerate(value)
                )

    for relative in PUBLIC_REGION_ART:
        path = ROOT / relative
        try:
            data = path.read_bytes()
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        if len(data) < 10_000 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            failures.append(f"{relative}: expected a non-empty WebP region illustration")
    return failures



def verify_visual_catalog_contract() -> list[str]:
    """Prove the reviewed 240-entry visual catalog has exact source coverage."""
    failures: list[str] = []
    try:
        payload = json.loads(
            (ROOT / "frontend" / "public" / "content" / "starter-dictionary-v2.8.json").read_text(encoding="utf-8")
        )
        recipes = (ROOT / "frontend" / "src" / "visuals" / "a0VisualRecipes.ts").read_text(encoding="utf-8")
        spotlight = (ROOT / "backend" / "src" / "ivrit_sheli" / "visual_spotlight.py").read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as error:
        return [f"visual catalog cannot be read: {error}"]

    entries = payload.get("entries") if isinstance(payload, dict) else None
    if not isinstance(entries, list):
        return ["visual catalog: offline entries are unavailable"]
    catalog_keys = {
        visual.get("key")
        for entry in entries if isinstance(entry, dict)
        for visual in [entry.get("visual")]
        if isinstance(visual, dict) and isinstance(visual.get("key"), str)
    }
    recipe_keys = set(re.findall(r"^\s{2}'([^']+)': \{\s*$", recipes, flags=re.MULTILINE))
    if len(catalog_keys) != 240:
        failures.append(f"visual catalog: expected 240 unique keys, got {len(catalog_keys)}")
    if len(recipe_keys) != 240:
        failures.append(f"visual recipes: expected 240 exact keys, got {len(recipe_keys)}")
    missing = sorted(catalog_keys - recipe_keys)
    extra = sorted(recipe_keys - catalog_keys)
    if missing:
        failures.append(f"visual recipes: missing reviewed exact keys: {', '.join(missing)}")
    if extra:
        failures.append(f"visual recipes: unexpected keys outside reviewed catalog: {', '.join(extra)}")

    try:
        tree = ast.parse(spotlight)
        rotation_value = None
        for node in tree.body:
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.target.id == "SPOTLIGHT_ROTATIONS":
                rotation_value = ast.literal_eval(node.value)
                break
        if rotation_value is None:
            raise ValueError("SPOTLIGHT_ROTATIONS assignment not found")
        words = [word for rotation in rotation_value for word in rotation]
    except (SyntaxError, ValueError) as error:
        failures.append(f"visual spotlight: cannot parse rotations: {error}")
    else:
        if len(words) != 240 or len(set(words)) != 240:
            failures.append(
                f"visual spotlight: expected 240 unique reviewed words, got {len(words)} / {len(set(words))} unique"
            )
    return failures

def verify_svg_assets() -> list[str]:
    """Parse every shipped SVG so broken icons fail packaging.

    Returns:
        Human-readable SVG failures.

    Example:
        >>> isinstance(verify_svg_assets(), list)
        True
    """
    failures: list[str] = []
    for path in sorted((ROOT / "assets").rglob("*.svg")):
        try:
            ElementTree.parse(path)
        except (OSError, ElementTree.ParseError) as error:
            failures.append(f"{path.relative_to(ROOT)}: {error}")
    return failures


def verify_railway_config() -> list[str]:
    """Validate deploy timing values with a real TOML parser.

    Returns:
        Human-readable Railway configuration failures.

    Example:
        >>> isinstance(verify_railway_config(), list)
        True
    """
    path = ROOT / "railway.toml"
    try:
        config = tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as error:
        return [f"railway.toml: {error}"]

    deploy = config.get("deploy")
    if not isinstance(deploy, dict):
        return ["railway.toml: missing [deploy] table"]

    failures: list[str] = []
    # Zero overlap is deliberate from 2.6 onward: docs/DEPLOYMENT.md section 5 documents
    # that an older writer running beside a Learning Core writer silently drops the newer
    # snapshot fields, so a brief gap is preferred over a concurrent-writer window.
    expected = {"overlapSeconds": 0, "drainingSeconds": 15}
    for key, expected_value in expected.items():
        value = deploy.get(key)
        if type(value) is not int:  # bool is also invalid even though it subclasses int.
            failures.append(f"railway.toml: deploy.{key} must be an integer, got {type(value).__name__}")
        elif value != expected_value:
            failures.append(f"railway.toml: deploy.{key} must be {expected_value}, got {value}")
    return failures


def verify_docker_cache_mounts() -> list[str]:
    """Keep the production Dockerfile portable across Railway services.

    Railway Metal requires cache mount IDs to contain the current service ID.
    Embedding that provider-specific identifier would make this public image
    definition fail when the repository is deployed as another service, so the
    production Dockerfile deliberately relies on normal Docker layer caching.
    """
    path = ROOT / "Dockerfile"
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        return [f"Dockerfile: {error}"]

    failures: list[str] = []
    for line_number, line in enumerate(lines, start=1):
        if "--mount=type=cache" in line:
            failures.append(
                f"Dockerfile:{line_number}: avoid service-bound Railway cache mounts; "
                "use portable Docker layer caching"
            )
    return failures


def verify_secret_hygiene() -> list[str]:
    """Scan source/config text for common committed credential shapes.

    Returns:
        Paths containing a likely secret.

    Example:
        >>> isinstance(verify_secret_hygiene(), list)
        True
    """
    failures: list[str] = []
    allowed_suffixes = {
        ".py", ".ts", ".tsx", ".js", ".json", ".md", ".yml", ".yaml", ".env",
        ".example", ".sh", ".ps1", ".toml", ".ini", ".cff", ".bat", ".txt",
    }
    allowed_names = {"Dockerfile", "Makefile"}
    excluded_parts = {"node_modules", "dist", ".venv", ".git", "__pycache__", ".mypy_cache", ".ruff_cache"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in excluded_parts for part in path.parts):
            continue
        if path.suffix not in allowed_suffixes and path.name not in allowed_names and path.name != ".env.example":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if any(pattern.search(text) for pattern in SECRET_PATTERNS):
            failures.append(str(path.relative_to(ROOT)))
    return failures


def git_index_available() -> bool:
    """Return whether the package root is the source Git worktree root."""
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--show-toplevel"],
            capture_output=True,
            check=False,
            text=True,
        )
    except OSError:
        return False
    if result.returncode != 0:
        return False
    try:
        git_root = Path(result.stdout.strip()).resolve()
    except OSError:
        return False
    return git_root == ROOT.resolve()


def canonical_file_bytes(relative: str, *, use_index: bool) -> bytes:
    """Read canonical release bytes for a repository path.

    The index is the release source of truth. This avoids false checksum drift
    when a checkout uses CRLF working-tree files while the committed blob uses
    LF. The release archive builder writes those canonical blobs directly, so
    an extracted archive is verified byte-for-byte without trying to reconstruct
    Git attributes or text/binary classification after packaging.

    Args:
        relative: Forward-slash repository path.
        use_index: Read from the Git index when true, otherwise from the package.

    Returns:
        Canonical release bytes.

    Raises:
        OSError: If a package file cannot be read.
        subprocess.CalledProcessError: If an indexed path is absent.
    """
    if use_index:
        return subprocess.run(
            ["git", "-C", str(ROOT), "cat-file", "blob", f":{relative}"],
            capture_output=True,
            check=True,
        ).stdout
    return (ROOT / relative).read_bytes()


def indexed_files() -> set[str]:
    """Return repository paths present in the Git index."""
    output = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--cached", "-z"],
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8", errors="surrogateescape")
    return {path for path in output.split("\0") if path}


def verify_checksum_manifest() -> list[str]:
    """Validate SHA256SUMS.txt against canonical Git-index blobs.

    In a source checkout, every listed path must be present in the index and
    hash to its recorded digest. In an extracted release archive, listed files
    are checked directly. Every required package file must also be listed.

    Returns:
        Human-readable drift failures.

    Example:
        >>> isinstance(verify_checksum_manifest(), list)
        True
    """
    manifest = ROOT / "SHA256SUMS.txt"
    if not manifest.is_file():
        return ["SHA256SUMS.txt: missing; run scripts/generate_checksums.py"]
    failures: list[str] = []
    listed: set[str] = set()
    use_index = git_index_available()
    tracked: set[str] = set()
    if use_index:
        try:
            tracked = indexed_files()
        except (OSError, subprocess.CalledProcessError) as error:
            return [f"SHA256SUMS.txt: cannot read Git index: {error}"]
    for line_number, line in enumerate(
        manifest.read_text(encoding="utf-8").splitlines(), start=1
    ):
        if not line.strip():
            continue
        try:
            digest, relative = line.split("  ", 1)
        except ValueError:
            failures.append(f"SHA256SUMS.txt:{line_number}: malformed line")
            continue
        if not re.fullmatch(r"[0-9a-f]{64}", digest):
            failures.append(f"SHA256SUMS.txt:{line_number}: invalid SHA-256 digest")
            continue
        relative_path = PurePosixPath(relative)
        unsafe_path = (
            not relative
            or "\\" in relative
            or relative_path.is_absolute()
            or ".." in relative_path.parts
        )
        if (
            unsafe_path
            or relative == manifest.name
            or relative in listed
        ):
            failures.append(
                f"SHA256SUMS.txt:{line_number}: invalid or duplicate path: {relative}"
            )
            continue
        listed.add(relative)
        if use_index and relative not in tracked:
            failures.append(
                f"SHA256SUMS.txt: listed file is not present in the Git index: {relative}"
            )
            continue
        if not use_index and not (ROOT / relative).is_file():
            failures.append(f"SHA256SUMS.txt: listed package file is missing: {relative}")
            continue
        try:
            actual = hashlib.sha256(
                canonical_file_bytes(relative, use_index=use_index)
            ).hexdigest()
        except (OSError, subprocess.CalledProcessError) as error:
            source = "indexed" if use_index else "packaged"
            failures.append(f"SHA256SUMS.txt: cannot read {source} {relative}: {error}")
            continue
        if actual != digest:
            source = "indexed" if use_index else "packaged"
            action = (
                "stage the intended release tree, then run "
                "scripts/generate_checksums.py"
                if use_index
                else "regenerate the clean package checksum manifest"
            )
            failures.append(
                f"SHA256SUMS.txt: stale {source} digest for {relative}; {action}"
            )
    for relative in REQUIRED_FILES:
        if relative not in listed:
            failures.append(f"SHA256SUMS.txt: required file not listed: {relative}")
    return failures


def verify_documentation_links() -> list[str]:
    """Check local Markdown links in the root README.

    Returns:
        Broken relative link targets.

    Example:
        >>> isinstance(verify_documentation_links(), list)
        True
    """
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    failures: list[str] = []
    for target in re.findall(r"\[[^\]]+\]\(([^)]+)\)", readme):
        if target.startswith(("http://", "https://", "#", "mailto:")):
            continue
        path_part = target.split("#", 1)[0]
        if path_part and not (ROOT / path_part).exists():
            failures.append(target)
    for target in re.findall(r'(?:src|srcset)="([^"]+)"', readme):
        for candidate in target.split(","):
            path_part = candidate.strip().split()[0].split("#", 1)[0]
            if path_part.startswith(("http://", "https://", "data:")):
                continue
            if path_part and not (ROOT / path_part).exists():
                failures.append(path_part)
    return failures


def main() -> int:
    """Run all package checks and return a shell status.

    Returns:
        Zero when every check passes; one otherwise.

    Example:
        Invoked by `./scripts/test-all.sh` and CI.
    """
    checks = {
        "missing_files": verify_required_files(),
        "invalid_json": verify_json_files(),
        "invalid_portfolio_manifest": verify_portfolio_manifest(),
        "invalid_readme_visual_proof": verify_readme_visual_proof(),
        "release_truth_drift": verify_release_truth_drift(),
        "brand_identity_drift": verify_brand_identity(),
        "source_version_drift": verify_source_version_surfaces(),
        "invalid_public_learning_assets": verify_public_learning_assets(),
        "invalid_visual_catalog_contract": verify_visual_catalog_contract(),
        "invalid_svg": verify_svg_assets(),
        "invalid_railway_config": verify_railway_config(),
        "invalid_docker_cache_mounts": verify_docker_cache_mounts(),
        "possible_secrets": verify_secret_hygiene(),
        "checksum_manifest_drift": verify_checksum_manifest(),
        "broken_readme_links": verify_documentation_links(),
    }
    failures = {name: items for name, items in checks.items() if items}
    if failures:
        print(json.dumps(failures, indent=2, ensure_ascii=False), file=sys.stderr)
        return 1
    print(f"[OK] Verified {len(REQUIRED_FILES)} required files and all packaged assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
