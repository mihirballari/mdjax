/** @module math-cache — In-memory SVG cache keyed by LaTeX source and display mode. */

const cache = new Map<string, SVGElement>();

/** Produces a display/inline-prefixed key for the cache map. */
function cacheKey(tex: string, display: boolean): string {
  return `${display ? "D" : "I"}:${tex}`;
}

/** Returns a cloned SVG for the given LaTeX, or `null` on cache miss. */
export function getCached(tex: string, display: boolean): SVGElement | null {
  const svg = cache.get(cacheKey(tex, display));
  return svg ? svg.cloneNode(true) as SVGElement : null;
}

/** Stores a cloned SVG in the cache. */
export function setCached(tex: string, display: boolean, svg: SVGElement): void {
  cache.set(cacheKey(tex, display), svg.cloneNode(true) as SVGElement);
}

/** Returns the number of entries currently in the cache. */
export function cacheSize(): number {
  return cache.size;
}

/** Evicts the oldest entries until the cache size is at most `maxSize`. */
export function evictOldest(maxSize: number): void {
  if (cache.size <= maxSize) return;
  const keys = cache.keys();
  while (cache.size > maxSize) {
    const next = keys.next();
    if (next.done) break;
    cache.delete(next.value);
  }
}
