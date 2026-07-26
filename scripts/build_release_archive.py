"""Build a reproducible ZIP directly from canonical Git tree blobs."""

from __future__ import annotations

import argparse
import hashlib
import subprocess
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)


@dataclass(frozen=True, slots=True)
class GitBlob:
    """One canonical blob and its repository path/mode."""

    mode: int
    object_id: str
    path: str


def git_bytes(*arguments: str) -> bytes:
    """Run a read-only Git command against the repository and return stdout."""

    return subprocess.run(
        ["git", "-C", str(ROOT), *arguments],
        capture_output=True,
        check=True,
    ).stdout


def resolve_commit(reference: str) -> str:
    """Resolve a user-provided reference to one immutable commit ID."""

    return git_bytes("rev-parse", "--verify", f"{reference}^{{commit}}").decode(
        "ascii"
    ).strip()


def tree_blobs(commit: str) -> list[GitBlob]:
    """Return every blob in a commit, sorted by its Git tree path."""

    records = git_bytes("ls-tree", "-r", "-z", "--full-tree", commit).split(b"\0")
    blobs: list[GitBlob] = []
    for record in records:
        if not record:
            continue
        metadata, raw_path = record.split(b"\t", maxsplit=1)
        raw_mode, object_type, raw_object_id = metadata.split(maxsplit=2)
        if object_type != b"blob":
            raise ValueError(f"Unsupported Git object type: {object_type!r}")
        path = raw_path.decode("utf-8")
        parsed_path = PurePosixPath(path)
        if parsed_path.is_absolute() or ".." in parsed_path.parts or "\\" in path:
            raise ValueError(f"Unsafe Git tree path: {path!r}")
        blobs.append(
            GitBlob(
                mode=int(raw_mode, 8),
                object_id=raw_object_id.decode("ascii"),
                path=path,
            )
        )
    return sorted(blobs, key=lambda blob: blob.path)


def normalized_prefix(value: str) -> str:
    """Validate and normalize the optional top-level archive directory."""

    prefix = value.strip().strip("/")
    if not prefix:
        return ""
    parsed = PurePosixPath(prefix)
    if parsed.is_absolute() or ".." in parsed.parts or "\\" in prefix:
        raise ValueError(f"Unsafe archive prefix: {value!r}")
    return f"{prefix}/"


def build_archive(reference: str, output: Path, prefix: str) -> tuple[str, int]:
    """Write a deterministic ZIP and return its SHA-256 and file count."""

    commit = resolve_commit(reference)
    blobs = tree_blobs(commit)
    output.parent.mkdir(parents=True, exist_ok=True)
    archive_prefix = normalized_prefix(prefix)
    with ZipFile(
        output,
        mode="x",
        compression=ZIP_DEFLATED,
        compresslevel=9,
        strict_timestamps=True,
    ) as archive:
        for blob in blobs:
            info = ZipInfo(f"{archive_prefix}{blob.path}", date_time=ZIP_TIMESTAMP)
            info.create_system = 3
            info.external_attr = blob.mode << 16
            info.compress_type = ZIP_DEFLATED
            info.flag_bits |= 0x800
            archive.writestr(info, git_bytes("cat-file", "blob", blob.object_id))
    return hashlib.sha256(output.read_bytes()).hexdigest(), len(blobs)


def main() -> int:
    """Build the canonical archive and optionally write its external checksum."""

    parser = argparse.ArgumentParser(
        description="Build a reproducible release ZIP from canonical Git blobs."
    )
    parser.add_argument("--ref", default="HEAD", help="Commit or tag to package.")
    parser.add_argument("--output", type=Path, required=True, help="New ZIP path.")
    parser.add_argument(
        "--prefix",
        default="IvritSheli-v2.8.2",
        help="Top-level directory stored inside the ZIP.",
    )
    parser.add_argument(
        "--checksum-output",
        type=Path,
        help="Optional external SHA-256 manifest path.",
    )
    args = parser.parse_args()

    output = args.output.resolve()
    digest, file_count = build_archive(args.ref, output, args.prefix)
    if args.checksum_output is not None:
        checksum_output = args.checksum_output.resolve()
        checksum_output.parent.mkdir(parents=True, exist_ok=True)
        checksum_output.write_text(
            f"{digest}  {output.name}\n",
            encoding="utf-8",
            newline="\n",
        )
    print(f"[OK] Archived {file_count} canonical Git blobs to {output}.")
    print(f"SHA256 {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
