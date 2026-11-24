"use client";

import { CalendarDays, Handshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RippleMap } from "./RippleMap";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { RippleStatus, RippleView as View } from "@/services/ripple";

const STATUS: Record<RippleStatus, string> = {
  in_gtm: "bg-good/15 text-good", ready: "bg-link/15 text-link", no_fit: "bg-secondary text-muted-foreground", blocked: "bg-bad/15 text-bad",
};

const BLANK = { name: "", title: "", companyName: "", website: "", email: "", linkedinUrl: "", note: "", rows: "" };

export function RippleView({ view }: { view: View }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"one" | "list">("one");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ ...BLANK, owner: "Alex Rep", team: "sales", origin: "event", eventName: "", industry: view.industries[0], region: view.regions[0], okToContact: false, okToMention: true });
  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const run = async (work: () => Promise<string>) => {
    setBusy(true);
    try {
      toast.success(await work());
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const share = () =>
    run(async () => {
      const { rows, name, title, companyName, website, email, linkedinUrl, note, ...shared } = form;
      const event = { ...shared, eventName: shared.origin === "event" ? shared.eventName : "" };
      let done: string;
      if (mode === "list") {
        const r = await api<{ added: number; duplicates: number; problems: string[] }>("/api/ripple", "POST", { ...event, rows });
        if (r.problems.length > 0) toast.error(`${r.problems.length} skipped. ${r.problems[0]}`);
        done = `Shared ${r.added} contacts. ${r.duplicates} already here.`;
      } else {
        const r = await api<{ duplicate: boolean; contact: { owner: string } }>("/api/ripple", "POST", { ...event, name, title, companyName, website, email, linkedinUrl, note });
        done = r.duplicate ? `Already shared by ${r.contact.owner}` : "Contact shared";
      }
      setForm((f) => ({ ...f, ...BLANK, okToContact: false }));
      setOpen(false);
      return done;
    });

  const field = (key: "name" | "title" | "companyName" | "website" | "email" | "linkedinUrl" | "note" | "owner" | "eventName", label: string, type = "text") => (
    <label className="block text-sm">{label}<Input className="mt-1 h-11 text-base" type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} /></label>
  );
  const pick = (key: "team" | "origin" | "industry" | "region", label: string, options: [string, string][]) => (
    <label className="block text-sm">{label}
      <select className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base" value={form[key]} onChange={(e) => set(key, e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );
  const check = (key: "okToContact" | "okToMention", label: string) => (
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />{label}</label>
  );

  const owners = [...new Set(view.contacts.map((c) => c.contact.owner))].sort();
  const shown = view.contacts.filter(({ contact: c }) => !filter || c.owner === filter || (c.eventName ?? "Personal network") === filter);

  return (
    <>
      {view.contacts.length > 0 && <RippleMap view={view} picked={filter} onPick={(owner) => setFilter(filter === owner ? "" : owner)} />}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant="outline" className="h-11" onClick={() => setOpen(true)}>Share a contact</Button>
        <select aria-label="Filter" className="h-11 max-w-full rounded-lg border bg-background px-3 text-base" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Everyone</option>
          {[...owners, ...view.events.map((e) => e.name)].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      {view.contacts.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No shared contacts yet. Share someone you met.</p>}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {shown.map(({ contact: c, status, text, leadId, art }) => (
          <li key={c.id} id={c.id} data-status={status} className="scroll-mt-20 rounded-xl border bg-card p-4 target:border-link">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="" className="size-12 rounded-xl" />
              <div className="min-w-0">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.title}, {c.companyName}</p>
              </div>
            </div>
            {c.email && <p className="text-sm break-all">{c.email}</p>}
            <p className="mt-2 flex items-start gap-2 text-sm">{c.origin === "event" ? <CalendarDays className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> : <Handshake className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}<span>Owner: <b>{c.owner}</b> ({c.team}). {c.origin === "event" ? `Met at ${c.eventName}.` : "Knows them."}</span></p>
            {c.note && <p className="text-sm text-muted-foreground">Private note: {c.note}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs ${STATUS[status]}`}>{text}</span>{leadId && status === "in_gtm" && <Link className="inline-flex min-h-11 items-center text-sm text-link underline" href={`/activity?lead=${leadId}`}>See activity</Link>}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5" checked={c.okToContact} disabled={busy} onChange={(e) => run(async () => { await api(`/api/ripple/${c.id}`, "PATCH", { okToContact: e.target.checked }); return "Saved"; })} />OK to contact</label>
              <Button variant="ghost" className="h-11" disabled={busy || !c.okToContact} onClick={() => setRemoving({ id: c.id, name: c.name })}>Remove</Button>
            </div>
          </li>
        ))}
      </ul>
      <StickyAction>
        <Button disabled={busy || view.contacts.length === 0} onClick={() => run(async () => {
          const r = await api<{ added: number; linked: number }>("/api/ripple/match", "POST");
          return `Added ${r.added} to GTM. ${r.linked} were already there.`;
        })}>Match to GTM</Button>
      </StickyAction>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto [&>[data-slot=sheet-close]]:size-11">
          <SheetHeader><SheetTitle>Share with your team</SheetTitle><SheetDescription>One person, or a list from an event.</SheetDescription></SheetHeader>
          <form className="mx-auto w-full max-w-xl space-y-3 px-4 pb-6" onSubmit={(e) => { e.preventDefault(); void share(); }}>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" className="h-11" variant={mode === "one" ? "default" : "outline"} aria-pressed={mode === "one"} onClick={() => setMode("one")}>One person</Button>
              <Button type="button" className="h-11" variant={mode === "list" ? "default" : "outline"} aria-pressed={mode === "list"} onClick={() => setMode("list")}>Event list</Button>
            </div>
            {mode === "one" ? (
              <>{field("name", "Name")}{field("title", "Job title")}{field("companyName", "Company")}{field("email", "Work email", "email")}{field("website", "Company website (if no work email)")}{field("linkedinUrl", "LinkedIn link (optional)", "url")}{field("note", "Private note (never put in messages)")}</>
            ) : (
              <label className="block text-sm">One per line: name, title, company, work email<Textarea className="mt-1 min-h-32 text-base" value={form.rows} onChange={(e) => set("rows", e.target.value)} /></label>
            )}
            <div className="grid grid-cols-2 gap-2">{field("owner", "Contact owner")}{pick("team", "Team", [["sales", "Sales"], ["marketing", "Marketing"]])}</div>
            <div className="grid grid-cols-2 gap-2">{pick("industry", "Industry", view.industries.map((i) => [i, i]))}{pick("region", "Region", view.regions.map((r) => [r, r]))}</div>
            {pick("origin", "How do you know them?", [["event", "Met at an event"], ["colleague", "I know them"]])}
            {form.origin === "event" && field("eventName", "Event name")}
            {check("okToContact", mode === "one" ? "They are OK with being contacted" : "Everyone here is OK with being contacted")}
            {check("okToMention", "Messages may mention the owner's name")}
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>Share</Button>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader><DialogTitle>Remove {removing?.name}?</DialogTitle><DialogDescription>Unsent messages to them stop. This can&apos;t be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setRemoving(null)}>Keep</Button>
            <Button className="h-12" onClick={() => { const id = removing?.id; setRemoving(null); if (id) void run(async () => { await api(`/api/ripple/${id}`, "DELETE"); return "Removed"; }); }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
