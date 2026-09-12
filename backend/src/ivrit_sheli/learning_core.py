"""Evidence-based learning-core contracts and deterministic progression rules.

The module is deliberately persistence-agnostic.  Repositories own transactions while these
pure functions keep phase sequencing, reading-support advancement, and activity explanations
inspectable and testable.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Literal

CONTRACT_VERSION = "2.6"

CurriculumTrack = Literal[
    "modern_conversation",
    "pointed_reading",
    "formal_professional",
]
CefrBand = Literal["A0", "A1", "A2", "B1", "B2", "C1", "C2"]
LearnerMode = Literal["guided", "explorer", "experienced"]
SkillDimension = Literal[
    "recognition",
    "production",
    "listening",
    "speaking",
    "pointed_reading",
    "unpointed_reading",
    "contextual_transfer",
]
EvidenceKind = Literal["exposure", "assisted", "unassisted", "correction_uptake"]
ReadingSupport = Literal[
    "full_niqqud",
    "partial_niqqud",
    "hint_only",
    "unpointed",
]
LessonPhase = Literal[
    "encounter",
    "retrieval",
    "focused_feedback",
    "corrected_retry",
    "delayed_review",
    "transfer",
    "reflection",
]

CURRICULUM_TRACKS: tuple[CurriculumTrack, ...] = (
    "modern_conversation",
    "pointed_reading",
    "formal_professional",
)
CEFR_BANDS: tuple[CefrBand, ...] = ("A0", "A1", "A2", "B1", "B2", "C1", "C2")
LEARNER_MODES: tuple[LearnerMode, ...] = ("guided", "explorer", "experienced")
SKILL_DIMENSIONS: tuple[SkillDimension, ...] = (
    "recognition",
    "production",
    "listening",
    "speaking",
    "pointed_reading",
    "unpointed_reading",
    "contextual_transfer",
)
EVIDENCE_KINDS: tuple[EvidenceKind, ...] = (
    "exposure",
    "assisted",
    "unassisted",
    "correction_uptake",
)
READING_SUPPORT_LADDER: tuple[ReadingSupport, ...] = (
    "full_niqqud",
    "partial_niqqud",
    "hint_only",
    "unpointed",
)
LESSON_PHASES: tuple[LessonPhase, ...] = (
    "encounter",
    "retrieval",
    "focused_feedback",
    "corrected_retry",
    "delayed_review",
    "transfer",
    "reflection",
)

# Two independent, unassisted successes are intentionally required before support is reduced.
# This is a conservative pilot threshold, not a claim of a universal learning interval.
READING_EVIDENCE_THRESHOLD = 2


class LearningCoreConflictError(RuntimeError):
    """Raised when activity concurrency or idempotency validation fails."""


@dataclass(frozen=True, slots=True)
class ReadingEvidenceDecision:
    """Result of applying one learner self-reported reading attempt."""

    level: ReadingSupport
    success_streak: int
    total_successes: int
    total_failures: int
    evidence_to_advance: int
    advanced: bool
    restored: bool
    reason: str


@dataclass(frozen=True, slots=True)
class PhaseDecision:
    """Explain one deterministic lesson-phase transition."""

    from_phase: LessonPhase
    to_phase: LessonPhase
    reason: str


def reading_evidence_to_advance(level: ReadingSupport, success_streak: int) -> int:
    """Return remaining successful evidence before reducing reading support."""
    if level == "unpointed":
        return 0
    return max(0, READING_EVIDENCE_THRESHOLD - success_streak)


def apply_reading_evidence(
    level: ReadingSupport,
    *,
    success_streak: int,
    total_successes: int,
    total_failures: int,
    is_correct: bool,
    hints_used: int,
    has_niqqud: bool = True,
) -> ReadingEvidenceDecision:
    """Advance reading support only after repeated correct, unassisted evidence.

    XP is intentionally absent from this contract. Hinted answers remain useful learning events,
    but they do not count as independent evidence that the learner is ready for less support.
    """
    if min(success_streak, total_successes, total_failures, hints_used) < 0:
        raise ValueError("Reading evidence counters cannot be negative")

    if not has_niqqud:
        return ReadingEvidenceDecision(
            level=level,
            success_streak=success_streak,
            total_successes=total_successes,
            total_failures=total_failures,
            evidence_to_advance=reading_evidence_to_advance(level, success_streak),
            advanced=False,
            restored=False,
            reason=(
                "Reading support stayed unchanged because this item has no reviewed niqqud form."
            ),
        )

    successful_evidence = is_correct and hints_used == 0
    new_streak = success_streak + 1 if successful_evidence else 0
    new_successes = total_successes + int(successful_evidence)
    new_failures = total_failures + int(not is_correct)
    next_level = level
    advanced = False
    restored = False

    if not is_correct and level != "full_niqqud":
        next_level = READING_SUPPORT_LADDER[READING_SUPPORT_LADDER.index(level) - 1]
        restored = True
    elif level != "unpointed" and new_streak >= READING_EVIDENCE_THRESHOLD:
        next_level = READING_SUPPORT_LADDER[READING_SUPPORT_LADDER.index(level) + 1]
        new_streak = 0
        advanced = True

    if advanced:
        reason = (
            "Reading support reduced after two correct, unassisted attempts; XP was not used."
        )
    elif restored:
        reason = "One reading-support rung was restored after an incorrect reading attempt."
    elif successful_evidence:
        reason = "Correct unassisted reading counted as evidence toward the next support level."
    elif is_correct:
        reason = "Correct reading used hints, so support stays unchanged until independent recall."
    else:
        reason = "Reading was not yet correct, so the evidence streak reset without removing support."

    return ReadingEvidenceDecision(
        level=next_level,
        success_streak=new_streak,
        total_successes=new_successes,
        total_failures=new_failures,
        evidence_to_advance=reading_evidence_to_advance(next_level, new_streak),
        advanced=advanced,
        restored=restored,
        reason=reason,
    )


def skill_for_activity(phase: LessonPhase, support: ReadingSupport) -> SkillDimension:
    """Derive the practiced skill from server-owned phase and reading support."""
    if phase == "encounter":
        # Encounter is contextual exposure. Optional browser TTS is an aid, not
        # verified listening evidence, so the activity must not claim it.
        return "recognition"
    if phase in {"retrieval", "delayed_review"}:
        return "unpointed_reading" if support == "unpointed" else "pointed_reading"
    if phase == "focused_feedback":
        return "recognition"
    if phase == "corrected_retry":
        return "production"
    if phase in {"transfer", "reflection"}:
        return "contextual_transfer"
    raise ValueError(f"Unsupported lesson phase: {phase}")


def evidence_kind_for_activity(phase: LessonPhase, hints_used: int) -> EvidenceKind:
    """Classify evidence honestly so assisted work cannot masquerade as recall."""
    if hints_used < 0:
        raise ValueError("hints_used cannot be negative")
    if phase == "corrected_retry":
        return "correction_uptake"
    if phase in {"retrieval", "delayed_review", "transfer"}:
        return "assisted" if hints_used else "unassisted"
    return "exposure"


def transition_phase(phase: LessonPhase, *, is_correct: bool) -> PhaseDecision:
    """Move through the evidence-based lesson loop without client-selected shortcuts."""
    if phase == "encounter":
        return PhaseDecision(phase, "retrieval", "Context encountered; recall now begins without help.")
    if phase == "retrieval":
        return PhaseDecision(
            phase,
            "focused_feedback",
            "Learner self-report recorded; reviewed reference feedback follows before retry.",
        )
    if phase == "focused_feedback":
        return PhaseDecision(
            phase,
            "corrected_retry",
            "Reference feedback reviewed; now self-correct the answer from memory.",
        )
    if phase == "corrected_retry":
        if is_correct:
            return PhaseDecision(
                phase,
                "delayed_review",
                "Corrected recall succeeded; the scheduler now creates a delayed review.",
            )
        return PhaseDecision(
            phase,
            "focused_feedback",
            "The learner reported another miss; review the reference again before retrying.",
        )
    if phase == "delayed_review":
        if is_correct:
            return PhaseDecision(
                phase,
                "transfer",
                "Delayed recall succeeded; apply the concept in a new context.",
            )
        return PhaseDecision(
            phase,
            "focused_feedback",
            "Delayed recall was reported as missed; revisit the reference before a new retry.",
        )
    if phase == "transfer":
        return PhaseDecision(
            phase,
            "reflection",
            "Transfer evidence recorded; reflect on confidence and real-life use.",
        )
    if phase == "reflection":
        return PhaseDecision(
            phase,
            "encounter",
            "Reflection completed; the next due or unseen concept can begin.",
        )
    raise ValueError(f"Unsupported lesson phase: {phase}")


def activity_prompt_key(phase: LessonPhase, mode: LearnerMode) -> str:
    """Return a localization key instead of embedding UI copy in the API."""
    return f"learning_core.{mode}.{phase}"


def activity_rationale(
    phase: LessonPhase,
    support: ReadingSupport,
    *,
    niqqud_available: bool = True,
) -> str:
    """Explain why the deterministic learning core selected this activity."""
    explanations: dict[LessonPhase, str] = {
        "encounter": "Build a meaningful context trace before testing memory; optional audio is an aid, not listening evidence.",
        "retrieval": "Unassisted retrieval strengthens memory more than immediately revealing the answer.",
        "focused_feedback": (
            "Reviewed reference feedback supports self-correction without claiming error diagnosis."
        ),
        "corrected_retry": "Immediate self-correction turns reference feedback into usable recall.",
        "delayed_review": (
            "A delayed learner self-report checks whether the concept remained retrievable over time."
        ),
        "transfer": "A new context tests usable Hebrew instead of repeating the same prompt.",
        "reflection": "Reflection records confidence and prepares a relevant future review.",
    }
    if not niqqud_available:
        return (
            explanations[phase]
            + " No reviewed niqqud form is available, so practice uses unpointed Hebrew and "
            "the support state stays unchanged."
        )
    support_note = {
        "full_niqqud": " Full niqqud remains visible while independent reading evidence develops.",
        "partial_niqqud": (
            " A reviewed reading cue is shown when available; otherwise full niqqud "
            "remains visible."
        ),
        "hint_only": " Niqqud is available as a hint but is no longer shown automatically.",
        "unpointed": " The item is now practiced in everyday unpointed Hebrew.",
    }[support]
    return explanations[phase] + support_note


def build_activity_token(
    *,
    item_id: int,
    phase: LessonPhase,
    state_version: int,
    state_updated_at: str,
    due_at: str,
    item_updated_at: str,
    support: ReadingSupport,
    niqqud_available: bool,
) -> str:
    """Build an opaque concurrency checksum from server-owned activity state.

    This token is not an authentication credential. API authentication and CSRF remain separate;
    the digest only lets the transactional write path detect stale or replayed UI state.
    """
    if item_id < 1 or state_version < 0:
        raise ValueError("Activity token state is invalid")
    canonical = "\x1f".join(
        (
            CONTRACT_VERSION,
            str(item_id),
            phase,
            str(state_version),
            state_updated_at,
            due_at,
            item_updated_at,
            support,
            "niqqud" if niqqud_available else "unpointed_only",
        )
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
