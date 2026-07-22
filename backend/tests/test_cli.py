"""CLI coverage for the v2.6 Learning Core profile controls."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ivrit_sheli.cli import build_parser, main


def test_learning_core_cli_options_are_independent() -> None:
    args = build_parser().parse_args(
        [
            "--set-curriculum-track",
            "formal_professional",
            "--set-cefr-band",
            "b2",
            "--set-learner-mode",
            "guided",
        ]
    )

    assert args.set_curriculum_track == "formal_professional"
    assert args.set_cefr_band == "B2"
    assert args.set_learner_mode == "guided"


def test_learning_core_cli_updates_and_reports_local_profile(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setenv("APP_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("APP_DB_PATH", str(tmp_path / "learning.db"))
    monkeypatch.setenv("DICTIONARY_DB_PATH", str(tmp_path / "dictionary.db"))
    monkeypatch.setenv("AI_PROVIDER", "offline")
    monkeypatch.setenv("ALLOW_CLOUD_PROCESSING", "false")

    result = main(
        [
            "--init",
            "--set-curriculum-track",
            "pointed_reading",
            "--set-cefr-band",
            "A1",
            "--set-learner-mode",
            "explorer",
            "--learning-core-status",
        ]
    )

    assert result == 0
    output = capsys.readouterr().out
    assert "track=pointed_reading, band=A1, mode=explorer" in output
    json_start = output.index("{\n")
    status = json.loads(output[json_start:])
    assert status["contract_version"] == "2.6"
    assert status["profile"] == {
        "curriculum_track": "pointed_reading",
        "cefr_band": "A1",
        "learner_mode": "explorer",
    }
