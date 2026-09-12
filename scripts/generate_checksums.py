"""
Module: checksum manifest generator
Purpose: Regenerate SHA256SUMS.txt from the Git index or a clean extracted source package.
Author: Kevin "Lirioth" Cusnir
Updated: 2026-08-10 | TZ: Asia/Jerusalem

In a Git worktree, canonical index blobs remain the source of truth. In an
extracted canonical archive where .git is intentionally absent, shipped bytes
are hashed exactly so verification never reinterprets binary or line-ending
content after packaging.
"""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "SHA256SUMS.txt"
# Clean-package mode walks the filesystem, so every directory `.gitignore`
# keeps out of the repository has to be named here too. `tmp` was missing: the
# first machine to run Playwright before regenerating produced a manifest
# containing `tmp/playwright-results/.last-run.json`, which would then fail
# verification on any machine that had not run the same browser matrix.
EXCLUDED_PARTS = {
    ".git", ".venv", "node_modules", "dist", "coverage", "test-results",
    "tmp", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
}
# `pip install -e backend` writes build metadata beside the sources. It is
# generated, the repository does not track it, and it landed in the manifest the
# first time anyone installed the package in editable mode.
EXCLUDED_DIR_SUFFIXES = (".egg-info",)
EXCLUDED_NAMES = {MANIFEST.name, ".DS_Store", "Thumbs.db"}
# `.gitignore` keeps local learner databases out of the repository as user data
# — `data/**/*.db*`, `data/**/*.sqlite*`. Clean-package mode walks the
# filesystem rather than the Git index, so it hashed them anyway, and every
# `pytest` run or `--doctor` call rewrote them and left the package "stale". A
# manifest that a test run invalidates is not a manifest anyone can verify.
EXCLUDED_SUFFIXES = (".db", ".db-wal", ".db-shm", ".sqlite", ".sqlite3")


def git_index_available() -> bool:
    """Return whether ROOT is a usable Git worktree with an index."""
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--show-toplevel"],
            capture_output=True,
            check=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return False
    return Path(result.stdout.strip()).resolve() == ROOT.resolve()


def tracked_files() -> list[str]:
    """Return sorted repository-relative paths present in the Git index."""
    output = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--cached", "-z"],
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8", errors="surrogateescape")
    return sorted(path for path in output.split("\0") if path and path != MANIFEST.name)


def packaged_files() -> list[str]:
    """Return deterministic files from an intentionally clean extracted source package."""
    files: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if path.name in EXCLUDED_NAMES or any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.name.endswith(EXCLUDED_SUFFIXES):
            continue
        if any(part.endswith(EXCLUDED_DIR_SUFFIXES) for part in relative.parts):
            continue
        files.append(relative.as_posix())
    return sorted(files)


def indexed_blob(relative: str) -> bytes:
    """Read a file exactly as Git will commit it."""
    return subprocess.run(
        ["git", "-C", str(ROOT), "cat-file", "blob", f":{relative}"],
        capture_output=True,
        check=True,
    ).stdout


def packaged_blob(relative: str) -> bytes:
    """Read one extracted canonical-package file without byte conversion.

    The release archive builder writes canonical index blobs directly. Reusing
    Git's text/binary conversion after extraction would be both redundant and
    unsafe because a package has no index or authoritative attribute context.
    """
    return (ROOT / relative).read_bytes()


def main() -> int:
    """Write a deterministic checksum manifest for the available source mode."""
    use_index = git_index_available()
    paths = tracked_files() if use_index else packaged_files()
    reader = indexed_blob if use_index else packaged_blob
    lines = [f"{hashlib.sha256(reader(relative)).hexdigest()}  {relative}" for relative in paths]
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    mode = "canonical Git-index" if use_index else "clean packaged-file"
    print(f"[OK] Wrote {len(lines)} {mode} checksums to {MANIFEST.name}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
