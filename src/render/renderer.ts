import { renderMermaid } from "@mermaid-js/mermaid-cli";
import { createRequire } from "node:module";
import puppeteer, { type Browser } from "puppeteer";
import type { MermaidConfig } from "mermaid";
import { pngDims } from "../core/png.js";
import { RENDER_SCALE, capFactor } from "../core/size.js";

// useMaxWidth would scale wide diagrams down to fit the render viewport,
// shrinking their text in pixel space and breaking uniform text sizing
const NO_MAX_WIDTH_TYPES = [
  "flowchart",
  "sequence",
  "class",
  "state",
  "er",
  "journey",
  "timeline",
  "mindmap",
  "gitGraph",
  "requirement",
  "quadrantChart",
  "xyChart",
  "pie",
  "gantt",
] as const;

export function mermaidConfig(theme: string): MermaidConfig {
  const config: Record<string, unknown> = { theme };
  for (const type of NO_MAX_WIDTH_TYPES) config[type] = { useMaxWidth: false };
  return config as MermaidConfig;
}

export function mermaidConfigJson(): string {
  return JSON.stringify(mermaidConfig("_"));
}

/** Version string for the cache key: installed mermaid-cli if resolvable. */
export function rendererVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("@mermaid-js/mermaid-cli/package.json") as { version: string };
    return `mermaid-cli@${pkg.version}`;
  } catch {
    return "mermaid-cli@unknown";
  }
}

/**
 * Renders mermaid bodies to PNG through a single lazily-launched browser.
 * Images exceeding the terminal's dimension/storage limits get one vector
 * re-render at a proportionally reduced scale.
 */
export class Renderer {
  private browser: Browser | null = null;

  constructor(private readonly theme: string) {}

  async render(body: string): Promise<Uint8Array> {
    const png = await this.renderAt(body, RENDER_SCALE);
    const { width, height } = pngDims(png);
    const factor = capFactor(width, height);
    if (factor >= 1) return png;
    return this.renderAt(body, Math.floor(RENDER_SCALE * factor * 100) / 100);
  }

  private async renderAt(body: string, scale: number): Promise<Uint8Array> {
    if (this.browser === null) {
      this.browser = await puppeteer.launch();
    }
    const { data } = await renderMermaid(this.browser, body, "png", {
      backgroundColor: "white",
      viewport: { width: 800, height: 600, deviceScaleFactor: scale },
      mermaidConfig: mermaidConfig(this.theme),
    });
    return data;
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }
}
