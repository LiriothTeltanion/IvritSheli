import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  openWorkspace,
  type LearnerMode,
  type TestLocale,
} from './fixtures';

function desktopOnly(projectName: string): void {
  test.skip(projectName !== 'desktop-1440', 'This behavior is viewport-independent and runs once on desktop.');
}

function mobileOnly(projectName: string): void {
  test.skip(projectName !== 'mobile-390', 'This flow is the focused phone regression.');
}

test.describe('responsive learning workspace', () => {
  test('fits the configured viewport without document-level horizontal overflow', async ({ page }) => {
    await openWorkspace(page);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('language, direction, and learner depth', () => {
  for (const locale of ['en', 'es', 'he'] as TestLocale[]) {
    test(`${locale} applies the correct document language and direction`, async ({ page }, testInfo) => {
      desktopOnly(testInfo.project.name);
      await openWorkspace(page, { locale });

      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });
  }

  for (const mode of ['guided', 'explorer', 'experienced'] as LearnerMode[]) {
    test(`${mode} exposes its intended navigation depth`, async ({ page }, testInfo) => {
      desktopOnly(testInfo.project.name);
      await openWorkspace(page, { mode });

      await expect(page.locator('.app-shell')).toHaveAttribute('data-learner-mode', mode);
      const primaryNavigation = page.locator('.side-nav');
      const expectedCount = mode === 'guided' ? 3 : mode === 'explorer' ? 5 : 6;
      await expect(primaryNavigation.locator(':scope > button')).toHaveCount(expectedCount);
      if (mode === 'guided') {
        await expect(primaryNavigation).toContainText('Today');
        await expect(primaryNavigation).toContainText('Words');
        await expect(primaryNavigation).toContainText('Help');
      }
    });
  }
});

test.describe('integrated Hebrew Alphabet Studio', () => {
  for (const mode of ['guided', 'explorer', 'experienced'] as LearnerMode[]) {
    test(`${mode} can open all 22 letters and five positional final forms`, async ({ page }, testInfo) => {
      desktopOnly(testInfo.project.name);
      await openWorkspace(page, { mode });

      await page.getByRole('button', {
        name: mode === 'guided' ? /^Words(?:\s+\d+)?$/ : /^Learn(?:\s+\d+)?$/,
      }).click();
      await page.getByRole('button', { name: 'Alphabet', exact: true }).click();

      await expect(page.getByRole('heading', { name: /Learn every shape through sound/i })).toBeVisible();
      await expect(page.locator('.alphabet-grid__letter')).toHaveCount(27);
      await expect(page.getByText(/22 letters and 5 positional final forms/i)).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      const foundations = page.locator('.alphabet-foundations');
      if (mode === 'guided') {
        await expect(foundations).not.toHaveAttribute('open', '');
      } else {
        await expect(foundations).toHaveAttribute('open', '');
      }

      const activity = page.getByRole('group', { name: 'Which letter is Alef?' });
      await expect(activity).not.toContainText('Alef');
      await activity.getByRole('button', { name: 'Option 1: א' }).click();
      await expect(page.getByText('Correct. This practice was saved.')).toBeVisible();
    });
  }

  test('Today routes directly to the reviewed recommended letter', async ({ page }, testInfo) => {
    mobileOnly(testInfo.project.name);
    await openWorkspace(page, { mode: 'guided' });

    await expect(page.getByRole('heading', { name: /Continue with/ })).toContainText('אָלֶף');
    const alphabetCta = page.getByRole('button', { name: 'Open Alphabet Studio' });
    await alphabetCta.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /Learn every shape through sound/i })).toBeVisible();
    await expect(page.locator('.alphabet-letter__glyph')).toContainText('א');
  });

  test('reflows in Hebrew RTL with reduced motion and 200% text scaling', async ({ page }, testInfo) => {
    mobileOnly(testInfo.project.name);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openWorkspace(page, { mode: 'guided', locale: 'he' });

    await page.locator('.bottom-nav > button').nth(1).click();
    await page.getByRole('button', { name: 'אלפבית', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.alphabet-studio')).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    const transitionDuration = await page.locator('.alphabet-grid__letter').first().evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );
    expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);
  });

  test('has no serious or critical axe violations in the dark Experienced studio', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await openWorkspace(page, { mode: 'experienced', theme: 'dark' });

    await page.getByRole('button', { name: /^Learn(?:\s+\d+)?$/ }).click();
    await page.getByRole('button', { name: 'Alphabet', exact: true }).click();
    const results = await new AxeBuilder({ page })
      .include('.alphabet-studio')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blockingViolations = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });
});

test.describe('personal display preferences', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} theme persists on the document root`, async ({ page }, testInfo) => {
      desktopOnly(testInfo.project.name);
      await openWorkspace(page, { theme });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    });
  }

  test('reduced motion disables ambient animation', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openWorkspace(page);

    const animationName = await page.locator('.ambient--one').evaluate(
      (element) => getComputedStyle(element).animationName,
    );
    expect(animationName).toBe('none');
  });

  test('reflows at the CSS viewport equivalent of 200% browser zoom', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await openWorkspace(page);
    // Browser zoom from 100% to 200% halves the available CSS-pixel viewport.
    // A 1440px desktop therefore needs to reflow into a 720px CSS viewport.
    await page.setViewportSize({ width: 720, height: 1000 });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue my lesson/i })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));
  });
});

test.describe('keyboard and accessibility', () => {
  test('profile dialog moves focus in and restores it on Escape', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await openWorkspace(page);
    const trigger = page.getByRole('button', { name: /open profile menu/i });

    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: /profile menu/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /available/i })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('mobile learner can cancel or finish a visit without signing out', async ({ page }, testInfo) => {
    mobileOnly(testInfo.project.name);
    await openWorkspace(page);
    const trigger = page.getByRole('button', { name: /open profile menu/i });

    await trigger.click();
    const finishAction = page.getByRole('button', { name: /finish for today/i });
    await finishAction.click();
    const confirmation = page.getByRole('alertdialog', { name: /finish for today/i });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirmation).toBeHidden();
    await expect(finishAction).toBeFocused();

    await finishAction.click();
    await confirmation.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByRole('heading', { name: /good work today/i })).toBeVisible();
    await expect(page.getByText(/close this browser tab/i)).toBeVisible();
    await page.getByRole('button', { name: /keep learning/i }).click();
    await expect(page.getByRole('main')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`has no serious or critical axe violations in the ${theme} workspace`, async ({ page }) => {
      await openWorkspace(page, { theme });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blockingViolations = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );

      expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    });
  }
});

test.describe('listening and privacy fallbacks', () => {
  test('microphone denial keeps manual Hebrew input available', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => Promise.reject(
            new DOMException('Permission denied for E2E', 'NotAllowedError'),
          ),
        },
      });
    });
    await openWorkspace(page, { mode: 'experienced' });

    await page.getByRole('button', { name: /^Learn(?:\s+\d+)?$/ }).click();
    await page.getByRole('button', { name: 'Pronunciation', exact: true }).click();
    await expect(page.getByText('Ready for a word or short phrase.')).toBeVisible();
    await page.getByRole('button', { name: 'Record', exact: true }).click();

    await expect(page.getByText(/Microphone permission was denied/)).toBeVisible();
    const manualMode = page.getByRole('radio', { name: 'Type manually' });
    await manualMode.focus();
    await page.keyboard.press('Space');
    await expect(manualMode).toBeChecked();
    const transcript = page.getByRole('textbox', { name: 'Transcript', exact: true });
    await transcript.fill('שלום אמא');
    await expect(transcript).toHaveValue('שלום אמא');
    await expect(page.getByRole('button', { name: 'Understand transcript' })).toBeEnabled();
  });
});

test.describe('visual recognition expansion', () => {
  /*
   * Both cases below begin by waiting for the Visual QA catalogue to mount, and
   * that page inlines 720 hand-authored SVGs. Playwright's 5s default is sized
   * for ordinary interface elements, not for this. Measured on the reference
   * Windows machine: 54s with the machine quiet, 1m18s under memory pressure at
   * one worker, and the default blown outright once three viewport projects
   * render the page at the same time.
   *
   * Only the mount wait gets this budget. Every assertion after it keeps the
   * ordinary default, because a slow answer there would be a real defect.
   */
  const MOUNT_BUDGET_MS = 60_000;
  const FULL_CATALOG_CASE_BUDGET_MS = 180_000;

  test('renders all 240 exact scenes across the configured viewport and display preferences', async ({ page }, testInfo) => {
    /*
     * This case paints the whole catalogue: 240 scenes at three sizes, 720
     * hand-authored SVGs, then switches theme and language, re-lays everything
     * out at 200%, and runs axe across the resulting DOM. Keep the 60-second
     * mount assertions strict, but give the complete case enough time for axe
     * on a loaded Windows reference machine without raising the global budget.
     */
    test.setTimeout(FULL_CATALOG_CASE_BUDGET_MS);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?visualQa=1&lang=en');

    await expect(page.getByText('240/240 exact scenes loaded')).toBeVisible({ timeout: MOUNT_BUDGET_MS });
    await expect(page.locator('.visual-qa__catalog > article')).toHaveCount(240, { timeout: MOUNT_BUDGET_MS });
    await expect(page.locator('.visual-qa__catalog [data-size="thumbnail"]')).toHaveCount(240, { timeout: MOUNT_BUDGET_MS });
    await expect(page.locator('.visual-qa__catalog [data-size="card"]')).toHaveCount(240, { timeout: MOUNT_BUDGET_MS });
    await expect(page.locator('.visual-qa__catalog [data-size="hero"]')).toHaveCount(240, { timeout: MOUNT_BUDGET_MS });
    await expect(page.locator('[data-visual-id="family.mother"]').first()).toBeVisible({ timeout: MOUNT_BUDGET_MS });

    const hourThumbnail = page.locator('article[data-visual-key="time.hour"] [data-size="thumbnail"]');
    const minuteThumbnail = page.locator('article[data-visual-key="time.minute"] [data-size="thumbnail"]');
    await expect(hourThumbnail.locator('[data-scene-cue="hour-regulator-case"]')).toBeVisible();
    await expect(hourThumbnail.locator('[data-scene-cue="slow-pendulum"]')).toBeVisible();
    await expect(minuteThumbnail.locator('[data-scene-cue="stopwatch-crown"]')).toBeVisible();
    const minuteTickState = await minuteThumbnail
      .locator('[data-scene-cue="sixty-second-ticks"] line')
      .evaluateAll((ticks) => ({
        count: ticks.length,
        allDisplayed: ticks.every((tick) => window.getComputedStyle(tick).display !== 'none'),
        allPainted: ticks.every((tick) => {
          const style = window.getComputedStyle(tick);
          return style.stroke !== 'none' && Number.parseFloat(style.strokeWidth) > 0;
        }),
      }));
    expect(minuteTickState).toEqual({ count: 60, allDisplayed: true, allPainted: true });
    await expect(minuteThumbnail.locator('[data-scene-cue="sixty-count-badge"]')).toBeVisible();

    const animationNames = await page.locator(
      '.semantic-art__motion, .semantic-art__motion-part, .semantic-art__sun-rays, .semantic-art__arrow',
    ).evaluateAll((elements) => elements.slice(0, 12).map(
      (element) => window.getComputedStyle(element).animationName,
    ));
    expect(animationNames.length).toBeGreaterThan(0);
    expect(animationNames.every((name) => name === 'none')).toBe(true);

    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'HE', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(hourThumbnail.locator('[data-scene-cue="slow-pendulum"]')).toBeVisible();
    await expect(minuteThumbnail.locator('[data-scene-cue="sixty-count-badge"]')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomedDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(zoomedDimensions.scrollWidth).toBeLessThanOrEqual(zoomedDimensions.clientWidth + 1);

    if (testInfo.project.name === 'desktop-1440') {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blockingViolations = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    }
  });

  test('reveals four meanings only after the five-second recognition exposure', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto('/?visualQa=1&lang=en');
    await expect(page.getByText('240/240 exact scenes loaded')).toBeVisible({ timeout: MOUNT_BUDGET_MS });

    await page.getByRole('button', { name: 'Start recognition check' }).click();
    await expect(page.getByText('Observe the scene… 5 seconds')).toBeVisible();
    await expect(page.locator('.visual-qa__choices')).toHaveCount(0);
    await page.waitForTimeout(5100);
    await expect(page.locator('.visual-qa__choices button')).toHaveCount(4);
  });
});
