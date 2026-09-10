import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

/** XDG-aware cache directory for rendered PNGs. */
export function cacheDir(env: Record<string, string | undefined> = process.env): string {
  return join(env["XDG_CACHE_HOME"] ?? join(homedir(), ".cache"), "catmd");
}

export type CacheKeyInputs = {
  body: string;
  theme: string;
  renderScale: number;
  maxImgDim: number;
  maxImgPixels: number;
  mermaidConfig: string;
  rendererVersion: string;
};

/** Stable 24-hex-char cache key over everything that affects rendered pixels. */
export function cacheKey(inputs: CacheKeyInputs): string {
  const material = [
    inputs.theme,
    String(inputs.renderScale),
    String(inputs.maxImgDim),
    String(inputs.maxImgPixels),
    inputs.mermaidConfig,
    inputs.rendererVersion,
    inputs.body,
  ].join("\x00");
  return createHash("sha256").update(material).digest("hex").slice(0, 24);
}
