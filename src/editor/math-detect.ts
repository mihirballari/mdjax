import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

export interface MathRegion {
  from: number;
  to: number;
  tex: string;
  display: boolean;
}

function isInsideCode(state: EditorState, from: number, to: number): boolean {
  const tree = syntaxTree(state);
  let inside = false;
  tree.iterate({
    from,
    to,
    enter(node) {
      if (
        node.name === "FencedCode" ||
        node.name === "InlineCode" ||
        node.name === "CodeBlock" ||
        node.name === "CodeText"
      ) {
        inside = true;
        return false;
      }
    },
  });
  return inside;
}

export function detectMathRegions(
  state: EditorState,
  rangeFrom: number,
  rangeTo: number
): MathRegion[] {
  const text = state.doc.toString();
  const regions: MathRegion[] = [];
  const slice = text.slice(rangeFrom, rangeTo);

  // Match $$...$$ (display) and $...$ (inline)
  // Display math first to avoid $$ being parsed as two inline $
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^\s$](?:[^$]*[^\s$])?)\$/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(slice)) !== null) {
    const absIndex = rangeFrom + match.index;

    // Skip escaped dollars: check for \ before the $
    if (absIndex > 0 && text[absIndex - 1] === "\\") continue;

    const display = match[1] !== undefined;
    const tex = display ? match[1] : match[2];
    const from = absIndex;
    const to = from + match[0].length;

    if (tex.trim().length === 0) continue;

    // Skip if inside a code block or inline code
    if (isInsideCode(state, from, to)) continue;

    regions.push({ from, to, tex: tex.trim(), display });
  }

  return regions;
}
