"""
Module: package verifier
Purpose: Validate the distributable repository structure, documentation, assets, and secret hygiene.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python 3.10 CI uses the pinned backport.
    import tomli as tomllib

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "README.md",
    "portfolio/project.json",
    "PACKAGE_MANIFEST.md",
    "TEST_REPORT.md",
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
    "backend/pyproject.toml",
    "backend/alembic.ini",
    "backend/migrations/versions/20260716_0001_cloud_identity_and_state.py",
    "backend/src/ivrit_sheli/api.py",
    "backend/src/ivrit_sheli/auth.py",
    "backend/src/ivrit_sheli/cloud_repository.py",
    "backend/src/ivrit_sheli/cloud_store.py",
    "backend/src/ivrit_sheli/audio.py",
    "backend/src/ivrit_sheli/repository.py",
    "backend/src/ivrit_sheli/db_admin.py",
    "backend/src/ivrit_sheli/request_limits.py",
    "backend/src/ivrit_sheli/structured_logging.py",
    "frontend/package-lock.json",
    "frontend/src/App.tsx",
    "frontend/src/components/AuthGate.tsx",
    "frontend/src/components/MicWordAnalyzer.tsx",
    "frontend/src/components/RegistryPanel.tsx",
    "frontend/src/voicePreference.ts",
    "frontend/public/manifest.webmanifest",
    "docs/ULTIMATE_BUILD_SPEC.md",
    "docs/ARCHITECTURE.md",
    "docs/AI_ENGINE.md",
    "docs/DICTIONARY.md",
    "docs/AUDIO.md",
    "docs/GAMIFICATION.md",
    "docs/PERSONALIZATION.md",
    "docs/DESIGN_SYSTEM.md",
    "docs/CONNECTORS.md",
    "docs/API.md",
    "docs/DEPLOYMENT.md",
    "docs/USER_GUIDE.md",
    "docs/DEMO_DAY.md",
    "assets/brand/logo.svg",
    "assets/brand/app-icon.svg",
    "assets/brand/kc-lt-signature.svg",
    "assets/readme/cloud-architecture.svg",
    "assets/readme/ivrit-sheli-2-dashboard.png",
    "assets/readme/ivrit-sheli-2-mobile.png",
    "assets/readme/ivrit-sheli-2-hebrew-rtl.png",
    "assets/social/ivrit-sheli-social-preview.svg",
    "assets/social/ivrit-sheli-social-preview.png",
    "scripts/docker-entrypoint.sh",
    "scripts/verify_container_logs.py",
)

SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
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
    """Enforce the conservative public release-truth contract.

    The portfolio manifest is intentionally strict because the profile and
    other recruiter-facing surfaces consume it as a machine-readable source.
    Changes to versions, tests, deployment, publication, visuals or OAuth
    boundaries must be made deliberately here and in the supporting evidence.
    """
    path = ROOT / "portfolio" / "project.json"
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"portfolio/project.json: {error}"]

    top_level, failures = _verify_exact_keys(
        manifest,
        {
            "schema",
            "slug",
            "name",
            "source_version",
            "live_version",
            "status",
            "default_branch",
            "repository_url",
            "demo_url",
            "summary",
            "languages",
            "stack",
            "tests",
            "deployment",
            "publication",
            "visual_proof",
            "oauth",
            "privacy",
        },
        "root",
    )
    if top_level is None:
        return failures

    expected_scalars = {
        "schema": "ivrit-sheli-portfolio-project-v1",
        "slug": "ivrit-sheli",
        "name": "Ivrit Sheli — העברית שלי",
        "source_version": "2.2.0",
        "live_version": "2.2.0",
        "status": "live",
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
    if top_level.get("stack") != [
        "React 19",
        "TypeScript",
        "FastAPI",
        "Python",
        "PostgreSQL 17",
        "SQLite",
        "Alembic",
        "Docker",
        "Railway",
    ]:
        failures.append("portfolio/project.json: stack does not match the verified public stack")

    tests, nested_failures = _verify_exact_keys(
        top_level.get("tests"),
        {
            "backend_unique",
            "frontend",
            "frontend_files",
            "total_unique",
            "ordinary_backend_passed",
            "ordinary_backend_skipped",
            "postgresql_gate_passed",
            "evidence",
        },
        "tests",
    )
    failures.extend(nested_failures)
    expected_tests = {
        "backend_unique": 139,
        "frontend": 48,
        "frontend_files": 12,
        "total_unique": 187,
        "ordinary_backend_passed": 138,
        "ordinary_backend_skipped": 1,
        "postgresql_gate_passed": 3,
        "evidence": "TEST_REPORT.md",
    }
    if tests is not None and tests != expected_tests:
        failures.append("portfolio/project.json: tests must match the documented 139 + 48 = 187 baseline")

    deployment, nested_failures = _verify_exact_keys(
        top_level.get("deployment"),
        {
            "provider",
            "runtime",
            "database",
            "status",
            "production_commit",
            "verified_on",
            "environment",
            "health_live",
            "health_ready",
            "postgresql_ready",
            "dictionary_ready",
        },
        "deployment",
    )
    failures.extend(nested_failures)
    expected_deployment = {
        "provider": "Railway",
        "runtime": "Docker",
        "database": "PostgreSQL 17",
        "status": "verified",
        "production_commit": "c8c928661bdcf179ed1d9df88b9f2e4d730ffea3",
        "verified_on": "2026-07-18",
        "environment": "production",
        "health_live": True,
        "health_ready": True,
        "postgresql_ready": True,
        "dictionary_ready": True,
    }
    if deployment is not None and deployment != expected_deployment:
        failures.append("portfolio/project.json: deployment does not match verified Railway production")

    publication, nested_failures = _verify_exact_keys(
        top_level.get("publication"),
        {
            "latest_git_tag",
            "latest_github_release",
            "source_version_tagged",
            "source_version_github_release_published",
            "release_state",
        },
        "publication",
    )
    failures.extend(nested_failures)
    expected_publication = {
        "latest_git_tag": "v2.2.0",
        "latest_github_release": "v2.2.0",
        "source_version_tagged": True,
        "source_version_github_release_published": True,
        "release_state": "published-and-deployed",
    }
    if publication is not None and publication != expected_publication:
        failures.append("portfolio/project.json: publication must match the published v2.2.0 tag/release state")

    visual_proof, nested_failures = _verify_exact_keys(
        top_level.get("visual_proof"),
        {
            "state",
            "social_preview_version",
            "readme_screenshot_version",
            "readme_screenshots_match_live_version",
            "live_2_2_interactive_browser_qa",
        },
        "visual_proof",
    )
    failures.extend(nested_failures)
    expected_visual_proof = {
        "state": "partial",
        "social_preview_version": "2.2.0",
        "readme_screenshot_version": "2.1.x",
        "readme_screenshots_match_live_version": False,
        "live_2_2_interactive_browser_qa": "pending",
    }
    if visual_proof is not None and visual_proof != expected_visual_proof:
        failures.append("portfolio/project.json: visual proof must remain partial until 2.2 QA/assets exist")

    oauth, nested_failures = _verify_exact_keys(
        top_level.get("oauth"),
        {
            "provider",
            "consent_handoff_verified",
            "cancellation_verified",
            "final_live_code_exchange_verified",
            "authenticated_session_refresh_verified",
            "logout_verified",
            "boundary",
        },
        "oauth",
    )
    failures.extend(nested_failures)
    expected_oauth = {
        "provider": "GitHub",
        "consent_handoff_verified": True,
        "cancellation_verified": True,
        "final_live_code_exchange_verified": False,
        "authenticated_session_refresh_verified": False,
        "logout_verified": False,
        "boundary": (
            "Consent handoff and cancellation are verified; the final live authorization-code "
            "exchange, authenticated refresh persistence and logout are not verified end to end."
        ),
    }
    if oauth is not None and oauth != expected_oauth:
        failures.append("portfolio/project.json: OAuth must retain the unverified end-to-end boundary")

    privacy, nested_failures = _verify_exact_keys(
        top_level.get("privacy"),
        {"local_first", "public_demo_data", "public_demo_mutations", "contains_secrets"},
        "privacy",
    )
    failures.extend(nested_failures)
    expected_privacy = {
        "local_first": True,
        "public_demo_data": "synthetic",
        "public_demo_mutations": "server-blocked",
        "contains_secrets": False,
    }
    if privacy is not None and privacy != expected_privacy:
        failures.append("portfolio/project.json: privacy contract does not match the public demo")

    return failures


def verify_release_truth_drift() -> list[str]:
    """Keep human-readable release surfaces aligned with the public manifest."""
    expected_fragments = {
        "README.md": (
            "Open the verified live Ivrit Sheli 2.2.0 demo",
            "c8c928661bdcf179ed1d9df88b9f2e4d730ffea3",
            "Git tag and GitHub Release `v2.2.0` are published",
            "139 unique backend tests + 48 frontend tests = 187",
        ),
        "TEST_REPORT.md": (
            "Current live release | `2.2.0` / production / PostgreSQL",
            "c8c928661bdcf179ed1d9df88b9f2e4d730ffea3",
            "Latest Git tag / GitHub Release | `v2.2.0` / `v2.2.0`",
        ),
        "CHANGELOG.md": (
            "production commit `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`",
            "Git tag and GitHub Release `v2.2.0` are published",
        ),
        "PACKAGE_MANIFEST.md": (
            "Live source version: `2.2.0`",
            "Latest Git tag and GitHub Release: `v2.2.0`",
            "187 passed",
        ),
        "docs/DEPLOYMENT.md": (
            "Current production verification record — 2.2.0 — 2026-07-18",
            "c8c928661bdcf179ed1d9df88b9f2e4d730ffea3",
        ),
        "docs/DEMO_DAY.md": (
            "187 unique automated tests",
            "Ivrit Sheli 2.2.0 is live on Railway",
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
    expected = {"overlapSeconds": 10, "drainingSeconds": 15}
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
    allowed_suffixes = {".py", ".ts", ".tsx", ".js", ".json", ".md", ".yml", ".yaml", ".env", ".example", ".sh", ".ps1"}
    excluded_parts = {"node_modules", "dist", ".venv", ".git", "__pycache__", ".mypy_cache", ".ruff_cache"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in excluded_parts for part in path.parts):
            continue
        if path.suffix not in allowed_suffixes and path.name != ".env.example":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if any(pattern.search(text) for pattern in SECRET_PATTERNS):
            failures.append(str(path.relative_to(ROOT)))
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
        "invalid_svg": verify_svg_assets(),
        "invalid_railway_config": verify_railway_config(),
        "invalid_docker_cache_mounts": verify_docker_cache_mounts(),
        "possible_secrets": verify_secret_hygiene(),
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
