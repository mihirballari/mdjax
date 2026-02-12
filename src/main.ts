/** @module main — Application entry point: creates the editor and installs lifecycle hooks. */

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { exists, mkdir, readTextFile } from "@tauri-apps/plugin-fs";
import { documentDir } from "@tauri-apps/api/path";
import { editorExtensions } from "./editor/setup";
import { appState, markClean } from "./editor/state";
import { updateTitle } from "./editor/titlebar";
import { installCloseGuard } from "./editor/file-io";
import { loadSession } from "./editor/session";

const state = EditorState.create({
  doc: "# ",
  extensions: editorExtensions(),
});

const view = new EditorView({
  state,
  parent: document.getElementById("editor")!,
});

appState.view = view;

// Place cursor at end of line 1 (after "# ")
view.dispatch({ selection: { anchor: 2 } });
markClean();
updateTitle();
installCloseGuard();

// Ensure ~/Documents/mdjax/ exists, then restore last session
(async () => {
  try {
    const mdjaxDir = (await documentDir()) + "/mdjax";
    if (!(await exists(mdjaxDir))) await mkdir(mdjaxDir, { recursive: true });
  } catch {
    // Non-fatal — save dialog will still work without the default folder
  }

  const lastFile = await loadSession();
  if (!lastFile) return;

  try {
    if (!(await exists(lastFile))) return;
    const content = await readTextFile(lastFile);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
    appState.filePath = lastFile;
    markClean();
    updateTitle();
  } catch {
    // File unreadable — fall through to default "# " document
  }
})();
