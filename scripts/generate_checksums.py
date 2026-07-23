"""
Module: checksum manifest generator
Purpose: Regenerate SHA256SUMS.txt over every git-tracked file so the release manifest cannot drift silently.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-22 | TZ: Asia/Jerusalem
Notes: Run after any content change and before tagging; scripts/verify_package.py fails on drift.
"""

from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "SHA256SUMS.txt"


def tracked_files() -> list[str]:
    """Return sorted repository-relative paths of git-tracked files.

    Returns:
        Forward-slash relative paths, excluding the manifest itself.

    Example:
        >>> isinstance(tracked_files(), list)
        True
    """
    output = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "-z"],
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8")
    return sorted(path for path in output.split("\0") if path and path != MANIFEST.name)


def main() -> int:
    """Write the manifest and report the number of hashed files.

    Returns:
        Zero on success.

    Example:
        Invoked as `python scripts/generate_checksums.py`.
    """
    lines = []
    for relative in tracked_files():
        digest = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
        lines.append(f"{digest}  {relative}")
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] Wrote {len(lines)} checksums to {MANIFEST.name}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
