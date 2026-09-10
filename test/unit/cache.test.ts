import { describe, expect, it } from "vitest";
import { cacheKey, type CacheKeyInputs } from "../../src/render/cache.js";

const base: CacheKeyInputs = {
  body: "graph TD",
  theme: "default",
  renderScale: 4,
  maxImgDim: 9800,
  maxImgPixels: 24_000_000,
  mermaidConfig: '{"flowchart":{"useMaxWidth":false}}',
  rendererVersion: "11.17.0",
};

describe("cacheKey", () => {
  it("is stable for identical inputs", () => {
    expect(cacheKey({ ...base })).toBe(cacheKey({ ...base }));
    expect(cacheKey(base)).toMatch(/^[0-9a-f]{24}$/);
  });

  it("differs when any render-affecting input changes", () => {
    const keys = [
      cacheKey(base),
      cacheKey({ ...base, body: "graph LR" }),
      cacheKey({ ...base, theme: "dark" }),
      cacheKey({ ...base, renderScale: 2 }),
      cacheKey({ ...base, rendererVersion: "11.18.0" }),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});
