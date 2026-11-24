"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useThinking } from "@/components/AgentThinking";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function RunButton() {
  const router = useRouter();
  const { setOpen } = useThinking();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setOpen(true);
    try {
      const r = await api<{ evaluations: unknown[]; displacement: unknown[] }>("/api/graph/run", "POST");
      toast.success(`${r.evaluations.length} evaluating now, ${r.displacement.length} to win from a competitor`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return <StickyAction><Button disabled={busy} onClick={run}>{busy ? "Searching..." : "Search connections"}</Button></StickyAction>;
}
