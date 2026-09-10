import { describe, expect, it } from "vitest";
import { parse } from "../../src/core/parse.js";

describe("parse", () => {
  it("plain text is a single text segment", () => {
    const lines = ["# title", "", "some prose"];
    expect(parse(lines)).toEqual([{ kind: "text", lines }]);
  });

  it("mermaid fence becomes a mermaid segment", () => {
    const lines = ["before", "```mermaid", "graph TD", "  A --> B", "```", "after"];
    expect(parse(lines)).toEqual([
      { kind: "text", lines: ["before"] },
      { kind: "mermaid", body: "graph TD\n  A --> B", raw: lines.slice(1, 5) },
      { kind: "text", lines: ["after"] },
    ]);
  });

  it("fence at start and end of file", () => {
    const lines = ["```mermaid", "graph TD", "```"];
    expect(parse(lines)).toEqual([{ kind: "mermaid", body: "graph TD", raw: lines }]);
  });

  it("multiple mermaid fences", () => {
    const lines = ["```mermaid", "graph TD", "```", "middle", "```mermaid", "pie", "```"];
    const segs = parse(lines);
    expect(segs.map((s) => s.kind)).toEqual(["mermaid", "text", "mermaid"]);
    expect(segs[0]).toMatchObject({ body: "graph TD" });
    expect(segs[2]).toMatchObject({ body: "pie" });
  });

  it("non-mermaid fence stays text", () => {
    const lines = ["```java", "int x = 1;", "```"];
    expect(parse(lines)).toEqual([{ kind: "text", lines }]);
  });

  it("mermaid fence inside another fence stays text", () => {
    const lines = ["````markdown", "```mermaid", "graph TD", "```", "````"];
    expect(parse(lines)).toEqual([{ kind: "text", lines }]);
  });

  it("unclosed mermaid fence stays text", () => {
    const lines = ["prose", "```mermaid", "graph TD"];
    expect(parse(lines)).toEqual([{ kind: "text", lines }]);
  });

  it("indented mermaid fence is recognised", () => {
    const lines = ["  ```mermaid", "  graph TD", "  ```"];
    expect(parse(lines)).toEqual([{ kind: "mermaid", body: "  graph TD", raw: lines }]);
  });

  it("fence info with trailing space", () => {
    const lines = ["```mermaid  ", "graph TD", "```"];
    expect(parse(lines)).toEqual([{ kind: "mermaid", body: "graph TD", raw: lines }]);
  });
});
