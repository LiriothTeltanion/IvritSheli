"""
Module: checksum manifest generator
Purpose: Regenerate SHA256SUMS.txt from canonical blobs in the Git index.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-22 | TZ: Asia/Jerusalem
Notes: Run after any content change and before tagging; scripts/verify_package.py fails on drift.
"""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "SHA256SUMS.txt"


def tracked_files() -> list[str]:
    """Return sorted repository-relative paths present in the Git index.

    Returns:
        Forward-slash relative paths, excluding the manifest itself.

    Example:
        >>> isinstance(tracked_files(), list)
        True
    """
    output = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--cached", "-z"],
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8", errors="surrogateescape")
    return sorted(path for path in output.split("\0") if path and path != MANIFEST.name)


def indexed_blob(relative: str) -> bytes:
    """Read a file exactly as Git will commit it.

    Hashing the index blob instead of ``Path.read_bytes()`` keeps the manifest
    identical on Windows and Unix when Git's text filters use different working
    tree line endings. Release preparation must stage the intended tree before
    running this script.

    Args:
        relative: Forward-slash repository path returned by :func:`tracked_files`.

    Returns:
        Canonical blob bytes from the Git index.

    Raises:
        subprocess.CalledProcessError: If the path is absent from the index.
    """
    return subprocess.run(
        ["git", "-C", str(ROOT), "cat-file", "blob", f":{relative}"],
        capture_output=True,
        check=True,
    ).stdout


def main() -> int:
    """Write the index-based manifest and report the number of hashed files.

    Returns:
        Zero on success.

    Example:
        Invoked as `python scripts/generate_checksums.py`.
    """
    lines = []
    for relative in tracked_files():
        digest = hashlib.sha256(indexed_blob(relative)).hexdigest()
        lines.append(f"{digest}  {relative}")
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(
        f"[OK] Wrote {len(lines)} canonical Git-index checksums to {MANIFEST.name}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
