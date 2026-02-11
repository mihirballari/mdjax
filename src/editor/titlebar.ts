/** @module titlebar — Keeps the native window title in sync with the current file and dirty state. */

import { getCurrentWindow } from "@tauri-apps/api/window";
import { appState, isDirty } from "./state";

/** Sets the window title to `<filename> • mdjax` (dirty) or `<filename> - mdjax` (clean). */
export function updateTitle(): void {
  const filename = appState.filePath
    ? appState.filePath.split("/").pop() ?? "Untitled"
    : "Untitled";
  const indicator = isDirty() ? " \u2022 " : " - ";
  getCurrentWindow().setTitle(`${filename}${indicator}mdjax`);
}
