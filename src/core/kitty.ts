export const KITTY_CHUNK = 4096;

const ESC = "\x1b";

/**
 * Kitty graphics protocol escape string displaying `png` scaled into a
 * cols x rows cell box (a=T direct transmission, f=100 PNG, base64 payload
 * in 4096-byte chunks with m=1/m=0 continuation flags).
 */
export function kittyEscapes(png: Uint8Array, cols: number, rows: number): string {
  const payload = Buffer.from(png).toString("base64");
  const out: string[] = [];
  const chunks = Math.ceil(payload.length / KITTY_CHUNK) || 1;
  for (let i = 0; i < chunks; i++) {
    const keys: string[] = [];
    if (i === 0) keys.push("a=T", "f=100", `c=${cols}`, `r=${rows}`);
    keys.push(`m=${i === chunks - 1 ? 0 : 1}`);
    const chunk = payload.slice(i * KITTY_CHUNK, (i + 1) * KITTY_CHUNK);
    out.push(`${ESC}_G${keys.join(",")};${chunk}${ESC}\\`);
  }
  return out.join("");
}
