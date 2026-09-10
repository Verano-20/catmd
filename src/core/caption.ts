/**
 * A dim "⌕ zoom" line hyperlinked (OSC 8) to the cached PNG, so cmd/ctrl+click
 * opens it in the OS image viewer for zoom/pan.
 */
export function zoomCaption(path: string): string {
  return `\x1b]8;;file://${path}\x1b\\\x1b[2m⌕ zoom\x1b[0m\x1b]8;;\x1b\\`;
}
