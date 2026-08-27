"""Regression coverage for the portfolio publication and hosting truth contract."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from scripts import verify_package


def _current_manifest() -> dict[str, object]:
    """Return an isolated copy of the checked-in portfolio manifest."""
    path = verify_package.ROOT / "portfolio" / "project.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _validate_manifest(
    manifest: dict[str, object],
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> list[str]:
    """Validate one mutation in a minimal disposable package root."""
    (tmp_path / "backend").mkdir()
    (tmp_path / "portfolio").mkdir()
    (tmp_path / "backend" / "pyproject.toml").write_text(
        '[project]\nversion = "2.12.2"\n',
        encoding="utf-8",
    )
    (tmp_path / "portfolio" / "project.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    monkeypatch.setattr(verify_package, "ROOT", tmp_path)
    return verify_package.verify_portfolio_manifest()


def test_checked_in_portfolio_manifest_preserves_truth_boundaries() -> None:
    """The real manifest must pass before packaging or publication work begins."""
    manifest = _current_manifest()

    assert verify_package.verify_portfolio_manifest() == []
    assert manifest["source_version"] == "2.12.2"
    assert manifest["source_status"] == "published-source-release"
    assert manifest["latest_published_release"] == "v2.12.2"
    assert manifest["durable_demo"] == {
        "url": None,
        "status": "unavailable",
        "provider": None,
        "last_checked_on": "2026-08-26",
        "boundary": (
            "No durable hosted demo is currently verified. The historical Railway service "
            "is offline, and ephemeral Cloudflare Quick Tunnels are diagnostic sessions "
            "rather than publishable deployment URLs."
        ),
    }


def test_current_screenshot_evidence_can_advance_without_a_false_boolean(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A reviewed current capture may move from candidate to verified-current."""
    manifest = _current_manifest()
    visual_proof = copy.deepcopy(manifest["visual_proof"])
    assert isinstance(visual_proof, dict)
    visual_proof["readme_screenshot_status"] = "verified-current"
    manifest["visual_proof"] = visual_proof

    assert _validate_manifest(manifest, tmp_path, monkeypatch) == []


@pytest.mark.parametrize(
    ("mutation", "expected_failure"),
    (
        (
            ("durable_demo", "status", "verified-live"),
            "durable_demo.status must be 'unavailable'",
        ),
        (
            ("historical_deployment", "current_availability", "verified-live"),
            "current Railway availability as offline",
        ),
        (
            (
                "publication",
                "release_state",
                "2.12.2-published-source-release-live-demo",
            ),
            "publication must identify the current GitHub source release",
        ),
    ),
)
def test_manifest_rejects_current_live_claims(
    mutation: tuple[str, str, object],
    expected_failure: str,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Historical public evidence must not be relabeled as current availability."""
    manifest = _current_manifest()
    section_name, key, value = mutation
    section = copy.deepcopy(manifest[section_name])
    assert isinstance(section, dict)
    section[key] = value
    manifest[section_name] = section

    failures = _validate_manifest(manifest, tmp_path, monkeypatch)

    assert any(expected_failure in failure for failure in failures)


def test_manifest_rejects_hard_coded_quick_tunnel_url(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An ephemeral Quick Tunnel can support diagnosis but never portfolio metadata."""
    manifest = _current_manifest()
    durable_demo = copy.deepcopy(manifest["durable_demo"])
    assert isinstance(durable_demo, dict)
    durable_demo["url"] = "https://temporary-proof.trycloudflare.com"
    manifest["durable_demo"] = durable_demo

    failures = _validate_manifest(manifest, tmp_path, monkeypatch)

    assert any("Quick Tunnel URLs must not be hard-coded" in failure for failure in failures)


def test_published_source_release_does_not_imply_a_hosted_demo() -> None:
    """Tag and Release publication must coexist with an unavailable hosted service."""
    manifest = _current_manifest()

    assert manifest["publication"] == {
        "latest_git_tag": "v2.12.2",
        "latest_github_release": "v2.12.2",
        "source_version_tagged": True,
        "source_version_github_release_published": True,
        "release_state": "2.12.2-published-source-release-no-durable-demo",
    }
    assert manifest["durable_demo"]["status"] == "unavailable"
    assert manifest["historical_deployment"]["current_availability"] == "offline"


def test_faster_whisper_is_optional_not_part_of_standard_container_stack() -> None:
    """Speech remains an optional worker instead of a standard-image claim."""
    manifest = _current_manifest()

    assert "Faster Whisper" not in manifest["standard_stack"]
    assert "Faster Whisper private speech worker" in manifest["optional_capabilities"]


def test_readme_truth_contract_accepts_source_release_without_hosting() -> None:
    """Natural README wording may publish source without claiming a deployment."""
    readme = """
    # Ivrit Sheli 2.12.2
    The published 2.12.2 source release contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    No durable hosted demo is currently verified.
    """

    assert verify_package._verify_readme_release_truth(readme, "2.12.2") == []


@pytest.mark.parametrize(
    "false_claim",
    (
        "Current public deployed application",
        "2.12.2 is live",
        "2.12.2 is deployed",
        "Version 2.4.0 is live at https://example.invalid",
        "Railway production still reports 2.4.0",
        "https://temporary-proof.trycloudflare.com",
    ),
)
def test_readme_truth_contract_rejects_current_or_ephemeral_host_claims(
    false_claim: str,
) -> None:
    """The README validator must fail closed on the stale hosting language."""
    readme = f"""
    # Ivrit Sheli 2.12.2
    The published 2.12.2 source release contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    No durable hosted demo is currently verified.
    {false_claim}
    """

    failures = verify_package._verify_readme_release_truth(readme, "2.12.2")

    assert any("forbidden publication claim" in failure for failure in failures)
