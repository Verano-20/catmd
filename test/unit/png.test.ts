import { describe, expect, it } from "vitest";
import { pngDims } from "../../src/core/png.js";

describe("pngDims", () => {
  it("reads width and height from IHDR", () => {
    const header = new Uint8Array(24);
    header.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(header.buffer);
    view.setUint32(8, 13);
    header.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
    view.setUint32(16, 800);
    view.setUint32(20, 600);
    expect(pngDims(header)).toEqual({ width: 800, height: 600 });
  });
});
