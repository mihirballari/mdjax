/** @module cursor-utils — Shared cursor-position helpers for editor plugins. */

import { EditorView } from "@codemirror/view";

/**
 * Returns `true` when any selection cursor or range overlaps [from, to].
 * Used by heading and math plugins to keep source visible while the user edits.
 */
export function cursorInRange(view: EditorView, from: number, to: number): boolean {
  const sel = view.state.selection;
  for (const range of sel.ranges) {
    if (range.from <= to && range.to >= from) return true;
  }
  return false;
}
