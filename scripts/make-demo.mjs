// Generates demo/demo.gif: real catmd renders (same pipeline, same settings)
// composited into a terminal-styled window, animated as a typed command
// followed by the output. Terminal recorders (vhs/asciinema) can't capture
// kitty graphics, so the chrome is HTML — the diagram pixels are the real
// thing.
//
// Usage: node scripts/make-demo.mjs   (after npm install)

import { renderMermaid } from "@mermaid-js/mermaid-cli";
import gifenc from "gifenc";
const { GIFEncoder, applyPalette, quantize } = gifenc;
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import puppeteer from "puppeteer";

const ROOT = join(import.meta.dirname, "..");
const RENDER_SCALE = 4;
const FONT_PX = 14; // terminal font size in the mock
const WIDTH = 800;
const HEIGHT = 1000;
const DPR = 2;

const NO_MAX_WIDTH_TYPES = [
  "flowchart", "sequence", "class", "state", "er", "journey", "timeline",
  "mindmap", "gitGraph", "requirement", "quadrantChart", "xyChart", "pie", "gantt",
];
const mermaidConfig = { theme: "default" };
for (const t of NO_MAX_WIDTH_TYPES) mermaidConfig[t] = { useMaxWidth: false };

const escapeHtml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Minimal fence split for the demo doc (well-formed by construction). */
function segments(text) {
  const out = [];
  let buffer = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "```mermaid") {
      let j = i + 1;
      while (lines[j].trim() !== "```") j++;
      if (buffer.length) out.push({ kind: "text", text: buffer.join("\n") });
      buffer = [];
      out.push({ kind: "mermaid", body: lines.slice(i + 1, j).join("\n") });
      i = j;
    } else {
      buffer.push(lines[i]);
    }
  }
  if (buffer.length) out.push({ kind: "text", text: buffer.join("\n") });
  return out;
}

const doc = await readFile(join(ROOT, "demo/demo.md"), "utf8");
const browser = await puppeteer.launch();

// render each fence exactly as catmd does
let outputHtml = "";
for (const seg of segments(doc)) {
  if (seg.kind === "text") {
    outputHtml += `<pre>${escapeHtml(seg.text)}</pre>`;
    continue;
  }
  const { data } = await renderMermaid(browser, seg.body, "png", {
    backgroundColor: "white",
    viewport: { width: 800, height: 600, deviceScaleFactor: RENDER_SCALE },
    mermaidConfig,
  });
  const b64 = Buffer.from(data).toString("base64");
  // mimic fitCells: base font (16px * scale in image px) shown at one row
  const png = PNG.sync.read(Buffer.from(data));
  const cssWidth = Math.round((png.width / (16 * RENDER_SCALE)) * FONT_PX * 1.35);
  outputHtml +=
    `<img src="data:image/png;base64,${b64}" style="width:${Math.min(cssWidth, WIDTH - 48)}px">` +
    `<div class="zoom">⌕ zoom</div>`;
}

const frameHtml = (typed, showOutput) => `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; background: #14151a; }
  .term {
    box-sizing: border-box; width: ${WIDTH}px; min-height: ${HEIGHT}px;
    padding: 14px 24px 24px; background: #1d1f27; border-radius: 10px;
    font: ${FONT_PX}px/1.5 "SF Mono", Menlo, monospace; color: #d8dae5;
  }
  .dots { margin-bottom: 12px; }
  .dots span { display: inline-block; width: 12px; height: 12px; border-radius: 6px; margin-right: 7px; }
  pre { margin: 0; font: inherit; white-space: pre-wrap; }
  img { display: block; margin: 6px 0 0; border-radius: 4px; }
  .zoom { opacity: 0.45; margin: 2px 0 6px; }
  .prompt { color: #8be9a8; }
  .cursor { background: #d8dae5; color: #1d1f27; }
</style>
<div class="term">
  <div class="dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div>
  <pre><span class="prompt">❯</span> ${escapeHtml(typed)}<span class="cursor">&nbsp;</span></pre>
  ${showOutput ? outputHtml : ""}
</div>`;

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR });

async function shoot(typed, showOutput) {
  await page.setContent(frameHtml(typed, showOutput), { waitUntil: "load" });
  await page.evaluate(() =>
    Promise.all([...document.images].map((img) => img.decode())),
  );
  const shot = await page.screenshot({ type: "png" });
  return PNG.sync.read(Buffer.from(shot));
}

const command = "catmd demo.md";
const frames = [];
frames.push({ png: await shoot("", false), delay: 700 });
for (let i = 3; i <= command.length; i += 3) {
  frames.push({ png: await shoot(command.slice(0, i), false), delay: 140 });
}
frames.push({ png: await shoot(command, false), delay: 600 });
frames.push({ png: await shoot(command, true), delay: 8000 });

await browser.close();

const gif = GIFEncoder();
for (const { png, delay } of frames) {
  const palette = quantize(png.data, 256);
  const indexed = applyPalette(png.data, palette);
  gif.writeFrame(indexed, png.width, png.height, { palette, delay });
}
gif.finish();

const out = join(ROOT, "demo/demo.gif");
await writeFile(out, gif.bytes());
console.log(`wrote ${out} (${frames.length} frames, ${gif.bytes().length} bytes)`);

if (process.env.DEMO_PREVIEW) {
  await writeFile(process.env.DEMO_PREVIEW, PNG.sync.write(frames.at(-1).png));
}
