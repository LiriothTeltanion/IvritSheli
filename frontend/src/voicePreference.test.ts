import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createHebrewUtterance,
  prepareHebrewSpeechText,
  resolveHebrewPronunciation,
} from './voicePreference';

class UtteranceStub {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('Hebrew pronunciation configuration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps displayed niqqud separate from the continuous Hebrew sent to speech', () => {
    const pronunciation = resolveHebrewPronunciation({
      displayText: 'בְּבַקָּשָׁה',
      speechText: 'בבקשה',
      transliteration: 'bevakasha',
    });

    expect(pronunciation).toMatchObject({
      displayText: 'בְּבַקָּשָׁה',
      speechText: 'בבקשה',
      transliteration: 'bevakasha',
      overrideApplied: true,
    });
    expect(pronunciation.speechText).not.toMatch(/\s|[·•|_/\\]/u);
  });

  it.each([
    ['שָׁלוֹם', 'שָׁלוֹם'],
    ['תּוֹדָה', 'תּוֹדָה'],
    ['בְּבַקָּשָׁה', 'בְּבַקָּשָׁה'],
    ['\u200fבְּבַקָּשָׁה\u200e', 'בְּבַקָּשָׁה'],
    ['בב·קשה', 'בב קשה'],
  ])('prepares %s as %s without learner formatting', (displayText, speechText) => {
    expect(prepareHebrewSpeechText(displayText)).toBe(speechText);
  });

  it('preserves reviewed niqqud for ambiguous words without a targeted override', () => {
    expect(resolveHebrewPronunciation('סֵפֶר')).toMatchObject({
      speechText: 'סֵפֶר',
      overrideApplied: false,
    });
  });

  it('creates an he-IL utterance from clean Hebrew while preserving voice preferences', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);

    const utterance = createHebrewUtterance(
      { displayText: 'בְּבַקָּשָׁה', speechText: 'בבקשה' },
      [],
      'masculine',
      'normal',
    );

    expect(utterance).toMatchObject({
      text: 'בבקשה',
      lang: 'he-IL',
      rate: 0.95,
      pitch: 0.9,
    });
  });
});
