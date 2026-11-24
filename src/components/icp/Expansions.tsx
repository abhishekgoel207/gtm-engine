"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { SourceLinks } from "@/components/SourceLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { Expansion } from "@/lib/types";

const DONE = { accepted: "Accepted", adjusted: "Adjusted and accepted", dismissed: "Dismissed", pending: "" };

export function Expansions({ icpId, expansions }: { icpId: string; expansions: Expansion[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; text: string } | null>(null);

  const run = async (path: string, method: "POST" | "PATCH", body?: unknown) => {
    setBusy(true);
    try {
      await api(path, method, body);
      setAdjusting(null);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const decide = (id: string, decision: string, segment?: string) =>
    run(`/api/expansions/${id}`, "PATCH", { decision, segment });

  return (
    <section className="mt-8" aria-label="Other customers">
      <h2 className="text-lg font-semibold">Other customers you might be missing</h2>
      {expansions.length === 0 && (
        <Button variant="outline" className="mt-3 h-11" disabled={busy} onClick={() => run(`/api/icp/${icpId}/expand`, "POST")}>
          {busy ? "Looking..." : "Suggest more customers"}
        </Button>
      )}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {expansions.map((e) => (
          <article key={e.id} className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <h3 className="mr-auto font-medium">{e.segment}</h3>
              <ConfidenceChip value={e.confidence} why={e.rationale} />
            </div>
            <p className="text-sm">{e.rationale}</p>
            <SourceLinks sources={e.evidence} />
            {e.decision === "pending" ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Button className="h-11" disabled={busy} onClick={() => decide(e.id, "accepted")}>Accept</Button>
                <Button variant="outline" className="h-11" disabled={busy} onClick={() => setAdjusting({ id: e.id, text: e.segment })}>Adjust</Button>
                <Button variant="outline" className="h-11" disabled={busy} onClick={() => decide(e.id, "dismissed")}>Dismiss</Button>
              </div>
            ) : <Badge variant="secondary">{DONE[e.decision]}</Badge>}
          </article>
        ))}
      </div>
      <Sheet open={adjusting !== null} onOpenChange={(open) => !open && setAdjusting(null)}>
        <SheetContent side="bottom" className="[&>[data-slot=sheet-close]]:size-11">
          <SheetHeader>
            <SheetTitle>Adjust this customer type</SheetTitle>
            <SheetDescription>Change the name, then accept it.</SheetDescription>
          </SheetHeader>
          {adjusting && (
            <form className="flex flex-col gap-3 p-4" onSubmit={(e) => { e.preventDefault(); void decide(adjusting.id, "adjusted", adjusting.text); }}>
              <Input aria-label="Customer type" className="h-12 text-base" value={adjusting.text} onChange={(e) => setAdjusting({ ...adjusting, text: e.target.value })} />
              <Button type="submit" className="h-12" disabled={busy || !adjusting.text.trim()}>Accept</Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
