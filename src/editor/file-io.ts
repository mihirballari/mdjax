import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appState, markClean } from "./state";
import { updateTitle } from "./titlebar";

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

export async function saveFile(): Promise<boolean> {
  if (!appState.view) return false;
  if (!appState.filePath) return saveFileAs();

  await writeTextFile(appState.filePath, appState.view.state.doc.toString());
  markClean();
  updateTitle();
  return true;
}

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
