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

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "README.md",
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
    "backend/src/ivrit_sheli/db_admin.py",
    "backend/src/ivrit_sheli/request_limits.py",
    "backend/src/ivrit_sheli/structured_logging.py",
    "frontend/package-lock.json",
    "frontend/src/App.tsx",
    "frontend/src/components/AuthGate.tsx",
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
    for relative in ("frontend/package.json", "frontend/public/manifest.webmanifest"):
        try:
            json.loads((ROOT / relative).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            failures.append(f"{relative}: {error}")
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
        "invalid_svg": verify_svg_assets(),
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
