/** @module math-widget — CodeMirror WidgetType subclasses for rendered and errored math. */

import { WidgetType } from "@codemirror/view";

/** Replaces a math region with its rendered MathJax SVG. */
export class MathWidget extends WidgetType {
  constructor(
    readonly svg: SVGElement,
    readonly display: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement("span");
    wrapper.className = this.display ? "cm-math-display" : "cm-math-inline";
    wrapper.appendChild(this.svg.cloneNode(true));
    return wrapper;
  }

  eq(other: MathWidget): boolean {
    return (
      this.display === other.display &&
      this.svg.outerHTML === other.svg.outerHTML
    );
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Displays the raw LaTeX source with an error tooltip when MathJax rendering fails. */
export class ErrorMathWidget extends WidgetType {
  constructor(
    readonly tex: string,
    readonly errorMsg: string,
    readonly display: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement("span");
    wrapper.className = this.display
      ? "cm-math-display cm-math-error"
      : "cm-math-inline cm-math-error";
    wrapper.textContent = this.display ? `$$${this.tex}$$` : `$${this.tex}$`;
    wrapper.title = this.errorMsg;
    return wrapper;
  }

  eq(other: ErrorMathWidget): boolean {
    return this.tex === other.tex && this.display === other.display;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
