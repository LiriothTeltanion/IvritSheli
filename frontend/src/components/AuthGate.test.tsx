import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  HEBREW_BASE_LETTERS,
  HEBREW_FINAL_FORMS,
  HEBREW_LETTER_FORM_COUNT,
  OFFLINE_STARTER_ENTRY_COUNT,
} from '../api';
import { I18nProvider } from '../i18n';
import { AVATAR_PRESETS } from '../profileAvatarPresets';
import { CANDIDATE_DATE, CANDIDATE_VERSION } from '../release';
import { AuthGate } from './AuthGate';

describe('AuthGate beginner preview', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
  });

  /* Renamed 2026-08-24. The old name -- "teaches three useful words before
     presenting account, local, or demo choices" -- was contradicted by lines
     below it, which find the Google link and the demo button while the lesson
     is still on screen. Both live outside the showAccessChoices branch and are
     always visible; the lesson gates only the local-companion row. The test is
     good, the claim was not. */
  it('offers the lesson alongside the account, local and demo choices, and creates nothing', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
            providers={['google']}
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Your first three Hebrew words' })).toBeInTheDocument();
    expect(screen.getByText('שָׁלוֹם')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore read-only demo/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'hello · peace' }));
    await user.click(screen.getByRole('button', { name: /Next word/i }));
    await user.click(screen.getByRole('button', { name: 'thank you' }));
    await user.click(screen.getByRole('button', { name: /Next word/i }));
    await user.click(screen.getByRole('button', { name: 'please · you are welcome' }));
    await user.click(screen.getByRole('button', { name: 'Finish the three-word lesson' }));

    const preview = screen.getByRole('heading', { name: 'You learned your first three words' }).closest('section');
    expect(preview).not.toBeNull();
    /* Renamed 2026-08-24: this link carried the identical label to the one
       that opens her working local workspace. It does something quite
       different -- a developer README, in a new tab -- so it now says so, and
       says that it leaves the app. */
    const instructions = screen.getByRole('link', { name: /How to set up local mode on this computer/i });
    expect(instructions).toHaveAttribute('href', expect.stringContaining('#easiest-windows-start-'));
    expect(instructions).toHaveAttribute('target', '_blank');
    expect(instructions).toHaveTextContent(/opens in a new tab/i);
    expect(screen.getByRole('button', { name: /Explore read-only demo/i })).toBeInTheDocument();
    expect(screen.getByText(/No account, saved progress, XP, or score was created/i)).toBeInTheDocument();
  });

  /* Renamed 2026-08-24. Skipping does not cause the choices to appear -- they
     were never hidden. What the skip actually does is confirm nothing was
     saved. "Returning learners" was unsupported too: no savedAccounts prop is
     passed here, so no returning-learner control renders. That case is covered
     by its own test below. */
  it('confirms nothing was saved when the lesson is skipped, and starts the demo', async () => {
    const onDemo = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={['google']}
          onDemo={onDemo}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.getByText('Lesson skipped. Nothing was saved, and you can return whenever you want.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /How to set up local mode on this computer/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explore read-only demo/i }));
    expect(onDemo).toHaveBeenCalledOnce();

    /* Changed 2026-08-24, deliberately, and worth stating plainly. This used to
       assert localStorage was completely empty. One flag is written now --
       that the intro lesson has been seen -- so a learner arriving by the
       local route is not handed the same three words a second time.

       The screen's promise is "No account, saved progress, XP, or score was
       created", and that still holds exactly: the flag is a boolean, carries
       no identity, and belongs to this browser. Asserting the contents rather
       than the count keeps the promise checkable instead of merely counted. */
    expect(localStorage).toHaveLength(1);
    expect(localStorage.getItem('ivrit-sheli:intro-lesson-seen')).toBe('true');
  });

  it('keeps the region she chose instead of moving on without her', async () => {
    vi.useFakeTimers();
    try {
      render(
        <I18nProvider>
          <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
        </I18nProvider>,
      );

      const jerusalem = screen.getByRole('button', { name: 'Jerusalem' });
      act(() => { jerusalem.click(); });
      expect(jerusalem).toHaveAttribute('aria-pressed', 'true');

      /* The carousel used to write the same state as the pills, so eight
         seconds later her choice was gone and the highlight kept wandering.
         Three full intervals is well past the point the old code moved on. */
      act(() => { vi.advanceTimersByTime(8000 * 3); });

      expect(screen.getByRole('button', { name: 'Jerusalem' })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rotates the landscape on its own until she expresses a preference', async () => {
    vi.useFakeTimers();
    try {
      render(
        <I18nProvider>
          <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
        </I18nProvider>,
      );

      const pressedNow = (): string | null | undefined => screen
        .getAllByRole('button', { pressed: true })
        .find((button) => button.className.includes('auth-region-pill'))
        ?.textContent;

      const before = pressedNow();
      act(() => { vi.advanceTimersByTime(8000); });
      expect(pressedNow()).not.toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells a returning learner what tapping her own name will actually do', () => {
    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={['google']}
          onDemo={vi.fn()}
          onRetry={vi.fn()}
          savedAccounts={[{ id: 'u1', displayName: 'Ana', avatarPresetId: 'preset-oasis' }]}
        />
      </I18nProvider>,
    );

    /* The strip cannot sign her straight in: savedAccounts.ts stores no email
       by design, so there is nothing to hand Google. The sentence explaining
       that already existed in all three locales and was never rendered. */
    expect(screen.getByRole('button', { name: 'Continue as Ana' })).toBeInTheDocument();
    expect(screen.getByText(/Choose Google to continue with that learner/i)).toBeInTheDocument();
  });

  it('fetches one landscape photograph at first paint, not all six', () => {
    /* The six region .webp files total 1.21 MB. Five of them sit at opacity 0,
       so mounting them all spent a slow connection on pictures nobody sees.
       main.tsx withholds a 58 kB chunk from this same screen for that reason. */
    const { container } = render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(container.querySelectorAll('.auth-bg-img')).toHaveLength(1);
  });

  it('brings in the next photograph before the carousel needs it', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <I18nProvider>
          <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
        </I18nProvider>,
      );

      // Queued for after the first screen settles, seven seconds before the
      // 8s rotation reaches it.
      act(() => { vi.advanceTimersByTime(1500); });
      expect(container.querySelectorAll('.auth-bg-img')).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets her stop the voice she started', async () => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
    });
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string;
      lang = '';
      rate = 1;
      onstart: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(text: string) { this.text = text; }
    });

    try {
      const user = userEvent.setup();
      render(
        <I18nProvider>
          <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
        </I18nProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Hear this word' }));
      expect(speak).toHaveBeenCalledOnce();

      /* Before this, every press cancelled and restarted: a learner who set it
         off by accident had no way to make the device stop talking. */
      const stop = screen.getByRole('button', { name: 'Stop' });
      await user.click(stop);
      expect(cancel).toHaveBeenCalled();
      expect(speak).toHaveBeenCalledOnce();
      expect(screen.getByRole('button', { name: 'Hear this word' })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('names the region switcher in the learner\'s own language', () => {
    window.history.replaceState({}, '', '/?lang=es');
    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByLabelText('Regiones del Atlas Vivo de Israel')).toBeInTheDocument();
  });

  it('links directly to the configured writable companion without inventing OAuth providers', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={[]}
          localCompanionUrl="http://127.0.0.1:8001"
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    const localLink = screen.getByRole('link', { name: /Use local mode on this computer/i });
    expect(localLink).toHaveAttribute('href', 'http://127.0.0.1:8001');
    expect(localLink).not.toHaveAttribute('target');
    expect(screen.getByText('Opens your writable private workspace directly on this computer.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with GitHub/i })).not.toBeInTheDocument();
  });

  it('hides Google once the session resolves with no provider configured', () => {
    // The primary action used to render whenever nothing was configured, so a
    // backend without Google credentials still showed the big button and a
    // learner pressing it reached an endpoint that cannot work.
    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={[]} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.queryByRole('link', { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo/i })).toBeInTheDocument();

    /* Added 2026-08-24. Hiding a button that cannot work was right; leaving
       nothing in its place was not. A learner met a screen whose obvious way
       in had simply vanished, with no word about why, which reads as breakage
       rather than as configuration. */
    expect(screen.getByText(/Sign-in is not set up on this server/i)).toBeInTheDocument();
    expect(screen.getByText(/You can still explore the demonstration/i)).toBeInTheDocument();
  });

  it('says nothing about sign-in when the local workspace is the way in', () => {
    // A machine running the local companion has a perfectly good route, so the
    // notice would be alarming and wrong.
    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={[]}
          localCompanionUrl="http://127.0.0.1:8001"
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.queryByText(/Sign-in is not set up on this server/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Use local mode on this computer/i })).toBeInTheDocument();
  });

  it('states the catalogue size and the avatar count from the data itself', async () => {
    // All three of these were written by hand — `.slice(0, 4)`, `+11` and
    // `15 Avatars` — coupled to one array with nothing keeping them honest.
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    // The catalogue size sits in the always-visible hero.
    expect(screen.getByText(String(OFFLINE_STARTER_ENTRY_COUNT) + '+')).toBeInTheDocument();

    // The community strip still waits for the lesson to resolve.
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.getByText(String(AVATAR_PRESETS.length) + ' avatars')).toBeInTheDocument();
    expect(screen.getByText('+' + String(AVATAR_PRESETS.length - 4))).toBeInTheDocument();
  });

  it('shows Google optimistically while the session is still resolving', () => {
    // Not a flash of an empty screen: until the providers are known, offering
    // the usual way in is better than offering nothing.
    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={[]} authChecking onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('really disables the Google link while a sign-in is in flight', () => {
    // An <a> cannot carry :disabled. The old code set a class with no matching
    // CSS rule, so the link looked identical and still navigated.
    render(
      <I18nProvider>
        <AuthGate busy error="" providers={['google']} googleBusy onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    const link = screen.getByRole('link', { name: /Continue with Google/i });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link.className).toContain('is-disabled');
  });

  it('shows a post-deletion local cleanup warning separately from authentication errors', () => {
    const { container } = render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          notice="Your account was deleted, but local recordings remain on this device."
          providers={['google']}
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Your account was deleted, but local recordings remain on this device.')
        .closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.querySelector('.auth-visual__journey-art')).toHaveAttribute(
      'src',
      '/assets/illustrations/israel-living-atlas-field-notes.webp',
    );
  });

  it('starts sign-in the same way from the primary button as from a saved learner', async () => {
    /* 2026-08-25: the screen had two ways to begin one sign-in. The saved
       pills asked the server for an authorize URL carrying the current path
       with any stale `error` parameters removed; the primary button took its
       raw href instead, because the JS path was gated on a prop App.tsx never
       passes. A learner who arrived on `/?error=access_denied`, read the
       message and pressed the big button was returned to the same URL with
       the same error still in it. Guard the class of fault: whichever control
       she uses, the request is the same one and the error is gone. */
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?lang=en&error=access_denied&error_code=401');
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign, search: window.location.search },
    });
    const startGoogle = vi
      .spyOn(api, 'startGoogle')
      .mockResolvedValue({ authorize_url: 'https://accounts.example/authorize' });

    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('link', { name: /Continue with Google/i }));

    expect(startGoogle).toHaveBeenCalledTimes(1);
    const nextPath = String(startGoogle.mock.calls[0]?.[0] ?? '');
    expect(nextPath).toContain('lang=en');
    expect(nextPath).not.toContain('error');
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('https://accounts.example/authorize'));
  });

  it('states only figures it can derive, and no claim the cloud path would break', async () => {
    /* `27` was a literal beside a catalogue that already knew it, and `100%`
       sat over "Private & Local" on the screen whose primary button hands the
       session to Google and stores progress in Supabase from that moment. */
    render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText(String(HEBREW_LETTER_FORM_COUNT))).toBeInTheDocument();
    expect(HEBREW_LETTER_FORM_COUNT).toBe(HEBREW_BASE_LETTERS + HEBREW_FINAL_FORMS);
    expect(screen.getByText('Third-party trackers')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText(/Private & Local/i)).not.toBeInTheDocument();
  });

  it('names the build once, in her language, and never states a date it cannot keep true', async () => {
    /* Two English badges said the same thing on a trilingual front door, and
       the longer one carried a hand-written date three days behind the build
       it labelled. */
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <AuthGate busy={false} error="" providers={['google']} onDemo={vi.fn()} onRetry={vi.fn()} />
      </I18nProvider>,
    );

    expect(container.querySelectorAll('.auth-candidate-badge')).toHaveLength(1);
    expect(container.querySelector('.auth-version')).toBeNull();
    /* Scoped to the header on purpose. The same date appears further down in
       the version history, where a changelog entry naturally carries its own
       date and stays true; what must not reappear is a build label in the
       masthead that a human has to remember to move. */
    const header = container.querySelector('.auth-header');
    expect(header?.textContent ?? '').not.toContain(CANDIDATE_DATE);
    expect(screen.getByText(/Private candidate/i)).toBeInTheDocument();

    /* Switch the way she would, with the control on the screen. */
    await user.click(screen.getByRole('button', { name: 'ES' }));
    expect(screen.getByText(/Candidata privada/i)).toBeInTheDocument();
    expect(screen.getByText(CANDIDATE_VERSION)).toBeInTheDocument();
  });
});
