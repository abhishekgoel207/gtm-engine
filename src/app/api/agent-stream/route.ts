import { connection } from "next/server";
import { getSteps, subscribe } from "@/lib/agentLog";
import type { AgentStep } from "@/lib/types";

const HEARTBEAT_MS = 15_000;

/** Server-Sent Events stream of new steps. */
export async function GET(request: Request) {
  await connection();
  const lastId = request.headers.get("last-event-id");
  const encoder = new TextEncoder();
  let stop = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      const send = (step: AgentStep) =>
        write(`id: ${step.id}\ndata: ${JSON.stringify(step)}\n\n`);

      let stopped = false;
      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);
      stop = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // The browser already closed it.
        }
      };

      write(": connected\n\n");
      if (lastId) {
        // A reconnecting browser gets what it missed. If its last step is no
        // longer kept, it gets everything (the browser skips repeats).
        const steps = getSteps();
        steps.slice(steps.findIndex((s) => s.id === lastId) + 1).forEach(send);
      }
      if (request.signal.aborted) stop();
      else request.signal.addEventListener("abort", stop, { once: true });
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
