import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";
import { editorExtensions } from "./editor/setup";
import { appState, markClean, isDirty } from "./editor/state";
import { updateTitle } from "./editor/titlebar";

const state = EditorState.create({
  doc: "",
  extensions: editorExtensions(),
});

const view = new EditorView({
  state,
  parent: document.getElementById("editor")!,
});

appState.view = view;
markClean();
updateTitle();

// Close guard: confirm if unsaved changes
getCurrentWindow().onCloseRequested(async (event) => {
  if (isDirty()) {
    const confirmed = await ask("You have unsaved changes. Close anyway?", {
      title: "Unsaved Changes",
      kind: "warning",
    });
    if (!confirmed) {
      event.preventDefault();
    }
  }
});
