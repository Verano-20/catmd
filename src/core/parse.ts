export type TextSegment = { kind: "text"; lines: string[] };
export type MermaidSegment = { kind: "mermaid"; body: string; raw: string[] };
export type Segment = TextSegment | MermaidSegment;

/**
 * Split markdown lines into text and mermaid segments.
 *
 * `raw` includes the fence markers for fallback printing; `body` is the fence
 * content joined with newlines. Unclosed mermaid fences and mermaid fences
 * nested inside other code fences stay text.
 */
export function parse(lines: string[]): Segment[] {
  const segments: Segment[] = [];
  let text: string[] = [];

  const flushText = () => {
    if (text.length > 0) {
      segments.push({ kind: "text", lines: text });
      text = [];
    }
  };

  let i = 0;
  const n = lines.length;
  while (i < n) {
    const stripped = lines[i]!.trim();
    if (stripped.startsWith("```") && stripped.slice(3).trim() === "mermaid") {
      let j = i + 1;
      while (j < n && lines[j]!.trim() !== "```") j++;
      if (j === n) {
        // unclosed fence: leave as text
        text.push(...lines.slice(i));
        break;
      }
      flushText();
      segments.push({
        kind: "mermaid",
        body: lines.slice(i + 1, j).join("\n"),
        raw: lines.slice(i, j + 1),
      });
      i = j + 1;
    } else if (stripped.startsWith("```")) {
      // generic fence: pass through, shielding any mermaid fence inside
      const closer = stripped.slice(0, stripped.length - stripped.replace(/^`+/, "").length);
      let j = i + 1;
      while (j < n && lines[j]!.trim() !== closer) j++;
      const end = Math.min(j + 1, n);
      text.push(...lines.slice(i, end));
      i = end;
    } else {
      text.push(lines[i]!);
      i++;
    }
  }
  flushText();
  return segments;
}
