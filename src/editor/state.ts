import { EditorView } from "@codemirror/view";

export interface AppState {
  filePath: string | null;
  cleanSnapshot: string;
  view: EditorView | null;
}

export const appState: AppState = {
  filePath: null,
  cleanSnapshot: "",
  view: null,
};

export function isDirty(): boolean {
  if (!appState.view) return false;
  return appState.view.state.doc.toString() !== appState.cleanSnapshot;
}

export function markClean(): void {
  if (!appState.view) return;
  appState.cleanSnapshot = appState.view.state.doc.toString();
}
