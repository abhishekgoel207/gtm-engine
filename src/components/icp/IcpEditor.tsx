"use client";

import { Check, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { ICP, Scored } from "@/lib/types";

type Section = "industries" | "headcountTiers" | "revenueBands" | "personas" | "triggers";
type Item = Scored<unknown>;

// How each section's value is shown, and changed when the rep edits its label.
const SECTIONS: { key: Section; title: string; help?: string; label: (v: never) => string; edit: (v: never | undefined, label: string) => unknown }[] = [
  { key: "industries", title: "Industries", label: (v: { label: string }) => v.label, edit: (v: { naics: string } | undefined, label) => ({ label, naics: v?.naics ?? "not set" }) },
  { key: "headcountTiers", title: "Company size", help: "Number of people", label: (v: string) => v, edit: (_v, label) => label },
  { key: "revenueBands", title: "Revenue", label: (v: string) => v, edit: (_v, label) => label },
  { key: "personas", title: "Buyers", label: (v: { title: string }) => v.title, edit: (v: { function: string; seniority: string } | undefined, title) => ({ title, function: v?.function ?? "Other", seniority: v?.seniority ?? "other" }) },
  { key: "triggers", title: "Buying triggers", help: "Events that make people buy", label: (v: { label: string }) => v.label, edit: (v: { type: string } | undefined, label) => ({ type: v?.type ?? "other", label }) },
];

export function IcpEditor({ icp: initial }: { icp: ICP }) {
  const router = useRouter();
  const [icp, setIcp] = useState(initial);
  const [editing, setEditing] = useState<{ key: Section; index: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (patch: Record<string, unknown>, undo?: Record<string, unknown>) => {
    setBusy(true);
    try {
      setIcp(await api<ICP>(`/api/icp/${icp.id}`, "PATCH", patch));
      if (undo) toast("Removed", { action: { label: "Undo", onClick: () => void save(undo) } });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const commit = (edit: (v: never | undefined, label: string) => unknown) => {
    if (!editing) return;
    const text = editing.text.trim();
    const items = icp[editing.key] as Item[];
    setEditing(null);
    if (!text) return;
    const old = items[editing.index];
    const item: Item = old
      ? { ...old, value: edit(old.value as never, text) }
      : { value: edit(undefined, text), confidence: 1, why: "You added this.", sources: [] };
    void save({ [editing.key]: old ? items.map((x, i) => (i === editing.index ? item : x)) : [...items, item] });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map(({ key, title, help, label, edit }) => {
          const items = icp[key] as Item[];
          const input = editing?.key === key && (
            <form className="flex gap-2 py-1" onSubmit={(e) => { e.preventDefault(); commit(edit); }}>
              <Input autoFocus aria-label={`${title} name`} className="h-11 text-base" value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
              <Button type="submit" className="size-11" aria-label="Save"><Check aria-hidden /></Button>
            </form>
          );
          return (
            <section key={key} aria-label={title} className="rounded-xl border bg-card p-4">
              <h2 className="font-semibold">{title}</h2>
              {help && <p className="text-sm text-muted-foreground">{help}</p>}
              <ul className="mt-2 divide-y">
                {items.map((item, index) => {
                  const text = label(item.value as never);
                  return (
                    <li key={index}>
                      {editing?.key === key && editing.index === index ? input : (
                        <div className="flex min-h-12 items-center gap-1">
                          <span className="mr-auto min-w-0 break-words">
                            {text}
                            {key === "industries" && <span className="ml-1 text-xs text-muted-foreground">NAICS {(item.value as { naics: string }).naics}</span>}
                          </span>
                          <ConfidenceChip value={item.confidence} why={item.why} />
                          <Button variant="ghost" className="size-11" disabled={busy} aria-label={`Edit ${text}`} onClick={() => setEditing({ key, index, text })}><Pencil aria-hidden /></Button>
                          <Button variant="ghost" className="size-11" disabled={busy} aria-label={`Remove ${text}`}
                            onClick={() => save({ [key]: items.filter((_, i) => i !== index) }, { [key]: items })}><X aria-hidden /></Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {editing?.key === key && editing.index === items.length ? input : (
                <Button variant="ghost" className="mt-1 h-11" disabled={busy} onClick={() => setEditing({ key, index: items.length, text: "" })}>
                  <Plus aria-hidden /> Add
                </Button>
              )}
            </section>
          );
        })}
      </div>
      <StickyAction>
        {icp.status === "approved" ? (
          <Button onClick={() => router.push("/buyers")}>Approved. Find buyers</Button>
        ) : (
          <Button disabled={busy} onClick={() => save({ status: "approved" })}>Looks right, approve</Button>
        )}
      </StickyAction>
    </>
  );
}
