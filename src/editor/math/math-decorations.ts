/** @module math-decorations — Builds CodeMirror DecorationSets for rendered math regions. */

import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { detectMathRegions, MathRegion } from "./math-detect";
import { getCached } from "./math-cache";
import { cursorInRange } from "../cursor-utils";
import { MathWidget, ErrorMathWidget } from "./math-widget";

/** Milliseconds to wait after a doc change before processing the render queue. */
export const DEBOUNCE_MS = 200;

/** Extra characters scanned beyond the visible viewport edges. */
export const VIEWPORT_BUFFER = 500;

/** Maximum number of rendered SVGs kept in the LRU cache. */
export const MAX_CACHE_SIZE = 500;

const delimiterMark = Decoration.mark({ class: "cm-math-delimiter" });
const sourceMark = Decoration.mark({ class: "cm-math-source" });

/**
 * Scan visible (+ buffered) ranges for math regions and return a
 * `DecorationSet`.
 *
 * - **Inline math** (`$...$`): SVG widget when cursor is outside,
 *   delimiter + source marks when cursor is inside.
 * - **Display math** (`$$...$$`): SVG widget when cursor is outside,
 *   delimiter marks when cursor is inside.
 *
 * Display regions whose LaTeX is not yet cached are collected into
 * `pendingRegions` so the caller can kick off async renders.
 */
export function buildDecorations(
  view: EditorView,
  pendingRegions: Map<string, MathRegion>,
  errorMap: Map<string, string>
): DecorationSet {
  const decorations: { from: number; to: number; deco: Decoration }[] = [];

  for (const { from: vFrom, to: vTo } of view.visibleRanges) {
    const scanFrom = Math.max(0, vFrom - VIEWPORT_BUFFER);
    const scanTo = Math.min(view.state.doc.length, vTo + VIEWPORT_BUFFER);
    const regions = detectMathRegions(view.state, scanFrom, scanTo);

    for (const region of regions) {
      const delimLen = region.display ? 2 : 1; // $$ vs $

      /* ── Cursor inside: show source with styled delimiters ── */
      if (cursorInRange(view, region.from, region.to)) {
        decorations.push(
          { from: region.from, to: region.from + delimLen, deco: delimiterMark },
          { from: region.to - delimLen, to: region.to, deco: delimiterMark }
        );
        if (!region.display) {
          decorations.push(
            { from: region.from + 1, to: region.to - 1, deco: sourceMark }
          );
        }
        continue;
      }

      /* ── Cursor outside: replace with SVG widget ── */
      const key = `${region.display ? "D" : "I"}:${region.tex}`;

      const errorMsg = errorMap.get(key);
      if (errorMsg) {
        decorations.push({
          from: region.from,
          to: region.to,
          deco: Decoration.replace({
            widget: new ErrorMathWidget(region.tex, errorMsg, region.display),
          }),
        });
        continue;
      }

      const cached = getCached(region.tex, region.display);
      if (cached) {
        decorations.push({
          from: region.from,
          to: region.to,
          deco: Decoration.replace({
            widget: new MathWidget(cached, region.display),
          }),
        });
      } else {
        if (!pendingRegions.has(key)) {
          pendingRegions.set(key, region);
        }
      }
    }
  }

  return Decoration.set(
    decorations
      .sort((a, b) => a.from - b.from || a.to - b.to)
      .map((d) => d.deco.range(d.from, d.to))
  );
}
