// Module: shared Hebrew voice preference
// Purpose: Keep one device-persisted synthetic style across every browser pronunciation path.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import type { VoiceStyle } from './types';

export const VOICE_STYLE_STORAGE_KEY = 'ivrit-sheli:voice-style';

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
): void {
  utterance.lang = 'he-IL';
  utterance.rate = 0.78;
  utterance.pitch = style === 'masculine' ? 0.82 : 1.08;
  const selectedVoice = selectBrowserVoice(voices, style);
  if (selectedVoice) utterance.voice = selectedVoice;
}
