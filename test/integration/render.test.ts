import { afterAll, describe, expect, it } from "vitest";
import { pngDims } from "../../src/core/png.js";
import { MAX_IMG_DIM, MAX_IMG_PIXELS, RENDER_SCALE } from "../../src/core/size.js";
import { Renderer } from "../../src/render/renderer.js";

async function browserAvailable(): Promise<boolean> {
  try {
    const { default: puppeteer } = await import("puppeteer");
    const browser = await puppeteer.launch();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

const available = await browserAvailable();
const renderer = new Renderer("default");

afterAll(async () => {
  await renderer.close();
});

function chain(row: number, steps: number): string {
  const lines: string[] = [];
  for (let i = 0; i < steps; i++) {
    lines.push(`  R${row}N${i}[row ${row} step ${i} label] --> R${row}N${i + 1}[row ${row} step ${i + 1} label]`);
  }
  return lines.join("\n");
}

describe.runIf(available)("Renderer", { timeout: 120_000 }, () => {
  it("renders wide diagrams at natural size, not squeezed into the viewport", async () => {
    const png = await renderer.render(`flowchart LR\n${chain(0, 9)}`);
    const { width } = pngDims(png);
    expect(width).toBeGreaterThan(800 * RENDER_SCALE);
    expect(width).toBeLessThanOrEqual(MAX_IMG_DIM);
  });

  it("caps dense diagrams below terminal dimension and storage limits", async () => {
    const rows = Array.from({ length: 30 }, (_, r) => chain(r, 9)).join("\n");
    const png = await renderer.render(`flowchart LR\n${rows}`);
    const { width, height } = pngDims(png);
    expect(Math.max(width, height)).toBeLessThanOrEqual(MAX_IMG_DIM);
    expect(width * height).toBeLessThanOrEqual(MAX_IMG_PIXELS);
  });

  it("rejects invalid mermaid with a useful error", async () => {
    await expect(renderer.render("this is not valid mermaid !!!")).rejects.toThrow();
  });
});
