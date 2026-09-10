import { closeSync, openSync, writeSync } from "node:fs";
import { ReadStream } from "node:tty";

export type Env = Record<string, string | undefined>;

/**
 * True when the environment says the terminal speaks the kitty graphics
 * protocol (Ghostty, kitty). Conservative allowlist: unknown terminals would
 * print raw escape garbage instead of images. WezTerm is deliberately absent
 * — its kitty graphics support is off by default (enable_kitty_graphics);
 * WezTerm users who have enabled it can pass --force.
 */
export function supportsKittyGraphics(env: Env): boolean {
  return (
    (env["TERM_PROGRAM"] ?? "").toLowerCase() === "ghostty" ||
    (env["TERM"] ?? "").includes("kitty") ||
    env["KITTY_WINDOW_ID"] !== undefined ||
    env["GHOSTTY_RESOURCES_DIR"] !== undefined
  );
}

export type CellSizeReport = { kind: "cell" | "window"; widthPx: number; heightPx: number };

/**
 * Parse an XTWINOPS reply: `CSI 6 ; height ; width t` (cell size in px,
 * reply to CSI 16 t) or `CSI 4 ; height ; width t` (window size in px,
 * reply to CSI 14 t). Returns null for anything else.
 */
export function parseCellSizeReport(reply: string): CellSizeReport | null {
  const match = /\x1b\[(4|6);(\d+);(\d+)t/.exec(reply);
  if (!match) return null;
  const heightPx = Number(match[2]);
  const widthPx = Number(match[3]);
  if (heightPx <= 0 || widthPx <= 0) return null;
  return { kind: match[1] === "6" ? "cell" : "window", widthPx, heightPx };
}

/**
 * Write an XTWINOPS query to /dev/tty in raw mode and collect the reply,
 * with a timeout for terminals that never answer. Null when there is no
 * controlling terminal or no reply.
 */
function queryTty(query: string, timeoutMs: number): Promise<string | null> {
  let fd: number;
  try {
    fd = openSync("/dev/tty", "r+");
  } catch {
    return Promise.resolve(null);
  }
  const stream = new ReadStream(fd);
  return new Promise((resolve) => {
    let reply = "";
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        stream.setRawMode(false);
        stream.destroy(); // closes fd
      } catch {
        try {
          closeSync(fd);
        } catch {
          /* already closed */
        }
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    stream.setRawMode(true);
    stream.on("data", (chunk: Buffer) => {
      reply += chunk.toString("latin1");
      if (reply.includes("t")) finish(reply);
    });
    stream.on("error", () => finish(null));
    writeSync(fd, query);
  });
}

export type CellMetrics = { cols: number; cellW: number; cellH: number };

/**
 * Terminal column count and cell pixel size. Prefers the CSI 16 t cell-size
 * report (ssh/tmux-safe), falls back to CSI 14 t window size divided by the
 * row/column counts, then to a 10x20px guess.
 */
export async function cellMetrics(timeoutMs = 150): Promise<CellMetrics> {
  const cols = process.stdout.columns ?? 80;
  const rows = process.stdout.rows ?? 24;
  const cell = parseCellSizeReport((await queryTty("\x1b[16t", timeoutMs)) ?? "");
  if (cell?.kind === "cell") return { cols, cellW: cell.widthPx, cellH: cell.heightPx };
  const win = parseCellSizeReport((await queryTty("\x1b[14t", timeoutMs)) ?? "");
  if (win?.kind === "window") {
    return { cols, cellW: win.widthPx / cols, cellH: win.heightPx / rows };
  }
  return { cols, cellW: 10, cellH: 20 };
}
