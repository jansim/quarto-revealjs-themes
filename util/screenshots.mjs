// Take screenshots of every rendered theme deck.
//
// Usage: node util/screenshots.mjs [theme ...]
//
// Expects the site to be rendered already (`quarto render`). For each
// _site/themes/<theme>.html it captures a fixed set of slides from the shared
// template into screenshots/<theme>/ (and mirrors them into _site/ so a single
// render + screenshot pass produces a complete site). A 2x2 overview of those
// slides is written to screenshots/<theme>.png.

import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const outDir = path.join(root, "screenshots");

// Slides to capture, by their id in template.qmd.
const SHOTS = {
  title: "title-slide",
  section: "computation",
  code: "code-runs-where-the-prose-lives",
  table: "palmer-penguins-at-a-glance",
};

const VIEWPORT = { width: 1280, height: 720 };

async function listThemes() {
  const requested = process.argv.slice(2);
  if (requested.length) return requested;
  const files = await readdir(path.join(siteDir, "themes"));
  return files.filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));
}

async function captureTheme(browser, theme) {
  const deck = path.join(siteDir, "themes", `${theme}.html`);
  if (!existsSync(deck)) throw new Error(`${deck} not found, run \`quarto render\` first`);

  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1.5 });
  await page.goto(pathToFileURL(deck).href);
  await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
  await page.evaluate(() =>
    window.Reveal.configure({ transition: "none", backgroundTransition: "none", controls: false, progress: false }),
  );
  await page.evaluate(() => document.fonts.ready);

  const themeOut = path.join(outDir, theme);
  await mkdir(themeOut, { recursive: true });

  const files = [];
  for (const [name, id] of Object.entries(SHOTS)) {
    const found = await page.evaluate((id) => {
      const slide = document.getElementById(id);
      if (!slide) return false;
      const { h, v } = window.Reveal.getIndices(slide);
      window.Reveal.slide(h, v, 0);
      return true;
    }, id);
    if (!found) {
      console.warn(`  ${theme}: no slide with id "${id}", skipping ${name}`);
      continue;
    }
    // let layout, fonts and backgrounds settle
    await page.waitForTimeout(300);
    const file = path.join(themeOut, `${name}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  await page.close();

  // 2x2 overview, handy for READMEs
  const overview = path.join(outDir, `${theme}.png`);
  const grid = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const imgs = (
    await Promise.all(files.map(async (f) => (await readFile(f)).toString("base64")))
  ).map((b64) => `<img src="data:image/png;base64,${b64}">`).join("");
  await grid.setContent(
    `<style>body{margin:0;background:#fff}div{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}
     img{width:100%;display:block;box-shadow:0 1px 4px rgba(0,0,0,.25)}</style><div>${imgs}</div>`,
  );
  await grid.waitForFunction(() => [...document.images].every((i) => i.complete));
  await grid.locator("div").screenshot({ path: overview });
  await grid.close();

  // mirror into the rendered site
  const siteOut = path.join(siteDir, "screenshots", theme);
  await mkdir(siteOut, { recursive: true });
  await Promise.all(files.map((f) => copyFile(f, path.join(siteOut, path.basename(f)))));
  await copyFile(overview, path.join(siteDir, "screenshots", `${theme}.png`));

  console.log(`  ${theme}: ${files.map((f) => path.basename(f)).join(", ")} + ${path.relative(root, overview)}`);
}

const themes = await listThemes();
console.log(`Capturing ${themes.length} theme(s)`);
// CHROMIUM_PATH lets you reuse an existing Chromium instead of `npx playwright install`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const theme of themes) await captureTheme(browser, theme);
} finally {
  await browser.close();
}
