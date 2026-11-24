"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useThinking } from "@/components/AgentThinking";
import { Button } from "@/components/ui/button";

/** Development only. */
export function TestStreamButton() {
  const { setOpen } = useThinking();
  const [running, setRunning] = useState(false);

  const run = async () => {
    setOpen(true);
    setRunning(true);
    try {
      const response = await fetch("/api/dev/test-stream", { method: "POST" });
      if (!response.ok) throw new Error();
    } catch {
      toast.error("The test stream failed. Try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button className="mt-6 h-12 w-full text-base md:w-60" onClick={run} disabled={running}>
      {running ? "Streaming..." : "Test stream"}
    </Button>
  );
}
