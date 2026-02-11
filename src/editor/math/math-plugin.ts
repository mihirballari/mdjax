/** @module math-plugin — CodeMirror ViewPlugin that renders LaTeX math via MathJax. */

import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
} from "@codemirror/view";
import { MathRegion } from "./math-detect";
import { setCached, evictOldest } from "./math-cache";
import { renderLatex } from "./mathjax-api";
import { enqueueRender } from "./math-render-queue";
import { buildDecorations, DEBOUNCE_MS, MAX_CACHE_SIZE } from "./math-decorations";

/**
 * ViewPlugin that detects `$...$` and `$$...$$` regions, renders them
 * asynchronously with MathJax, and replaces the source text with SVG widgets.
 */
export const mathPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingRegions = new Map<string, MathRegion>();
    private errorMap = new Map<string, string>();

    constructor(view: EditorView) {
      this.decorations = Decoration.none;
      this.scheduleRender(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.scheduleRender(update.view);
      } else if (update.selectionSet || update.viewportChanged) {
        this.rebuild(update.view);
      }
    }

    private scheduleRender(view: EditorView) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        this.rebuild(view);
      }, DEBOUNCE_MS);
    }

    private rebuild(view: EditorView) {
      this.pendingRegions.clear();
      this.decorations = buildDecorations(
        view,
        this.pendingRegions,
        this.errorMap
      );

      if (this.pendingRegions.size > 0) {
        const pending = new Map(this.pendingRegions);
        for (const [key, region] of pending) {
          enqueueRender(async () => {
            try {
              const svg = await renderLatex(region.tex, region.display);
              setCached(region.tex, region.display, svg);
              evictOldest(MAX_CACHE_SIZE);
              this.errorMap.delete(key);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              this.errorMap.set(key, msg);
            }
            view.dispatch({});
          });
        }
      }
    }

    destroy() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
    }
  },
  { decorations: (v) => v.decorations }
);
