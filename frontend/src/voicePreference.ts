// Module: shared Hebrew voice preference
// Purpose: Keep one device-persisted synthetic style across every browser pronunciation path.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import type { VoiceStyle } from './types';

export const VOICE_STYLE_STORAGE_KEY = 'ivrit-sheli:voice-style';
export const VOICE_SPEED_STORAGE_KEY = 'ivrit-sheli:voice-speed';
export type VoiceSpeed = 'slow' | 'normal';

export interface HebrewPronunciationInput {
  displayText: string;
  speechText?: string;
  transliteration?: string | undefined;
}

export interface ResolvedHebrewPronunciation {
  displayText: string;
  speechText: string;
  transliteration?: string | undefined;
  audioAsset?: string | undefined;
  rateMultiplier: number;
  overrideApplied: boolean;
}

interface PronunciationOverride {
  speechText: string;
  audioAsset?: string | undefined;
  rateMultiplier?: number;
}

const HEBREW_DIACRITICS = /[\u0591-\u05BD\u05BF-\u05C7]/gu;
const INVISIBLE_DIRECTIONAL_MARKS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/gu;
const LEARNER_SEPARATORS = /[·•|_/\\]+/gu;
const HTML_TAGS = /<[^>]*>/gu;

const PRONUNCIATION_OVERRIDES: Readonly<Record<string, PronunciationOverride>> = {
  בבקשה: {
    speechText: 'בבקשה',
    rateMultiplier: 1,
  },
};

export function prepareHebrewSpeechText(value: string): string {
  return value
    .normalize('NFC')
    .replace(HTML_TAGS, ' ')
    .replace(INVISIBLE_DIRECTIONAL_MARKS, '')
    .replace(LEARNER_SEPARATORS, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function pronunciationOverrideKey(value: string): string {
  return value.replace(HEBREW_DIACRITICS, '');
}

export function resolveHebrewPronunciation(
  input: string | HebrewPronunciationInput,
): ResolvedHebrewPronunciation {
  const request = typeof input === 'string' ? { displayText: input } : input;
  const preparedSpeechText = prepareHebrewSpeechText(request.speechText ?? request.displayText);
  const override = PRONUNCIATION_OVERRIDES[pronunciationOverrideKey(preparedSpeechText)];

  return {
    displayText: request.displayText,
    speechText: override?.speechText ?? preparedSpeechText,
    transliteration: request.transliteration,
    audioAsset: override?.audioAsset,
    rateMultiplier: override?.rateMultiplier ?? 1,
    overrideApplied: Boolean(override),
  };
}

export function readStoredVoiceStyle(): VoiceStyle {
  try {
    return window.localStorage.getItem(VOICE_STYLE_STORAGE_KEY) === 'masculine'
      ? 'masculine'
      : 'feminine';
  } catch {
    return 'feminine';
  }
}

export function persistVoiceStyle(style: VoiceStyle): void {
  try {
    window.localStorage.setItem(VOICE_STYLE_STORAGE_KEY, style);
  } catch {
    // Device storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function readStoredVoiceSpeed(): VoiceSpeed {
  try {
    return window.localStorage.getItem(VOICE_SPEED_STORAGE_KEY) === 'slow'
      ? 'slow'
      : 'normal';
  } catch {
    return 'normal';
  }
}

export function persistVoiceSpeed(speed: VoiceSpeed): void {
  try {
    window.localStorage.setItem(VOICE_SPEED_STORAGE_KEY, speed);
  } catch {
    // Device storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function selectBrowserVoice(
  voices: SpeechSynthesisVoice[],
  style: VoiceStyle,
): SpeechSynthesisVoice | undefined {
  const hebrewVoices = voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('he'))
    .sort((left, right) => (
      `${left.lang}|${left.name}|${left.voiceURI}`
        .localeCompare(`${right.lang}|${right.name}|${right.voiceURI}`)
    ));
  if (hebrewVoices.length === 0) return undefined;
  return style === 'masculine'
    ? hebrewVoices[hebrewVoices.length - 1]
    : hebrewVoices[0];
}

export function configureHebrewUtterance(
  utterance: SpeechSynthesisUtterance,
  voices: SpeechSynthesisVoice[],
  style = readStoredVoiceStyle(),
  speed = readStoredVoiceSpeed(),
): void {
  utterance.lang = 'he-IL';
  utterance.rate = speed === 'slow' ? 0.8 : 0.95;
  utterance.pitch = style === 'masculine' ? 0.9 : 1.04;
  const selectedVoice = selectBrowserVoice(voices, style);
  if (selectedVoice) utterance.voice = selectedVoice;
}

export function createHebrewUtterance(
  input: string | HebrewPronunciationInput,
  voices: SpeechSynthesisVoice[],
  style = readStoredVoiceStyle(),
  speed = readStoredVoiceSpeed(),
): SpeechSynthesisUtterance {
  const pronunciation = resolveHebrewPronunciation(input);
  const utterance = new SpeechSynthesisUtterance(pronunciation.speechText);
  configureHebrewUtterance(utterance, voices, style, speed);
  utterance.rate *= pronunciation.rateMultiplier;
  return utterance;
}
