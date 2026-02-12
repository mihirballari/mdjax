/** @module file-io — File lifecycle: open, save, save-as, and auto-save-on-quit guard. */

import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { documentDir } from "@tauri-apps/api/path";
import { appState, markClean, isDirty } from "./state";
import { updateTitle } from "./titlebar";
import { saveSession } from "./session";

/** Derives a kebab-cased `.md` filename from the first H1, or null if absent/empty. */
function h1Filename(doc: string): string | null {
  const firstLine = doc.split("\n")[0];
  if (!firstLine.startsWith("# ")) return null;
  const slug = firstLine
    .slice(2)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}.md` : null;
}

/** Builds a default save path: ~/Documents/mdjax/<name> */
async function defaultSavePath(doc: string): Promise<string | undefined> {
  try {
    const name = h1Filename(doc) ?? "untitled.md";
    const dir = await documentDir();
    return `${dir}/mdjax/${name}`;
  } catch {
    return undefined;
  }
}

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
  await saveSession(appState.filePath);
}

/** Opens the system file picker filtered to `.md` only, then loads the chosen file. */
export async function openMarkdownFile(): Promise<void> {
  const path = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!path || !appState.view) return;

  const content = await readTextFile(path as string);
  appState.filePath = path as string;
  appState.view.dispatch({
    changes: { from: 0, to: appState.view.state.doc.length, insert: content },
  });
  markClean();
  updateTitle();
  await saveSession(appState.filePath);
}

/** Writes the document to the current file path, or falls through to save-as if none is set. */
export async function saveFile(): Promise<boolean> {
  if (!appState.view) return false;
  if (!appState.filePath) return saveFileAs();

  await writeTextFile(appState.filePath, appState.view.state.doc.toString());
  markClean();
  updateTitle();
  await saveSession(appState.filePath);
  return true;
}

/** Prompts for a new file path, then writes the document to it. */
export async function saveFileAs(): Promise<boolean> {
  if (!appState.view) return false;

  const doc = appState.view.state.doc.toString();
  const path = await save({
    defaultPath: await defaultSavePath(doc),
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!path) return false;

  appState.filePath = path;
  await writeTextFile(path, doc);
  markClean();
  updateTitle();
  await saveSession(path);
  return true;
}

/** Registers a window close-request handler that auto-saves instead of prompting. */
export function installCloseGuard(): void {
  getCurrentWindow().onCloseRequested(async (event) => {
    try {
      if (!isDirty()) {
        if (appState.filePath) await saveSession(appState.filePath);
        return;
      }

      if (appState.filePath) {
        await saveFile();
        return;
      }

      // New unsaved file — derive filename from H1 and prompt save dialog
      const doc = appState.view?.state.doc.toString() ?? "";
      const path = await save({
        defaultPath: await defaultSavePath(doc),
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      });

      if (!path) {
        event.preventDefault();
        return;
      }

      appState.filePath = path;
      await writeTextFile(path, doc);
      markClean();
      await saveSession(path);
    } catch {
      // If anything fails, prevent close so the user doesn't lose work
      event.preventDefault();
    }
  });
}
