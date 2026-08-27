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
    source_version = manifest["source_version"]
    assert isinstance(source_version, str)
    (tmp_path / "backend" / "pyproject.toml").write_text(
        f'[project]\nversion = "{source_version}"\n',
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
    assert manifest["source_version"] == "2.12.3"
    assert manifest["source_status"] == "private-candidate"
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


def test_checked_in_source_version_surfaces_use_the_exact_patch_version() -> None:
    """Candidate surfaces must not pass on a stale major/minor-only label."""
    assert verify_package.verify_source_version_surfaces() == []


def test_checked_in_readme_visual_proof_is_bound_to_reviewed_bytes() -> None:
    """Every displayed candidate asset must match its approved proof ledger."""
    assert verify_package.verify_readme_visual_proof() == []


@pytest.mark.parametrize(
    "url",
    (
        "http://ivrit-sheli.onrender.com",
        "https://localhost",
        "https://10.0.0.1",
        "https://192.168.1.20",
        "https://[fe80::1]",
        "https://example",
        "https://ivrit-sheli.onrender.com/private/path",
        "https://user:password@ivrit-sheli.onrender.com",
        "https://ivrit-sheli.onrender.com/?token=secret",
    ),
)
def test_public_https_url_rejects_local_private_or_non_origin_values(url: str) -> None:
    """A syntactically HTTPS string is not automatically a public demo origin."""
    assert not verify_package._is_public_https_url(url)


@pytest.mark.parametrize(
    "url",
    (
        "https://ivrit-sheli.onrender.com",
        "https://ivrit-sheli.example.com/",
        "https://1.1.1.1",
    ),
)
def test_public_https_url_accepts_public_looking_https_origins(url: str) -> None:
    """Domain origins and globally routable IPs may advance to live probing."""
    assert verify_package._is_public_https_url(url)


def test_current_screenshot_evidence_can_advance_without_a_false_boolean(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A reviewed current capture may move from historical to verified-current."""
    manifest = _current_manifest()
    visual_proof = copy.deepcopy(manifest["visual_proof"])
    assert isinstance(visual_proof, dict)
    visual_proof["readme_screenshot_source_version"] = "2.12.3"
    visual_proof["readme_screenshot_status"] = "verified-current"
    manifest["visual_proof"] = visual_proof

    assert _validate_manifest(manifest, tmp_path, monkeypatch) == []


@pytest.mark.parametrize(
    ("mutation", "expected_failure"),
    (
        (
            ("durable_demo", "status", "verified-live"),
            "verified durable demo requires a public HTTPS URL",
        ),
        (
            ("historical_deployment", "current_availability", "verified-live"),
            "current Railway availability as offline",
        ),
        (
            (
                "publication",
                "release_state",
                "2.12.3-private-candidate-verified-live-demo",
            ),
            "publication.release_state must match",
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


def test_private_candidate_preserves_latest_release_without_implying_a_demo() -> None:
    """A local candidate must not silently advance GitHub or hosting claims."""
    manifest = _current_manifest()

    assert manifest["publication"] == {
        "latest_git_tag": "v2.12.2",
        "latest_github_release": "v2.12.2",
        "source_version_tagged": False,
        "source_version_github_release_published": False,
        "release_state": "2.12.3-private-candidate-no-durable-demo",
    }
    assert manifest["candidate"]["published"] is False
    assert manifest["durable_demo"]["status"] == "unavailable"
    assert manifest["historical_deployment"]["current_availability"] == "offline"


def test_manifest_accepts_a_coherent_future_publication_transition(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Publication is valid only when every GitHub-facing field advances together."""
    manifest = _current_manifest()
    manifest["source_status"] = "published-source-release"
    manifest["latest_published_release"] = "v2.12.3"
    manifest["summary"] = (
        "The published 2.12.3 source release is a trilingual Hebrew-learning PWA with "
        "240 exact semantic scenes. No durable hosted demo is currently verified."
    )

    tests = copy.deepcopy(manifest["tests"])
    assert isinstance(tests, dict)
    tests["scope"] = "published-source-release-local-verification"
    manifest["tests"] = tests

    publication = copy.deepcopy(manifest["publication"])
    assert isinstance(publication, dict)
    publication.update(
        {
            "latest_git_tag": "v2.12.3",
            "latest_github_release": "v2.12.3",
            "source_version_tagged": True,
            "source_version_github_release_published": True,
            "release_state": "2.12.3-published-source-release-no-durable-demo",
        }
    )
    manifest["publication"] = publication

    candidate = copy.deepcopy(manifest["candidate"])
    assert isinstance(candidate, dict)
    candidate["published"] = True
    manifest["candidate"] = candidate

    visual_proof = copy.deepcopy(manifest["visual_proof"])
    assert isinstance(visual_proof, dict)
    visual_proof["social_preview_version"] = "2.12.3"
    manifest["visual_proof"] = visual_proof

    assert _validate_manifest(manifest, tmp_path, monkeypatch) == []


def test_manifest_accepts_a_coherent_verified_staging_transition(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A staging URL becomes valid only with HTTPS, provider, date, and privacy parity."""
    manifest = _current_manifest()
    manifest["summary"] = (
        "The private 2.12.3 candidate is a trilingual Hebrew-learning PWA with 240 exact "
        "semantic scenes and a verified HTTPS staging demo for invited testers."
    )

    durable_demo = copy.deepcopy(manifest["durable_demo"])
    assert isinstance(durable_demo, dict)
    durable_demo.update(
        {
            "url": "https://ivrit-sheli-staging.example.com",
            "status": "staging-verified",
            "provider": "Example Host",
            "last_checked_on": "2026-08-27",
            "boundary": (
                "This HTTPS staging deployment is verified only for invited testers; it is "
                "not evidence of production readiness, provider permanence, or user acceptance."
            ),
        }
    )
    manifest["durable_demo"] = durable_demo

    publication = copy.deepcopy(manifest["publication"])
    assert isinstance(publication, dict)
    publication["release_state"] = "2.12.3-private-candidate-staging-verified"
    manifest["publication"] = publication

    privacy = copy.deepcopy(manifest["privacy"])
    assert isinstance(privacy, dict)
    privacy["durable_demo_currently_available"] = True
    manifest["privacy"] = privacy

    assert _validate_manifest(manifest, tmp_path, monkeypatch) == []


def test_faster_whisper_is_optional_not_part_of_standard_container_stack() -> None:
    """Speech remains an optional worker instead of a standard-image claim."""
    manifest = _current_manifest()

    assert "Faster Whisper" not in manifest["standard_stack"]
    assert "Faster Whisper private speech worker" in manifest["optional_capabilities"]


def test_readme_truth_contract_accepts_private_candidate_without_hosting() -> None:
    """Natural README wording must distinguish a candidate from its prior release."""
    readme = """
    # Ivrit Sheli 2.12.3
    The private 2.12.3 candidate contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    No durable hosted demo is currently verified.
    """

    assert verify_package._verify_readme_release_truth(
        readme,
        "2.12.3",
        source_status="private-candidate",
        latest_published_release="v2.12.2",
        durable_demo_status="unavailable",
        durable_demo_url=None,
    ) == []


def test_readme_truth_contract_accepts_published_source_without_hosting() -> None:
    """A source release may be published while its hosted demo remains unavailable."""
    readme = """
    # Ivrit Sheli 2.12.2
    The published 2.12.2 source release contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    No durable hosted demo is currently verified.
    """

    assert verify_package._verify_readme_release_truth(
        readme,
        "2.12.2",
        source_status="published-source-release",
        latest_published_release="v2.12.2",
        durable_demo_status="unavailable",
        durable_demo_url=None,
    ) == []


@pytest.mark.parametrize(
    "false_claim",
    (
        "Current public deployed application",
        "2.12.3 is live",
        "2.12.3 is deployed",
        "The published 2.12.3 source release is ready.",
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
    # Ivrit Sheli 2.12.3
    The private 2.12.3 candidate contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    No durable hosted demo is currently verified.
    {false_claim}
    """

    failures = verify_package._verify_readme_release_truth(
        readme,
        "2.12.3",
        source_status="private-candidate",
        latest_published_release="v2.12.2",
        durable_demo_status="unavailable",
        durable_demo_url=None,
    )

    assert any("forbidden publication claim" in failure for failure in failures)


def test_readme_verified_staging_requires_the_exact_https_url() -> None:
    """A generic staging claim cannot stand in for the URL recorded in metadata."""
    readme = """
    # Ivrit Sheli 2.12.3
    The private 2.12.3 candidate contains 240 reviewed concepts.
    The latest published release is v2.12.2.
    This is a verified HTTPS staging demo for invited testers.
    """

    failures = verify_package._verify_readme_release_truth(
        readme,
        "2.12.3",
        source_status="private-candidate",
        latest_published_release="v2.12.2",
        durable_demo_status="staging-verified",
        durable_demo_url="https://ivrit-sheli-staging.example.com",
    )

    assert failures == ["README.md: verified durable demo must include its exact public HTTPS URL"]
