/** @module titlebar — Keeps the native window title in sync with the current file and dirty state. */

import { getCurrentWindow } from "@tauri-apps/api/window";
import { appState, isDirty } from "./state";

/** Derives a display name from the first H1 line, or null if absent/empty. */
function h1DisplayName(): string | null {
  if (!appState.view) return null;
  const firstLine = appState.view.state.doc.lineAt(1).text;
  if (!firstLine.startsWith("# ")) return null;
  const title = firstLine.slice(2).trim();
  return title || null;
}

/** Sets the window title to `<filename> • mdjax` (dirty) or `<filename> - mdjax` (clean). */
export function updateTitle(): void {
  const filename = appState.filePath
    ? appState.filePath.split("/").pop() ?? "Untitled"
    : h1DisplayName() ?? "Untitled";
  const indicator = isDirty() ? " \u2022 " : " - ";
  getCurrentWindow().setTitle(`${filename}${indicator}mdjax`);
}
