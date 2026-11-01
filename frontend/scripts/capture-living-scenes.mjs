// Real-browser proof for the local six-scene pilot. Animation frames are
// sampled from the actual CSS timeline, never synthesized from static artwork.
// Usage: node scripts/capture-living-scenes.mjs <output-folder> [base-url]
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const output = path.resolve(
  process.argv[2] ?? "../output/playwright/living-scenes",
);
const base = new URL(process.argv[3] ?? "http://127.0.0.1:8000");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
  throw new Error("Use a local, private pilot runtime.");
const keys = [
  "food.bread",
  "food.water",
  "greetings.hello",
  "greetings.good_morning",
  "actions.write",
  "numbers.one",
];
await fs.mkdir(path.join(output, "frames"), { recursive: true });
const browser = await chromium.launch();
const assets = [];
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (const theme of ["light", "dark"]) {
    await page.goto(`${base.origin}/?visualPilot=1&lang=es&theme=${theme}`);
    await page.locator('svg[data-visual-id="numbers.one"]').waitFor();
    await page.mouse.move(0, 0);
    const name = `studio-desktop-${theme}-es.png`;
    await page.screenshot({ path: path.join(output, name), fullPage: true });
    assets.push(name);
    for (const key of keys) {
      const file = `after-${theme}-${key}.png`;
      await page
        .locator(`svg[data-visual-id="${key}"]`)
        .screenshot({ path: path.join(output, file) });
      assets.push(file);
    }
    await page
      .getByRole("button", { name: "Comparar con el original" })
      .click();
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()));
    });
    await page.screenshot({
      path: path.join(output, `studio-comparison-${theme}-es.png`),
      fullPage: true,
    });
    assets.push(`studio-comparison-${theme}-es.png`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base.origin}/?visualPilot=1&lang=he&theme=dark`);
  await page.locator('svg[data-visual-id="numbers.one"]').waitFor();
  await page.screenshot({
    path: path.join(output, "studio-phone-dark-he.png"),
    fullPage: true,
  });
  assets.push("studio-phone-dark-he.png");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base.origin}/?visualPilot=1&lang=es&theme=light`);
  await page
    .getByRole("button", { name: "Repetir la escena" })
    .last()
    .waitFor();
  // Start all six using the same visible controls already hit-tested by E2E.
  // Pausing them lets each export sample the identical point in the timeline.
  await page
    .getByRole("button", { name: "Repetir la escena" })
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page
    .locator("main")
    .evaluate((main) =>
      main
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.pause()),
    );
  for (let frame = 0; frame <= 18; frame += 1) {
    await page.locator("main").evaluate(
      (main, time) =>
        main.getAnimations({ subtree: true }).forEach((animation) => {
          animation.currentTime = time;
        }),
      frame * 100,
    );
    for (const key of keys) {
      await page
        .locator(`svg[data-visual-id="${key}"]`)
        .screenshot({
          path: path.join(
            output,
            "frames",
            `${String(frame).padStart(2, "0")}-${key}.png`,
          ),
          animations: "allow",
        });
    }
  }
  const version = await (
    await page.request.get(`${base.origin}/version`)
  ).json();
  const manifest = {
    created: new Date().toISOString(),
    version,
    source: "FastAPI served build; local original SVG artwork",
    frames: {
      count: 19,
      stepMs: 100,
      scenes: keys,
      method:
        "Paused live CSS animations sampled through Animation.currentTime.",
    },
    assets: await Promise.all(
      assets.map(async (file) => {
        const bytes = await fs.readFile(path.join(output, file));
        return {
          file,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      }),
    ),
    pageErrors: errors,
  };
  await fs.writeFile(
    path.join(output, "capture-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  if (errors.length) throw new Error(`Page errors: ${errors.join("; ")}`);
  console.log(
    JSON.stringify({
      output,
      assets: assets.length,
      animationFrames: 19 * keys.length,
      version,
      errors: errors.length,
    }),
  );
} finally {
  await browser.close();
}
