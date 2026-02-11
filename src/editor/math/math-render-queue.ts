/** @module math-render-queue — Serial async queue that prevents concurrent MathJax renders. */

type RenderJob = () => Promise<void>;

const queue: RenderJob[] = [];
let running = false;

/** Processes queued jobs one at a time until the queue is empty. */
async function drain(): Promise<void> {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      await job();
    } catch (e) {
      console.error("MathJax render error:", e);
    }
  }
  running = false;
}

/** Adds a render job to the queue and starts draining if not already running. */
export function enqueueRender(job: RenderJob): void {
  queue.push(job);
  drain();
}
