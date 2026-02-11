/** @module math-decorations — Builds CodeMirror DecorationSets for rendered math regions. */

import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { detectMathRegions, MathRegion } from "./math-detect";
import { getCached } from "./math-cache";
import { cursorInRange } from "../cursor-utils";
import { MathWidget, ErrorMathWidget } from "./math-widget";

/** Milliseconds to wait after a doc change before rebuilding decorations. */
export const DEBOUNCE_MS = 200;

/** Extra characters scanned beyond the visible viewport edges. */
export const VIEWPORT_BUFFER = 500;

/** Maximum number of rendered SVGs kept in the LRU cache. */
export const MAX_CACHE_SIZE = 500;

/**
 * Scan visible (+ buffered) ranges for math regions and return a
 * `DecorationSet` that replaces each region with its rendered widget.
 *
 * Regions whose LaTeX is not yet cached are collected into `pendingRegions`
 * so the caller can kick off async renders.
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
      if (cursorInRange(view, region.from, region.to)) continue;

      const key = `${region.display ? "D" : "I"}:${region.tex}`;

      // Check for cached errors
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
