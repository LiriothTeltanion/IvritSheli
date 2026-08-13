"""Regression coverage for canonical index and extracted-package checksums."""

from __future__ import annotations

import subprocess
from pathlib import Path

from scripts import generate_checksums, verify_package


def git(root: Path, *arguments: str) -> bytes:
    """Run a deterministic Git command in a disposable repository."""
    return subprocess.run(
        ["git", "-C", str(root), *arguments],
        capture_output=True,
        check=True,
    ).stdout


def test_index_bytes_delegate_text_and_binary_rules_to_git(
    tmp_path: Path,
    monkeypatch: object,
) -> None:
    """The index path must use Git's own attributes and binary classifier."""
    git(tmp_path, "init", "--quiet")
    (tmp_path / ".gitattributes").write_text(
        "* text=auto\n*.ps1 text eol=crlf\n",
        encoding="utf-8",
        newline="\n",
    )
    (tmp_path / "script.ps1").write_bytes(b"Write-Host one\r\nWrite-Host two\r\n")
    late_nul = b"A" * 9000 + b"\x00\r\nB"
    (tmp_path / "late-nul.bin").write_bytes(late_nul)
    git(tmp_path, "add", ".gitattributes", "script.ps1", "late-nul.bin")

    monkeypatch.setattr(generate_checksums, "ROOT", tmp_path)  # type: ignore[attr-defined]
    monkeypatch.setattr(verify_package, "ROOT", tmp_path)  # type: ignore[attr-defined]

    assert generate_checksums.indexed_blob("script.ps1") == b"Write-Host one\nWrite-Host two\n"
    assert verify_package.canonical_file_bytes("script.ps1", use_index=True) == (
        b"Write-Host one\nWrite-Host two\n"
    )
    assert generate_checksums.indexed_blob("late-nul.bin") == late_nul
    assert verify_package.canonical_file_bytes("late-nul.bin", use_index=True) == late_nul


def test_extracted_package_bytes_are_never_reinterpreted(
    tmp_path: Path,
    monkeypatch: object,
) -> None:
    """Without Git metadata, every shipped byte is part of the integrity contract."""
    samples = {
        "crlf.ps1": b"one\r\ntwo\r\n",
        "lone-cr.bin": b"one\rtwo\r\n",
        "controls.bin": b"\x01\x02\x03\r\n",
        "early-nul.bin": b"A\x00\r\nB",
        "late-nul.bin": b"A" * 9000 + b"\x00\r\nB",
    }
    for relative, data in samples.items():
        (tmp_path / relative).write_bytes(data)

    monkeypatch.setattr(generate_checksums, "ROOT", tmp_path)  # type: ignore[attr-defined]
    monkeypatch.setattr(verify_package, "ROOT", tmp_path)  # type: ignore[attr-defined]

    for relative, data in samples.items():
        assert generate_checksums.packaged_blob(relative) == data
        assert verify_package.canonical_file_bytes(relative, use_index=False) == data
