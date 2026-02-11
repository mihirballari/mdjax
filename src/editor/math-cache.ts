const cache = new Map<string, SVGElement>();

function cacheKey(tex: string, display: boolean): string {
  return `${display ? "D" : "I"}:${tex}`;
}

export function getCached(tex: string, display: boolean): SVGElement | null {
  const svg = cache.get(cacheKey(tex, display));
  return svg ? svg.cloneNode(true) as SVGElement : null;
}

export function setCached(tex: string, display: boolean, svg: SVGElement): void {
  cache.set(cacheKey(tex, display), svg.cloneNode(true) as SVGElement);
}

export function cacheSize(): number {
  return cache.size;
}

export function evictOldest(maxSize: number): void {
  if (cache.size <= maxSize) return;
  const keys = cache.keys();
  while (cache.size > maxSize) {
    const next = keys.next();
    if (next.done) break;
    cache.delete(next.value);
  }
}
