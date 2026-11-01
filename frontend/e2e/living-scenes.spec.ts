import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("living illustration pilot on the served application", () => {
  test("all six scenes replay through reachable controls and settle without perpetual motion", async ({
    page,
  }) => {
    await page.goto("/?visualPilot=1&lang=es");
    await expect(page.locator("[data-pilot-key]")).toHaveCount(6);
    const buttons = page.getByRole("button", { name: "Repetir la escena" });
    await expect(buttons).toHaveCount(6);
    for (const button of await buttons.all()) {
      await button.scrollIntoViewIfNeeded();
      // A click must pass real hit testing, including on the 390px project.
      await button.click();
      const article = button.locator("xpath=ancestor::article");
      await expect(article.locator('[data-living-play="true"]')).toHaveCount(1);
      const animations = await article.evaluate((node) =>
        node.getAnimations({ subtree: true }).map((animation) => ({
          iterations: animation.effect?.getTiming().iterations,
          duration: animation.effect?.getTiming().duration,
        })),
      );
      expect(animations.length).toBeGreaterThan(0);
      expect(animations.every((animation) => animation.iterations === 1)).toBe(
        true,
      );
      await article.evaluate(async (node) => {
        await Promise.all(
          node
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => undefined)),
        );
      });
    }
    expect(
      await page
        .locator("main")
        .evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
    ).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("theme, before comparison and Hebrew RTL remain usable without overflow", async ({
    page,
  }) => {
    await page.goto("/?visualPilot=1&lang=es");
    await expect(page.locator("[data-pilot-key]")).toHaveCount(6);
    await page.getByRole("radio", { name: "Oscuro" }).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page
      .getByRole("button", { name: "Comparar con el original" })
      .click();
    await expect(page.locator('img[src*="/before/dark-"]')).toHaveCount(6);
    await page.getByRole("combobox").selectOption("he");
    await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("button", { name: "הפעלת הסצנה מחדש" }),
    ).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("reduced motion is a complete still scene with no flattened positioning", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?visualPilot=1&lang=en");
    await expect(page.locator("[data-pilot-key]")).toHaveCount(6);
    await expect(
      page.getByText("Still illustration · reduced motion", { exact: true }),
    ).toHaveCount(6);
    await expect(
      page.getByRole("button", { name: "Replay the scene" }),
    ).toHaveCount(0);
    await page.locator('svg[data-visual-id="greetings.hello"]').hover();
    expect(
      await page
        .locator("main")
        .evaluate((node) => node.getAnimations({ subtree: true }).length),
    ).toBe(0);
    const people = await page
      .locator('[data-pilot-key="greetings.hello"] [data-character-system]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          transform: getComputedStyle(node).transform,
          box: node.getBoundingClientRect().toJSON() as {
            width: number;
            height: number;
          },
        })),
      );
    expect(people).toHaveLength(2);
    expect(
      people.every(
        (person) =>
          person.transform !== "none" &&
          person.box.width > 10 &&
          person.box.height > 30,
      ),
    ).toBe(true);
  });

  test("English, Spanish and Hebrew pass the scoped WCAG AA scan in both themes", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop-1440",
      "One complete locale/theme matrix; other projects cover layout and interaction.",
    );
    for (const locale of ["en", "es", "he"]) {
      for (const theme of ["light", "dark"]) {
        await page.goto(`/?visualPilot=1&lang=${locale}&theme=${theme}`);
        await expect(page.locator("svg[data-living-scene]")).toHaveCount(6);
        const result = await new AxeBuilder({ page })
          .include(".scene-studio")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(result.violations).toEqual([]);
      }
    }
  });
});
