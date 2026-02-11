/** @module keybindings — Custom key bindings and document-change listeners. */

import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { openFile, saveFile } from "./file-io";
import { updateTitle } from "./titlebar";

/** Highest-priority keymap for file operations (Cmd/Ctrl-O, Cmd/Ctrl-S). */
export const fileKeymap = Prec.highest(
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

/** Keeps the window title in sync whenever the document changes. */
export const titleUpdater = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    updateTitle();
  }
});
