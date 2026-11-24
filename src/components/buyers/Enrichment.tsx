"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { Person } from "@/lib/types";
import type { BuyerRow } from "@/services/buyers";
import { CircleAlert, CircleCheck, CircleHelp, CircleX } from "lucide-react";

export const EMAIL_ICONS = {
  valid: { icon: CircleCheck, color: "text-green-700", label: "Email works" },
  risky: { icon: CircleAlert, color: "text-amber-600", label: "Email is risky" },
  invalid: { icon: CircleX, color: "text-red-700", label: "Email does not work" },
  unknown: { icon: CircleHelp, color: "text-muted-foreground", label: "Email not checked" },
} as const;
const MX = { ok: "Mail server found", no_mx: "No mail server", unknown: "Mail server not checked" };

export function ContactInfo({ person }: { person: Person }) {
  if (!person.email) return null;
  const { icon: Icon, color, label } = EMAIL_ICONS[person.emailStatus ?? "unknown"];
  const how = person.contactSource;
  return (
    <div className="my-1 text-sm">
      <p className="flex items-center gap-1 break-all">
        <Icon className={`size-4 shrink-0 ${color}`} role="img" aria-label={label} data-status={person.emailStatus ?? "unknown"} />
        {person.email}
      </p>
      <p className="text-xs text-muted-foreground">
        {MX[person.mxStatus ?? "unknown"]}{how?.demo && " (sample)"}
        {how && ` · ${how.demo ? "Sample data in" : "Verified by"} ${how.provider}${how.demo ? " format" : ""}, ${how.confidence.toFixed(2)}`}
      </p>
      {person.linkedinUrl && (
        <a className="inline-flex min-h-11 items-center text-blue-700 underline" href={person.linkedinUrl.replace("https://example.com/demo/", "/demo/")} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      )}
    </div>
  );
}

type Short = { needed: number; balance: number };

function useEnrich() {
  const router = useRouter();
  const [short, setShort] = useState<Short | null>(null);
  const enrich = async (leadId: string): Promise<"ok" | "failed" | "short"> => {
    try {
      await api(`/api/leads/${leadId}/enrich`, "POST");
      router.refresh();
      return "ok";
    } catch (error) {
      const e = error as Error & { status?: number; data?: Short };
      if (e.status === 402 && e.data) {
        setShort(e.data);
        return "short";
      }
      toast.error(e.message);
      return "failed";
    }
  };
  return { enrich, short, setShort };
}

function OutOfCredits({ short, close }: { short: Short | null; close: () => void }) {
  const router = useRouter();
  const topUp = async () => {
    try {
      await api("/api/billing/topup", "POST");
      toast.success("Added 500 credits");
      close();
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <Sheet open={short !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="[&>[data-slot=sheet-close]]:size-11">
        <SheetHeader>
          <SheetTitle>You&apos;re out of enrichment credits</SheetTitle>
          <SheetDescription>This needs {short?.needed} credits. You have {short?.balance}.</SheetDescription>
        </SheetHeader>
        <div className="p-4"><Button className="h-12 w-full" onClick={topUp}>Top up 500 (demo)</Button></div>
      </SheetContent>
    </Sheet>
  );
}

export function EnrichButton({ row, canEnrich }: { row: BuyerRow; canEnrich: boolean }) {
  const { enrich, short, setShort } = useEnrich();
  const [busy, setBusy] = useState(false);
  if (row.person.email) return null;
  return (
    <>
      <Button variant="outline" className="my-1 h-11" disabled={busy}
        onClick={async () => { setBusy(true); await enrich(row.lead.id); setBusy(false); }}>
        {busy ? "Looking..." : canEnrich ? "Get contact info" : "Needs credits"}
      </Button>
      <OutOfCredits short={short} close={() => setShort(null)} />
    </>
  );
}

export function EnrichAll({ rows, canEnrich }: { rows: BuyerRow[]; canEnrich: boolean }) {
  const { enrich, short, setShort } = useEnrich();
  const [progress, setProgress] = useState<number | null>(null);
  // One lead per person, Tier A only.
  const todo = [...new Map(rows.filter((r) => r.lead.score.tier === "A" && !r.lead.hidden && !r.person.mxStatus).map((r) => [r.person.id, r])).values()];

  const run = async () => {
    let failed = 0;
    for (const [i, row] of todo.entries()) {
      setProgress(Math.round((i / todo.length) * 100));
      const result = await enrich(row.lead.id);
      if (result === "short") break;
      if (result === "failed") failed++;
    }
    setProgress(null);
    if (failed) toast.error(`${failed} could not be found`);
  };
  if (todo.length === 0 && !short) return null;
  return (
    <div className="mb-3">
      <Button variant="outline" className="h-11" onClick={run} disabled={progress !== null}>
        {canEnrich ? `Get contact info for all Tier A (${todo.length})` : "Needs credits"}
      </Button>
      {progress !== null && <Progress className="mt-2" value={progress} aria-label="Getting contact info" />}
      <OutOfCredits short={short} close={() => setShort(null)} />
    </div>
  );
}
