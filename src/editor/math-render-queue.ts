type RenderJob = () => Promise<void>;

const queue: RenderJob[] = [];
let running = false;

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

export function enqueueRender(job: RenderJob): void {
  queue.push(job);
  drain();
}
