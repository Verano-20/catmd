import { describe, expect, it } from "vitest";
import { zoomCaption } from "../../src/core/caption.js";

describe("zoomCaption", () => {
  it("hyperlinks a dim zoom label to the png", () => {
    const out = zoomCaption("/home/u/.cache/catmd/abc.png");
    expect(out.startsWith("\x1b]8;;file:///home/u/.cache/catmd/abc.png\x1b\\")).toBe(true);
    expect(out).toContain("⌕ zoom");
    expect(out.endsWith("\x1b]8;;\x1b\\")).toBe(true);
  });
});
