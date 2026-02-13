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
 * ViewPlugin that detects `$...$` and `$$...$$` regions.
 *
 * - Inline math is always rendered as styled text (mark decorations).
 * - Display math is rendered asynchronously with MathJax and replaced
 *   with SVG widgets when the cursor is outside.
 */
export const mathPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingRegions = new Map<string, MathRegion>();
    private errorMap = new Map<string, string>();
    private renderDirty = false;

    constructor(view: EditorView) {
      this.decorations = Decoration.none;
      this.rebuildDecorations(view);
      this.processQueue(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        this.renderDirty
      ) {
        this.renderDirty = false;
        this.rebuildDecorations(update.view);
      }
      if (update.docChanged) {
        this.scheduleProcessQueue(update.view);
      } else if (this.pendingRegions.size > 0) {
        this.processQueue(update.view);
      }
    }

    /** Synchronously scan the viewport and rebuild all decorations. */
    private rebuildDecorations(view: EditorView) {
      this.pendingRegions.clear();
      this.decorations = buildDecorations(
        view,
        this.pendingRegions,
        this.errorMap
      );
    }

    /** Debounced wrapper: waits for typing to settle before processing. */
    private scheduleProcessQueue(view: EditorView) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        this.processQueue(view);
      }, DEBOUNCE_MS);
    }

    /** Enqueue MathJax renders for all pending display-math regions. */
    private processQueue(view: EditorView) {
      if (this.pendingRegions.size === 0) return;
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
          this.renderDirty = true;
          view.dispatch({});
        });
      }
    }

    destroy() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
    }
  },
  { decorations: (v) => v.decorations }
);
