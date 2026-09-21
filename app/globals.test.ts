import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(import.meta.dirname, "globals.css"), "utf8");

/** Returns the body of every `@media <query> { ... }` block, brace-matched. */
function mediaBlocks(query: string): string[] {
  const blocks: string[] = [];
  const needle = `@media ${query}`;
  let from = 0;
  for (;;) {
    const start = css.indexOf(needle, from);
    if (start === -1) return blocks;
    const open = css.indexOf("{", start);
    let depth = 1;
    let i = open + 1;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    blocks.push(css.slice(open + 1, i - 1));
    from = i;
  }
}

/** The stylesheet with every `@media <query>` block's body cut out. */
function cssOutsideMedia(query: string): string {
  let rest = css;
  for (const block of mediaBlocks(query)) {
    rest = rest.replace(block, "");
  }
  return rest;
}

describe("touch input", () => {
  it("only lifts grid cells and glows primary buttons on real hover, so taps don't leave them stuck", () => {
    const hoverCss = mediaBlocks("(hover: hover)").join("\n");
    expect(hoverCss).toContain(".slot:hover");
    expect(hoverCss).toContain(".btn-glow:hover");

    const rest = cssOutsideMedia("(hover: hover)");
    expect(rest).not.toContain(".slot:hover");
    expect(rest).not.toContain(".btn-glow:hover");
  });

  it("bumps text fields to 16px on coarse pointers so iOS Safari doesn't zoom the page on focus", () => {
    const coarse = mediaBlocks("(pointer: coarse)").join("\n");
    expect(coarse).toMatch(/input[^{}]*select[^{}]*textarea[^{}]*\{[^}]*font-size:\s*16px/);
  });

  it("expands .tap-target to a 44px minimum hit area on coarse pointers only", () => {
    const coarse = mediaBlocks("(pointer: coarse)").join("\n");
    expect(coarse).toMatch(/\.tap-target\s*\{[^}]*min-height:\s*44px/);
    expect(coarse).toMatch(/\.tap-target\s*\{[^}]*min-width:\s*44px/);
    expect(cssOutsideMedia("(pointer: coarse)")).not.toMatch(/\.tap-target\s*\{/);
  });
});

describe("availability grid columns", () => {
  it("defines the label and day column widths as custom properties the grid rows share", () => {
    expect(css).toMatch(/\.availability-grid\s*\{[^}]*--grid-label-col:\s*\d+px/);
    expect(css).toMatch(/\.availability-grid\s*\{[^}]*--grid-day-col:\s*\d+px/);
    expect(css).toMatch(
      /\.availability-grid-row\s*\{[^}]*grid-template-columns:\s*var\(--grid-label-col\)\s+repeat\(7,\s*minmax\(var\(--grid-day-col\),\s*1fr\)\)/,
    );
    expect(css).toMatch(
      /\.availability-grid-inner\s*\{[^}]*min-width:\s*calc\(var\(--grid-label-col\)\s*\+\s*7\s*\*\s*var\(--grid-day-col\)\)/,
    );
  });

  it("widens the label column from md up", () => {
    const md = mediaBlocks("(min-width: 768px)").join("\n");
    expect(md).toMatch(/\.availability-grid\s*\{[^}]*--grid-label-col:\s*188px/);
  });

  it("widens day columns on coarse pointers so the 16px selects fit", () => {
    const coarse = mediaBlocks("(pointer: coarse)").join("\n");
    expect(coarse).toMatch(/\.availability-grid\s*\{[^}]*--grid-day-col:\s*(1[4-9]\d|[2-9]\d\d)px/);
  });

  it("switches the grid's status selects to narrower mixed-case sans on coarse pointers, since 16px mono caps clip", () => {
    const coarse = mediaBlocks("(pointer: coarse)").join("\n");
    const rule = coarse.match(/\.availability-grid select\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(rule).toMatch(/text-transform:\s*none/);
    expect(rule).toMatch(/letter-spacing:\s*normal/);
  });
});
