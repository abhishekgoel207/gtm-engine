"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { BuyerRow } from "@/services/buyers";

export function SequenceButton({ row }: { row: BuyerRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (row.hasMessages || (!row.topSignal && !row.ripple) || row.lead.stage === "won" || row.lead.stage === "lost") return null;
  const write = async () => {
    setBusy(true);
    try {
      await api("/api/sequences", "POST", { leadId: row.lead.id });
      toast.success("Drafts are ready to approve", { action: { label: "Review", onClick: () => router.push("/approve") } });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return <Button variant="outline" className="my-1 h-11" disabled={busy} onClick={write}>{busy ? "Writing..." : row.ripple ? "Write warm messages" : "Write messages"}</Button>;
}
