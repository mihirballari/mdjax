import { keymap, highlightSpecialChars, drawSelection, EditorView } from "@codemirror/view";
import { EditorState, Extension, Prec } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { openFile, saveFile } from "./file-io";
import { updateTitle } from "./titlebar";
import { headingsPlugin } from "./headings";
import { mathPlugin } from "./math-plugin";

const theme = EditorView.theme({});

const fileKeymap = Prec.highest(
  keymap.of([
    {
      key: "Mod-o",
      run: () => { openFile(); return true; },
    },
    {
      key: "Mod-s",
      run: () => { saveFile(); return true; },
    },
  ])
);

const titleUpdater = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    updateTitle();
  }
});

export function editorExtensions(): Extension[] {
  return [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown(),
    theme,
    headingsPlugin,
    mathPlugin,
    fileKeymap,
    titleUpdater,
  ];
}
