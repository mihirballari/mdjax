/** @module state — Global mutable application state shared across modules. */

import { EditorView } from "@codemirror/view";

/** Mutable singleton tracking the active file, editor view, and clean-snapshot for dirty detection. */
export interface AppState {
  filePath: string | null;
  cleanSnapshot: string;
  view: EditorView | null;
}

/** Global application state singleton. */
export const appState: AppState = {
  filePath: null,
  cleanSnapshot: "",
  view: null,
};

/** Returns `true` when the current document differs from the last saved snapshot. */
export function isDirty(): boolean {
  if (!appState.view) return false;
  return appState.view.state.doc.toString() !== appState.cleanSnapshot;
}

/** Snapshots the current document content so future `isDirty()` calls compare against it. */
export function markClean(): void {
  if (!appState.view) return;
  appState.cleanSnapshot = appState.view.state.doc.toString();
}
