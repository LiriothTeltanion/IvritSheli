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
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python 3.10 CI uses the pinned backport.
    import tomli as tomllib

ROOT = Path(__file__).resolve().parents[1]


def source_version() -> str:
    """Return the packaged executable version from backend project metadata."""
    try:
        package = tomllib.loads((ROOT / "backend" / "pyproject.toml").read_text(encoding="utf-8"))
        version = package.get("project", {}).get("version")
    except (OSError, tomllib.TOMLDecodeError) as error:
        raise RuntimeError(f"cannot read source version: {error}") from error
    if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise RuntimeError(f"invalid backend project version: {version!r}")
    return version

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
    "frontend/src/components/WordIllustration.tsx",
    "frontend/src/components/WordIllustration.test.tsx",
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
    "docs/CONNECTORS.md",
    "docs/API.md",
    "docs/DEPLOYMENT.md",
    "docs/USER_GUIDE.md",
    "docs/DEMO_DAY.md",
    "docs/BUILD_WEEK.md",
    "assets/brand/logo.svg",
    "assets/brand/app-icon.svg",
    "assets/brand/brand-mark.svg",
    "assets/brand/wordmark-monochrome.svg",
    "assets/brand/kc-lt-signature.svg",
    "assets/readme/cloud-architecture.svg",
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
)

PUBLIC_REGION_ART = (
    "frontend/public/illustrations/regions/galilee.webp",
    "frontend/public/illustrations/regions/haifa-carmel.webp",
    "frontend/public/illustrations/regions/tel-aviv-jaffa.webp",
    "frontend/public/illustrations/regions/jerusalem.webp",
    "frontend/public/illustrations/regions/dead-sea.webp",
    "frontend/public/illustrations/regions/negev.webp",
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
    ):
        try:
            json.loads((ROOT / relative).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            failures.append(f"{relative}: {error}")
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
    """Enforce the conservative private-candidate/public-release contract."""
    path = ROOT / "portfolio" / "project.json"
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
        current_version = source_version()
    except (OSError, json.JSONDecodeError, RuntimeError) as error:
        return [f"portfolio/project.json: {error}"]

    top_level, failures = _verify_exact_keys(
        manifest,
        {
            "schema", "slug", "name", "source_version", "live_version", "status",
            "default_branch", "repository_url", "demo_url", "summary", "languages",
            "stack", "tests", "deployment", "publication", "candidate", "visual_proof",
            "oauth", "privacy",
        },
        "root",
    )
    if top_level is None:
        return failures

    expected_scalars = {
        "schema": "ivrit-sheli-portfolio-project-v2",
        "slug": "ivrit-sheli",
        "name": "Ivrit Sheli — העברית שלי",
        "source_version": current_version,
        "live_version": "2.4.0",
        "status": "private-release-candidate",
        "default_branch": "main",
        "repository_url": "https://github.com/LiriothTeltanion/IvritSheli",
        "demo_url": "https://ivritsheli-production.up.railway.app",
    }
    for key, expected in expected_scalars.items():
        if top_level.get(key) != expected:
            failures.append(
                f"portfolio/project.json: {key} must be {expected!r}, got {top_level.get(key)!r}"
            )

    summary = top_level.get("summary")
    if not isinstance(summary, str) or not 80 <= len(summary) <= 300:
        failures.append("portfolio/project.json: summary must contain 80-300 public characters")
    if top_level.get("languages") != ["en", "es", "he"]:
        failures.append("portfolio/project.json: languages must be ['en', 'es', 'he']")
    expected_stack = [
        "React 19", "TypeScript", "FastAPI", "Python", "PostgreSQL 17", "SQLite",
        "Alembic", "Faster Whisper", "Web Push", "Docker", "Railway",
    ]
    if top_level.get("stack") != expected_stack:
        failures.append("portfolio/project.json: stack does not match the candidate stack")

    # Public evidence stays pinned to the last genuinely verified public release.
    tests, nested = _verify_exact_keys(
        top_level.get("tests"),
        {"version", "backend_unique", "frontend", "frontend_files", "total_unique",
         "ordinary_backend_passed", "ordinary_backend_skipped", "postgresql_gate_passed", "evidence"},
        "tests",
    )
    failures.extend(nested)
    expected_tests = {
        "version": "2.4.0", "backend_unique": 151, "frontend": 62,
        "frontend_files": 16, "total_unique": 213, "ordinary_backend_passed": 150,
        "ordinary_backend_skipped": 1, "postgresql_gate_passed": 3,
        "evidence": "TEST_REPORT.md",
    }
    if tests is not None and tests != expected_tests:
        failures.append("portfolio/project.json: public test baseline must remain the verified 2.4.0 baseline")

    deployment, nested = _verify_exact_keys(
        top_level.get("deployment"),
        {"version", "provider", "runtime", "database", "status", "release_implementation_commit",
         "verified_on", "environment", "health_live", "health_ready", "postgresql_ready",
         "dictionary_ready", "dictionary_entries", "english_entry_verified", "read_only_tour_verified"},
        "deployment",
    )
    failures.extend(nested)
    expected_deployment = {
        "version": "2.4.0", "provider": "Railway", "runtime": "Docker",
        "database": "PostgreSQL 17", "status": "verified-live",
        "release_implementation_commit": "03bf84b9268ff8be528c0fab3c670f9652ee23b0",
        "verified_on": "2026-07-21", "environment": "production", "health_live": True,
        "health_ready": True, "postgresql_ready": True, "dictionary_ready": True,
        "dictionary_entries": 48, "english_entry_verified": True, "read_only_tour_verified": True,
    }
    if deployment is not None and deployment != expected_deployment:
        failures.append("portfolio/project.json: deployment must remain the verified 2.4.0 production record")

    publication, nested = _verify_exact_keys(
        top_level.get("publication"),
        {"latest_git_tag", "latest_github_release", "source_version_tagged",
         "source_version_github_release_published", "release_state"},
        "publication",
    )
    failures.extend(nested)
    expected_publication = {
        "latest_git_tag": "v2.4.0",
        "latest_github_release": "v2.4.0",
        "source_version_tagged": False,
        "source_version_github_release_published": False,
        "release_state": f"{current_version}-private-candidate-2.4.0-live-and-published",
    }
    if publication is not None and publication != expected_publication:
        failures.append("portfolio/project.json: publication boundary must keep the candidate private and v2.4.0 public")

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
            "published": False,
            "coverage": "Structured A0-A2 with an explicitly experimental B1/B2 Lab",
            "reviewed_concepts": 240,
            "learner_experiences": ["Guided", "Explorer", "Experienced"],
            "learning_engine": "Deterministic LocalLearningEngine",
            "personal_coach": "Reviewed deterministic LocalPersonalCoach with bounded feedback",
            "speech": "Self-hosted Faster Whisper small, Hebrew, CPU INT8, 20-second private pilot limit",
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

    visual_proof, nested = _verify_exact_keys(
        top_level.get("visual_proof"),
        {"state", "social_preview_version", "readme_screenshot_version",
         "readme_screenshots_match_source_version", "interactive_browser_qa"},
        "visual_proof",
    )
    failures.extend(nested)
    if visual_proof is not None:
        if "240" not in str(visual_proof.get("state", "")):
            failures.append("portfolio/project.json: visual_proof.state must record 240 exact semantic scenes")
        if visual_proof.get("readme_screenshots_match_source_version") is not False:
            failures.append("portfolio/project.json: inherited README screenshots must not be claimed as current")
        if "240" not in str(visual_proof.get("interactive_browser_qa", "")):
            failures.append("portfolio/project.json: visual QA boundary must mention the 240-scene candidate")

    oauth, nested = _verify_exact_keys(
        top_level.get("oauth"),
        {"providers", "source_contract_tested", "google_live_configured", "google_live_sign_in_verified",
         "github_live_successful_session_verified", "authenticated_session_refresh_verified",
         "onboarding_persistence_across_reload_verified", "logout_verified", "signed_out_reload_verified",
         "relogin_after_logout_verified", "boundary"},
        "oauth",
    )
    failures.extend(nested)
    if oauth is not None:
        if oauth.get("providers") != ["Google", "GitHub"]:
            failures.append("portfolio/project.json: OAuth providers must remain Google + GitHub")
        boundary = oauth.get("boundary")
        if not isinstance(boundary, str) or "openid profile" not in boundary.lower() and "identity-only" not in boundary.lower():
            failures.append("portfolio/project.json: OAuth boundary must preserve identity-only Google sign-in")

    privacy, nested = _verify_exact_keys(
        top_level.get("privacy"),
        {"local_first", "public_demo_data", "public_demo_mutations", "self_service_export_in_source",
         "self_service_deletion_in_source", "contains_secrets"},
        "privacy",
    )
    failures.extend(nested)
    expected_privacy = {
        "local_first": True, "public_demo_data": "synthetic", "public_demo_mutations": "server-blocked",
        "self_service_export_in_source": True, "self_service_deletion_in_source": True,
        "contains_secrets": False,
    }
    if privacy is not None and privacy != expected_privacy:
        failures.append("portfolio/project.json: privacy contract changed unexpectedly")
    return failures

def verify_release_truth_drift() -> list[str]:
    """Keep current candidate claims honest without rewriting historical evidence."""
    try:
        current_version = source_version()
    except RuntimeError as error:
        return [str(error)]

    expected_fragments = {
        "README.md": (
            f"Ivrit Sheli {current_version}",
            "Current public deployed application | `2.4.0`",
            "03bf84b9268ff8be528c0fab3c670f9652ee23b0",
            "240",
            "private",
        ),
        "CHANGELOG.md": (
            f"{current_version} — Visual Language Consolidation",
            "240/240",
            "2.4.0 — Contest Edition — 2026-07-21",
        ),
        "PACKAGE_MANIFEST.md": (
            f"Source version: `{current_version}`",
            "Current verified public version: `2.4.0`",
            "240",
        ),
        "TEST_REPORT.md": (
            f"Current private source candidate:** `{current_version}`",
            "2.9.2",
            "699",
            "2.4.0",
        ),
        "docs/API.md": (f"{current_version}", "identity-only"),
        "docs/VOCABULARY_ILLUSTRATION_SYSTEM.md": ("240", "exact semantic"),
        "docs/DESIGN_SYSTEM.md": ("240", "semantic"),
        "docs/USER_GUIDE.md": ("240",),
        "docs/VISUAL_BIBLE.md": ("240 reviewed concepts / 240 exact semantic scenes",),
        "CITATION.cff": (f"version: {current_version}", "verified public v2.4.0 release"),
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

    # Candidate surfaces must never imply this unpublished tree replaced the verified public release.
    forbidden = {
        "README.md": (f"{current_version} is live", f"v{current_version} release is published"),
        "PACKAGE_MANIFEST.md": (f"v{current_version} is the latest published",),
        "TEST_REPORT.md": (f"Current verified production:** `{current_version}`",),
    }
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
    """Keep executable and human-facing candidate versions synchronized."""
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
        "backend/src/ivrit_sheli/__init__.py": f'__version__ = "{expected_version}"',
        "frontend/index.html": f"Ivrit Sheli {'.'.join(expected_version.split('.')[:2])}",
        "frontend/public/sw.js": f"ivrit-sheli-shell-v{expected_version}",
        "frontend/src/release.ts": f"CANDIDATE_VERSION = '{expected_version}'",
        ".github/ISSUE_TEMPLATE/bug_report.yml": f"placeholder: {expected_version}-private",
        "CITATION.cff": f"version: {expected_version}",
    }
    for relative, fragment in expected_fragments.items():
        try:
            text = (ROOT / relative).read_text(encoding="utf-8")
        except OSError as error:
            failures.append(f"{relative}: {error}")
            continue
        if fragment not in text:
            failures.append(f"{relative}: missing release version fragment {fragment!r}")
    return failures

def verify_public_learning_assets() -> list[str]:
    """Validate the offline starter contract and the six public region scenes."""
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
