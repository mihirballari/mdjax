declare global {
  interface Window {
    MathJax?: {
      startup: { promise: Promise<void> };
      tex2svgPromise?: (tex: string, options?: { display: boolean }) => Promise<HTMLElement>;
    };
  }
}

let ready: Promise<void> | null = null;

export function ensureMathJaxReady(): Promise<void> {
  if (ready) return ready;
  ready = new Promise<void>((resolve) => {
    const check = () => {
      if (window.MathJax && window.MathJax.tex2svgPromise) {
        window.MathJax.startup.promise.then(resolve);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
  return ready;
}

export async function renderLatex(tex: string, display: boolean): Promise<SVGElement> {
  await ensureMathJaxReady();
  const wrapper = await window.MathJax!.tex2svgPromise!(tex, { display });
  const svg = wrapper.querySelector("svg");
  if (!svg) throw new Error("MathJax produced no SVG");
  return svg as unknown as SVGElement;
}
