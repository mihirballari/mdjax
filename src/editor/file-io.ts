/** @module file-io — File lifecycle: open, save, save-as, and unsaved-changes guard. */

import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { appState, markClean, isDirty } from "./state";
import { updateTitle } from "./titlebar";

/** Prompts the user to pick a Markdown file, then loads it into the editor. */
export async function openFile(): Promise<void> {
  const path = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!path || !appState.view) return;

  const content = await readTextFile(path as string);
  appState.filePath = path as string;
  appState.view.dispatch({
    changes: { from: 0, to: appState.view.state.doc.length, insert: content },
  });
  markClean();
  updateTitle();
}

/** Writes the document to the current file path, or falls through to save-as if none is set. */
export async function saveFile(): Promise<boolean> {
  if (!appState.view) return false;
  if (!appState.filePath) return saveFileAs();

  await writeTextFile(appState.filePath, appState.view.state.doc.toString());
  markClean();
  updateTitle();
  return true;
}

/** Prompts for a new file path, then writes the document to it. */
export async function saveFileAs(): Promise<boolean> {
  const path = await save({
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!path || !appState.view) return false;

  appState.filePath = path;
  await writeTextFile(path, appState.view.state.doc.toString());
  markClean();
  updateTitle();
  return true;
}

/** Registers a window close-request handler that prompts when there are unsaved changes. */
export function installCloseGuard(): void {
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
}
