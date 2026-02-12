/** @module session — Persists the last-edited file path across app launches. */

import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

/** Writes the given file path to session.json in the app data directory. */
export async function saveSession(filePath: string): Promise<void> {
  const dir = await appDataDir();
  const sessionPath = `${dir}/session.json`;
  const payload = JSON.stringify({ lastFile: filePath });
  try {
    await writeTextFile(sessionPath, payload);
  } catch {
    // Directory might not exist yet — create it and retry
    await mkdir(dir, { recursive: true });
    await writeTextFile(sessionPath, payload);
  }
}

/** Reads session.json and returns the last-edited file path, or null. */
export async function loadSession(): Promise<string | null> {
  try {
    const dir = await appDataDir();
    const sessionPath = `${dir}/session.json`;
    if (!(await exists(sessionPath))) return null;
    const raw = await readTextFile(sessionPath);
    const data = JSON.parse(raw);
    return typeof data.lastFile === "string" ? data.lastFile : null;
  } catch {
    return null;
  }
}
