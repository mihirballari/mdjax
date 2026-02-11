/** @module setup — Assembles all CodeMirror extensions into a single list. */

import { keymap, highlightSpecialChars, drawSelection, EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { headingsPlugin } from "./headings";
import { mathPlugin } from "./math";
import { fileKeymap, titleUpdater } from "./keybindings";

const theme = EditorView.theme({});

/** Returns the full extension stack for the editor. */
export function editorExtensions(): Extension[] {
  return [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown(),
    theme,
    headingsPlugin,
    mathPlugin,
    fileKeymap,
    titleUpdater,
  ];
}
