import { describe, expect, it } from "vitest";
import { MAX_IMG_DIM, MAX_IMG_PIXELS, capFactor, fitCells } from "../../src/core/size.js";

// RENDER_SCALE=4: base font = 64 rendered px; 20px cells -> k=0.3125
describe("fitCells", () => {
  it("sizes so the base font matches cell height", () => {
    // 640x320 px shown at k=0.3125 -> 200x100 px -> 20 cols, 5 rows
    expect(fitCells(640, 320, 200, 10, 20)).toEqual({ cols: 20, rows: 5 });
  });

  it("caps wide images at maxCols", () => {
    // uncapped would be 200 cols; capped to 80 -> 800px wide,
    // aspect keeps height at 80px -> 4 rows
    expect(fitCells(6400, 640, 80, 10, 20)).toEqual({ cols: 80, rows: 4 });
  });

  it("textSize multiplier scales the display", () => {
    expect(fitCells(640, 320, 200, 10, 20, 2.0)).toEqual({ cols: 40, rows: 10 });
  });
});

describe("capFactor", () => {
  it("returns 1 when the image already fits", () => {
    expect(capFactor(3000, 2000)).toBe(1);
  });

  it("caps the longest side at MAX_IMG_DIM", () => {
    const f = capFactor(19600, 100);
    expect(19600 * f).toBeLessThanOrEqual(MAX_IMG_DIM);
    expect(f).toBeCloseTo(0.5, 5);
  });

  it("caps total pixels at MAX_IMG_PIXELS", () => {
    const f = capFactor(8000, 8000); // 64MP, both sides under the dim cap
    expect(8000 * f * (8000 * f)).toBeLessThanOrEqual(MAX_IMG_PIXELS);
    expect(f).toBeCloseTo(Math.sqrt(MAX_IMG_PIXELS / 64_000_000), 5);
  });
});
