// Module: API session guard tests
// Purpose: Ensure the browser never attempts a persistent write from a seeded read-only session.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, configureApiSession } from './api';

describe('read-only API guard', () => {
  afterEach(() => {
    configureApiSession(null);
    document.cookie = 'ivrit_csrf=; Max-Age=0; path=/';
    vi.restoreAllMocks();
  });

  it('rejects a demo mutation before any network request is sent', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureApiSession({ read_only: true });

    const request = api.createItem({ hebrew_text: 'שלום' });
    await expect(request).rejects.toMatchObject({
      status: 403,
      code: 'demo_read_only',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the server-issued double-submit token on authenticated writes', async () => {
    document.cookie = 'ivrit_csrf=csrf-test-token; path=/';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, hebrew_text: 'שלום' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.createItem({ hebrew_text: 'שלום' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/items', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-test-token' }),
      method: 'POST',
    }));
  });

  it('preserves the server error code and request ID for a rejected CSRF write', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        code: 'csrf_validation_failed',
        message: 'The request origin or CSRF token could not be verified.',
        request_id: 'request-403',
      },
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createItem({ hebrew_text: 'שלום' })).rejects.toMatchObject({
      status: 403,
      code: 'csrf_validation_failed',
      requestId: 'request-403',
    });
  });

  it('sends an explicit confirmation for permanent account deletion', async () => {
    document.cookie = 'ivrit_csrf=csrf-delete-token; path=/';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      authenticated: false,
      demo: false,
      read_only: false,
      user: null,
      mode: 'cloud',
      capabilities: {},
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.deleteAccount();

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/account', expect.objectContaining({
      method: 'DELETE',
      credentials: 'include',
      body: JSON.stringify({ confirm: true }),
      headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-delete-token' }),
    }));
  });

  it('uses the recorded MIME type for uploads and preserves pronunciation context', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      transcript: 'שלום',
      provider: 'openai',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await api.transcribeAudio(
      new Blob(['audio'], { type: 'audio/mp4' }),
      'self_hosted',
      undefined,
      'שלום',
    );
    const uploadInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const uploadedFile = (uploadInit.body as FormData).get('file') as File;
    expect(uploadedFile.name).toBe('hebrew-recording.mp4');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/v1/audio/stt?mode=self_hosted&cloud_requested=false&language=he&target_text=%D7%A9%D7%9C%D7%95%D7%9D',
    );

    await api.pronunciationScore('שלום', 'שלום', 7, 'openai', 'signed-evidence');
    const scoreInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(scoreInit.body))).toEqual({
      target_text: 'שלום',
      transcript: 'שלום',
      item_id: 7,
      provider: 'openai',
      evidence_token: 'signed-evidence',
    });
  });

  it('sends only a voice style and a provenance-aware word analysis request', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await api.tts('שלום', true, 'masculine');
    const ttsInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(ttsInit.body))).toEqual({
      text: 'שלום',
      cloud_requested: true,
      voice_style: 'masculine',
      retain: false,
    });

    await api.analyzeSpokenWord('שלום', 'browser', false);
    const analysisInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(analysisInit.body))).toEqual({
      transcript: 'שלום',
      transcript_provider: 'browser',
      cloud_requested: false,
    });
  });

  it('addresses alphabet practice by stable letter key and sends only server-verifiable evidence', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await api.alphabet('alef');
    await api.submitAlphabetAttempt('alef', {
      activity_token: 'a'.repeat(64),
      idempotency_key: 'alphabet-attempt-1',
      answer_key: 'alef',
      response_ms: 850,
      hints_used: 0,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/alphabet?letter_key=alef',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/alphabet/alef/attempt',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          activity_token: 'a'.repeat(64),
          idempotency_key: 'alphabet-attempt-1',
          answer_key: 'alef',
          response_ms: 850,
          hints_used: 0,
        }),
      }),
    );
  });

  it('requests deterministic transcript understanding without a cloud flag', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      mode: 'phrase',
      tokens: [],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.analyzeTranscript('שלום עולם', 'self_hosted');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/audio/transcript-analysis', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        transcript: 'שלום עולם',
        transcript_provider: 'self_hosted',
      }),
    }));
  });

  it('allows non-mutating local word analysis in a read-only demo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    configureApiSession({ read_only: true });

    await api.analyzeSpokenWord('שלום', 'browser', false);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/audio/word-analysis', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('allows non-mutating local transcript understanding in a read-only demo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    configureApiSession({ read_only: true });

    await api.analyzeTranscript('שלום עולם', 'manual');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/audio/transcript-analysis',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends bounded registry page offsets beyond 500 items', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      total: 721,
      summary: { active: 721, mastered: 0, needs_review: 0 },
      offset: 540,
      limit: 60,
      has_more: true,
      next_offset: 600,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.registryItems({ limit: 60, offset: 540 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/registry?q=&status=all&due=all&sort=last_activity_desc&limit=60&offset=540',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('reports an explicit reconnect requirement when a persistent write cannot reach the server', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createItem({ hebrew_text: 'שלום' })).rejects.toMatchObject({
      status: 0,
      code: 'network_required',
      message: expect.stringMatching(/network connection is required/i),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports timeout as a stable timeout code for read requests', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Request timed out', 'TimeoutError'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.dictionarySearch('שלום')).rejects.toMatchObject({
      status: 408,
      code: 'timeout',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps learning-core phase, mastery, schedule, and XP decisions on the server', async () => {
    document.cookie = 'ivrit_csrf=csrf-learning-core; path=/';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      contract_version: '2.6',
      accepted: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await api.submitLearningCoreAttempt({
      item_id: 7,
      activity_token: 'a'.repeat(64),
      idempotency_key: 'attempt-12345678',
      is_correct: true,
      confidence: 4,
      response_ms: 1250,
      hints_used: 0,
      answer_text: 'hello',
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/learning-core/attempt', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-learning-core' }),
    }));
    expect(JSON.parse(String(init.body))).toEqual({
      item_id: 7,
      activity_token: 'a'.repeat(64),
      idempotency_key: 'attempt-12345678',
      is_correct: true,
      confidence: 4,
      response_ms: 1250,
      hints_used: 0,
      answer_text: 'hello',
    });
  });

  it('does not hide a server authentication error behind offline content', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        code: 'authentication_required',
        message: 'Sign in is required.',
      },
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.dictionarySearch('שלום')).rejects.toMatchObject({
      status: 401,
      code: 'authentication_required',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects cached dictionary content that does not match the reviewed 240-entry contract', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        contract_version: '2.8',
        content: 'reviewed_starter_dictionary',
        entry_count: 1,
        entries: [],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.dictionarySearch('שלום')).rejects.toThrow(/failed contract validation/i);
  });

  it('falls back to typed cached search, form lookup, and category browsing after network failures', async () => {
    const offlineEntry = {
      id: 1,
      word: 'שלום',
      normalized_word: 'שלום',
      display_niqqud: 'שָׁלוֹם',
      pos: 'interjection',
      romanization: 'shalom',
      root: 'שלם',
      binyan: null,
      gender: null,
      level: 'A0',
      category: 'greetings',
      visual: {
        key: 'greetings.hello',
        emoji: '👋',
        alt: { en: 'Friendly greeting', es: 'Saludo amable', he: 'ברכה ידידותית' },
      },
      etymology: null,
      source_name: 'Ivrit Sheli reviewed starter vocabulary',
      source_url: null,
      license_name: 'MIT application sample data',
      senses: [{
        id: 1,
        gloss_en: 'hello',
        gloss_es: 'hola',
        tags: [],
        topics: [],
        level: 'A0',
        category: 'greetings',
        visual_key: 'greetings.hello',
        visual_emoji: '👋',
        visual_alt_en: 'Friendly greeting',
        visual_alt_es: 'Saludo amable',
        visual_alt_he: 'ברכה ידידותית',
        provenance: 'Reviewed',
        reading_hints: [],
        visual: {
          key: 'greetings.hello',
          emoji: '👋',
          alt: { en: 'Friendly greeting', es: 'Saludo amable', he: 'ברכה ידידותית' },
        },
      }],
      forms: [{
        id: 101,
        form: 'שָׁלוֹם',
        romanization: 'shalom',
        tags: ['with-niqqud'],
      }],
      examples: [],
      sounds: [],
    };
    const fillerEntries = Array.from({ length: 239 }, (_, index) => {
      const id = index + 2;
      const word = `מילה${id}`;
      const visual = {
        key: `words.${id}`,
        emoji: '🔤',
        alt: { en: `Word ${id}`, es: `Palabra ${id}`, he: `מילה ${id}` },
      };
      return {
        ...offlineEntry,
        id,
        word,
        normalized_word: word,
        display_niqqud: word,
        romanization: `mila-${id}`,
        category: 'other',
        visual,
        senses: [{
          ...offlineEntry.senses[0],
          id,
          gloss_en: `word ${id}`,
          gloss_es: `palabra ${id}`,
          category: 'other',
          visual_key: visual.key,
          visual_alt_en: visual.alt.en,
          visual_alt_es: visual.alt.es,
          visual_alt_he: visual.alt.he,
          visual,
        }],
        forms: [],
      };
    });
    const entries = [offlineEntry, ...fillerEntries];
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        contract_version: '2.8',
        content: 'reviewed_starter_dictionary',
        entry_count: 240,
        entries,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockRejectedValueOnce(new TypeError('Network request failed'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.dictionarySearch('hola')).resolves.toEqual([offlineEntry]);
    await expect(api.dictionaryLookup('שָׁלוֹם')).resolves.toEqual([offlineEntry]);
    await expect(api.dictionaryBrowse(' GREETINGS ')).resolves.toEqual([offlineEntry]);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/content/starter-dictionary-v2.8.json');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
