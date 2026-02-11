import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

const headingClasses: Record<string, string> = {
  ATXHeading1: "cm-heading-1",
  ATXHeading2: "cm-heading-2",
  ATXHeading3: "cm-heading-3",
  ATXHeading4: "cm-heading-4",
};

function buildHeadingDecorations(view: EditorView): DecorationSet {
  const decorations: { from: number; to: number; deco: Decoration }[] = [];
  const tree = syntaxTree(view.state);

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter(node) {
        const cls = headingClasses[node.name];
        if (cls) {
          const line = view.state.doc.lineAt(node.from);
          decorations.push({
            from: line.from,
            to: line.from,
            deco: Decoration.line({ class: cls }),
          });
        }
      },
    });
  }

  return Decoration.set(
    decorations
      .sort((a, b) => a.from - b.from)
      .map((d) => d.deco.range(d.from))
  );
}

export const headingsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildHeadingDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildHeadingDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);
