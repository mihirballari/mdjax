import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
} from "@codemirror/view";
import { detectMathRegions, MathRegion } from "./math-detect";
import { getCached, setCached, evictOldest } from "./math-cache";
import { renderLatex } from "./mathjax-api";
import { enqueueRender } from "./math-render-queue";
import { MathWidget, ErrorMathWidget } from "./math-widget";

const DEBOUNCE_MS = 200;
const VIEWPORT_BUFFER = 500;
const MAX_CACHE_SIZE = 500;

function cursorInRange(view: EditorView, from: number, to: number): boolean {
  const sel = view.state.selection;
  for (const range of sel.ranges) {
    if (range.from <= to && range.to >= from) return true;
  }
  return false;
}

function buildDecorations(
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
              // Clear any previous error for this key
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
