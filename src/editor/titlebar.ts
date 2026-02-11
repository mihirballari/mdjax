import { getCurrentWindow } from "@tauri-apps/api/window";
import { appState, isDirty } from "./state";

export function updateTitle(): void {
  const filename = appState.filePath
    ? appState.filePath.split("/").pop() ?? "Untitled"
    : "Untitled";
  const indicator = isDirty() ? " \u2022 " : " - ";
  getCurrentWindow().setTitle(`${filename}${indicator}mdjax`);
}
