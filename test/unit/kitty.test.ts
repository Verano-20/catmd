import { describe, expect, it } from "vitest";
import { KITTY_CHUNK, kittyEscapes } from "../../src/core/kitty.js";

const ESC = "\x1b";
const ST = `${ESC}\\`;

function controlOf(part: string): string {
  return part.slice(3, part.indexOf(";"));
}

describe("kittyEscapes", () => {
  it("single chunk payload", () => {
    const png = new TextEncoder().encode("tinypng");
    const out = kittyEscapes(png, 12, 4);
    expect(out.startsWith(`${ESC}_G`)).toBe(true);
    expect(out.endsWith(ST)).toBe(true);
    const control = controlOf(out);
    const keys = Object.fromEntries(control.split(",").map((kv) => kv.split("=")));
    expect(keys).toMatchObject({ a: "T", f: "100", c: "12", r: "4", m: "0" });
    const payload = out.slice(out.indexOf(";") + 1, -2);
    expect(payload).toBe(Buffer.from("tinypng").toString("base64"));
  });

  it("multi chunk flags", () => {
    const png = new Uint8Array(KITTY_CHUNK * 2).fill(0x78);
    const out = kittyEscapes(png, 12, 4);
    const parts = out.split(ST).slice(0, -1);
    expect(parts.length).toBeGreaterThan(1);
    expect(controlOf(parts[0]!)).toContain("a=T");
    expect(controlOf(parts[0]!)).toContain("m=1");
    for (const mid of parts.slice(1, -1)) {
      expect(controlOf(mid)).toBe("m=1");
    }
    expect(controlOf(parts[parts.length - 1]!)).toBe("m=0");
    const payload = parts.map((p) => p.slice(p.indexOf(";") + 1)).join("");
    expect(payload).toBe(Buffer.from(png).toString("base64"));
  });
});
