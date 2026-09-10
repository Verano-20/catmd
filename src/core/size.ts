/** mermaid's default logical font size */
export const MERMAID_BASE_FONT_PX = 16;

/** puppeteer deviceScaleFactor: pixel density of rendered diagrams */
export const RENDER_SCALE = 4;

/** kitty/Ghostty silently drop images over 10000px per side */
export const MAX_IMG_DIM = 9800;

/**
 * Ghostty's image-storage-limit is 320MB of decoded RGBA per screen; a single
 * image over that is dropped outright. 24MP = 96MB, three big diagrams fit.
 */
export const MAX_IMG_PIXELS = 24_000_000;

/**
 * Display size (cols, rows) so mermaid's base font shows at `textSize`
 * terminal rows — diagram text matches terminal text regardless of diagram
 * complexity — capped (aspect preserved) at maxCols.
 */
export function fitCells(
  imgW: number,
  imgH: number,
  maxCols: number,
  cellW: number,
  cellH: number,
  textSize = 1.0,
): { cols: number; rows: number } {
  const k = (cellH * textSize) / (MERMAID_BASE_FONT_PX * RENDER_SCALE);
  const cols = Math.max(1, Math.min(Math.ceil((imgW * k) / cellW), maxCols));
  const shownW = cols * cellW;
  const shownH = (imgH * shownW) / imgW;
  return { cols, rows: Math.max(1, Math.ceil(shownH / cellH)) };
}

/**
 * Scale factor (<= 1) that brings a rendered image inside both the per-side
 * dimension limit and the total pixel (decoded storage) limit. 1 when the
 * image already fits.
 */
export function capFactor(imgW: number, imgH: number): number {
  return Math.min(
    1,
    MAX_IMG_DIM / Math.max(imgW, imgH),
    Math.sqrt(MAX_IMG_PIXELS / (imgW * imgH)),
  );
}
