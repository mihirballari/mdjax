/** @module headings — CodeMirror plugin that styles Markdown headings and hides `#` prefixes. */

import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from "@codemirror/view";
import { Range } from "@codemirror/state";
import { cursorInRange } from "./cursor-utils";

/** Maps heading level (1–4) to a CSS class applied to the line. */
const headingClasses: Record<number, string> = {
  1: "cm-heading-1",
  2: "cm-heading-2",
  3: "cm-heading-3",
  4: "cm-heading-4",
};

/** Build heading decorations for all visible lines. */
function buildHeadingDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const doc = view.state.doc;

  for (const { from, to } of view.visibleRanges) {
    const startLine = doc.lineAt(from).number;
    const endLine = doc.lineAt(Math.min(to, doc.length)).number;

    for (let ln = startLine; ln <= endLine; ln++) {
      const line = doc.line(ln);
      const text = line.text;

      // Match: 1-4 hashes at start, followed by space+content OR end of line
      const match = text.match(/^(#{1,4})(\s|$)/);
      if (!match) continue;

      const hashCount = match[1].length;
      const cls = headingClasses[hashCount];
      if (!cls) continue;

      const hasSpace = match[2] === " " || match[2] === "\t";
      const hasContent = hasSpace && text.length > match[0].length;

      // Apply line-level heading style
      decos.push(Decoration.line({ class: cls }).range(line.from));

      if (!hasContent || cursorInRange(view, line.from, line.to)) {
        // In-progress OR cursor on line: show # in grey
        decos.push(
          Decoration.mark({ class: "cm-heading-hash" }).range(
            line.from,
            line.from + hashCount
          )
        );
      } else {
        // Confirmed heading, cursor elsewhere: hide "# " prefix
        const prefixLen = hashCount + 1; // hashes + space
        decos.push(
          Decoration.replace({}).range(
            line.from,
            line.from + prefixLen
          )
        );
      }
    }
  }

  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decos);
}

export const headingsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildHeadingDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildHeadingDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);
