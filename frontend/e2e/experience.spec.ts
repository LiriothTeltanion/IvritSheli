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
