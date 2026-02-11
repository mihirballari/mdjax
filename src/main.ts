/** @module main — Application entry point: creates the editor and installs lifecycle hooks. */

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { editorExtensions } from "./editor/setup";
import { appState, markClean } from "./editor/state";
import { updateTitle } from "./editor/titlebar";
import { installCloseGuard } from "./editor/file-io";

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
installCloseGuard();
