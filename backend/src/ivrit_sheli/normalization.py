"""
Module: Hebrew normalization
Purpose: Normalize Hebrew safely for search, review matching, redaction, and pronunciation comparison.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher

HEBREW_MARKS_RE = re.compile(r"[\u0591-\u05BD\u05BF-\u05C7]")
HEBREW_TOKEN_RE = re.compile(r"[\u0590-\u05FF]+(?:[׳״'\-][\u0590-\u05FF]+)*")
MULTISPACE_RE = re.compile(r"\s+")
EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<!\w)(?:\+?972[-\s]?)?0?5\d[-\s]?\d{3}[-\s]?\d{4}(?!\w)")
LONG_NUMBER_RE = re.compile(r"(?<!\d)\d{7,12}(?!\d)")
TOKEN_URL_RE = re.compile(r"https?://\S*(?:token|key|auth|signature)=\S+", re.IGNORECASE)


@dataclass(frozen=True, slots=True)
class PronunciationBreakdown:
    """Transparent components of a transcription-based pronunciation score.

    Args:
        score: Final score from 0 to 100.
        sequence_similarity: Character-sequence similarity from 0 to 1.
        word_coverage: Target token coverage from 0 to 1.
        length_balance: Length similarity from 0 to 1.
        missing_words: Target words not found in the transcript.
        extra_words: Transcript words not found in the target.

    Example:
        >>> pronunciation_breakdown("שלום", "שלום").score
        100
    """

    score: int
    sequence_similarity: float
    word_coverage: float
    length_balance: float
    missing_words: tuple[str, ...]
    extra_words: tuple[str, ...]


def strip_niqqud(text: str) -> str:
    """Remove Hebrew cantillation and vowel marks while preserving letters.

    Args:
        text: Hebrew or mixed text.

    Returns:
        Text without Hebrew combining marks.

    Raises:
        TypeError: If `text` is not a string.

    Example:
        >>> strip_niqqud("שָׁלוֹם")
        'שלום'
    """
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    return HEBREW_MARKS_RE.sub("", unicodedata.normalize("NFD", text))


def normalize_hebrew(text: str) -> str:
    """Normalize Hebrew for matching without destroying the display form.

    Args:
        text: Hebrew or mixed text.

    Returns:
        Niqqud-free, punctuation-light, single-spaced lowercase text.

    Raises:
        TypeError: If `text` is not a string.

    Example:
        >>> normalize_hebrew("  שָׁלוֹם! ")
        'שלום'
    """
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    value = strip_niqqud(text).replace("־", "-")
    value = unicodedata.normalize("NFKC", value).lower()
    # Keep Hebrew, Latin letters, digits, apostrophes, hyphens, and spaces.
    value = re.sub(r"[^\u0590-\u05FFA-Za-z0-9'\-\s]", " ", value)
    return MULTISPACE_RE.sub(" ", value).strip()


def contains_hebrew(text: str) -> bool:
    """Return whether text contains at least one Hebrew token.

    Args:
        text: Text to inspect.

    Returns:
        `True` when Hebrew letters are present.

    Example:
        >>> contains_hebrew("hello שלום")
        True
    """
    return bool(HEBREW_TOKEN_RE.search(text))


def hebrew_tokens(text: str) -> list[str]:
    """Extract display-preserving Hebrew tokens.

    Args:
        text: Mixed-language text.

    Returns:
        Hebrew tokens in source order.

    Example:
        >>> hebrew_tokens("Say שלום, בבקשה")
        ['שלום', 'בבקשה']
    """
    return HEBREW_TOKEN_RE.findall(text)


def tokenize_for_comparison(text: str) -> list[str]:
    """Tokenize normalized text for educational matching.

    Args:
        text: Source text.

    Returns:
        Non-empty normalized tokens.

    Example:
        >>> tokenize_for_comparison("אני אטפל בזה")
        ['אני', 'אטפל', 'בזה']
    """
    return [token for token in normalize_hebrew(text).split(" ") if token]


def redact_sensitive_text(text: str) -> tuple[str, list[str]]:
    """Redact common sensitive patterns before optional cloud processing.

    Args:
        text: User-approved source text.

    Returns:
        A tuple of redacted text and applied redaction labels.

    Example:
        >>> redact_sensitive_text("Email me at a@example.com")[0]
        'Email me at [EMAIL]'
    """
    redactions: list[str] = []
    value = text
    patterns = (
        (TOKEN_URL_RE, "[SECRET_URL]", "secret_url"),
        (EMAIL_RE, "[EMAIL]", "email"),
        (PHONE_RE, "[PHONE]", "phone"),
        (LONG_NUMBER_RE, "[IDENTIFIER]", "long_identifier"),
    )
    for pattern, replacement, label in patterns:
        value, count = pattern.subn(replacement, value)
        if count:
            redactions.append(label)
    return value, redactions


def similarity_ratio(expected: str, actual: str) -> float:
    """Compute niqqud-insensitive sequence similarity.

    Args:
        expected: Target text.
        actual: Learner or transcript text.

    Returns:
        Similarity from 0 to 1.

    Example:
        >>> similarity_ratio("שָׁלוֹם", "שלום")
        1.0
    """
    left = normalize_hebrew(expected)
    right = normalize_hebrew(actual)
    if not left and not right:
        return 1.0
    if not left or not right:
        return 0.0
    return SequenceMatcher(None, left, right).ratio()


def pronunciation_breakdown(target: str, transcript: str) -> PronunciationBreakdown:
    """Score a speaking attempt using transparent transcription similarity.

    Args:
        target: Expected Hebrew phrase.
        transcript: Speech-to-text result.

    Returns:
        Score components and missing/extra words.

    Raises:
        ValueError: If the target is empty after normalization.

    Example:
        >>> pronunciation_breakdown("אני מוכן", "אני מוכן").score
        100
    """
    target_tokens = tokenize_for_comparison(target)
    transcript_tokens = tokenize_for_comparison(transcript)
    if not target_tokens:
        raise ValueError("target must contain comparable text")

    target_set = set(target_tokens)
    transcript_set = set(transcript_tokens)
    coverage = len(target_set & transcript_set) / len(target_set)
    sequence = similarity_ratio(target, transcript)
    target_length = max(len(normalize_hebrew(target)), 1)
    actual_length = len(normalize_hebrew(transcript))
    length_balance = max(0.0, 1.0 - abs(target_length - actual_length) / target_length)

    score = round((sequence * 0.55 + coverage * 0.30 + length_balance * 0.15) * 100)
    return PronunciationBreakdown(
        score=max(0, min(100, score)),
        sequence_similarity=round(sequence, 4),
        word_coverage=round(coverage, 4),
        length_balance=round(length_balance, 4),
        missing_words=tuple(token for token in target_tokens if token not in transcript_set),
        extra_words=tuple(token for token in transcript_tokens if token not in target_set),
    )
