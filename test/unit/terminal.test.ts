import { describe, expect, it } from "vitest";
import { parseCellSizeReport, supportsKittyGraphics } from "../../src/core/terminal.js";

describe("supportsKittyGraphics", () => {
  it("ghostty by TERM_PROGRAM", () => {
    expect(supportsKittyGraphics({ TERM_PROGRAM: "ghostty" })).toBe(true);
  });

  it("kitty by TERM", () => {
    expect(supportsKittyGraphics({ TERM: "xterm-kitty" })).toBe(true);
  });

  it("kitty by KITTY_WINDOW_ID", () => {
    expect(supportsKittyGraphics({ KITTY_WINDOW_ID: "1" })).toBe(true);
  });

  it("wezterm is NOT auto-detected (kitty graphics off by default there)", () => {
    expect(supportsKittyGraphics({ TERM_PROGRAM: "WezTerm" })).toBe(false);
  });

  it("iTerm2 is not supported", () => {
    expect(
      supportsKittyGraphics({ TERM_PROGRAM: "iTerm.app", TERM: "xterm-256color" }),
    ).toBe(false);
  });

  it("empty env is not supported", () => {
    expect(supportsKittyGraphics({})).toBe(false);
  });
});

describe("parseCellSizeReport", () => {
  it("parses a CSI 16 t cell-size reply", () => {
    expect(parseCellSizeReport("\x1b[6;32;15t")).toEqual({
      kind: "cell",
      widthPx: 15,
      heightPx: 32,
    });
  });

  it("parses a CSI 14 t window-size reply", () => {
    expect(parseCellSizeReport("\x1b[4;1080;1920t")).toEqual({
      kind: "window",
      widthPx: 1920,
      heightPx: 1080,
    });
  });

  it("rejects garbage", () => {
    expect(parseCellSizeReport("\x1b[0n")).toBeNull();
    expect(parseCellSizeReport("")).toBeNull();
    expect(parseCellSizeReport("\x1b[6;0;0t")).toBeNull();
  });
});
