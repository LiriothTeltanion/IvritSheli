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

  it('uses the recorded MIME type for uploads and preserves pronunciation context', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      transcript: 'שלום',
      provider: 'openai',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await api.transcribeAudio(new Blob(['audio'], { type: 'audio/mp4' }));
    const uploadInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const uploadedFile = (uploadInit.body as FormData).get('file') as File;
    expect(uploadedFile.name).toBe('hebrew-recording.mp4');

    await api.pronunciationScore('שלום', 'שלום', 7, 'openai');
    const scoreInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(scoreInit.body))).toEqual({
      target_text: 'שלום',
      transcript: 'שלום',
      item_id: 7,
      provider: 'openai',
    });
  });
});
