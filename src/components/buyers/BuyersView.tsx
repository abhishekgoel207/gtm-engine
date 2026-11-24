"use client";

import { ChevronDown, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useThinking } from "@/components/AgentThinking";
import { SourceLink, SourceLinks } from "@/components/SourceLinks";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { STAGE_LABELS } from "@/lib/labels";
import { sourceHref } from "@/lib/sourceHref";
import type { BuyerRow } from "@/services/buyers";
import { ContactInfo, EnrichAll, EnrichButton } from "./Enrichment";
import { SequenceButton } from "./SequenceButton";
import { ScoreRing } from "@/components/visual/ScoreRing";
import { SignalChip } from "@/components/visual/SignalChip";
import { TierBadge } from "./TierBadge";

const SORTS = {
  score: { label: "Score", by: (a: BuyerRow, b: BuyerRow) => b.lead.score.total - a.lead.score.total },
  company: { label: "Company", by: (a: BuyerRow, b: BuyerRow) => a.company.name.localeCompare(b.company.name) },
  stage: { label: "Stage", by: (a: BuyerRow, b: BuyerRow) => a.lead.stage.localeCompare(b.lead.stage) },
};

export function BuyersView({ rows, icpId, icpApproved, canEnrich }: { rows: BuyerRow[]; icpId?: string; icpApproved: boolean; canEnrich: boolean }) {
  const router = useRouter();
  const { setOpen } = useThinking();
  const [tier, setTier] = useState<"A" | "B" | "C" | null>(null);
  const [sort, setSort] = useState<keyof typeof SORTS>("score");
  const [search, setSearch] = useState("");
  const [finding, setFinding] = useState(false);

  const hidden = rows.filter((r) => r.lead.hidden);
  const visible = rows
    .filter((r) => !r.lead.hidden && (!tier || r.lead.score.tier === tier))
    .filter((r) => `${r.company.name} ${r.person.name} ${r.person.title}`.toLowerCase().includes(search.toLowerCase()))
    .sort(SORTS[sort].by);

  const find = async () => {
    if (!icpId || !icpApproved) return router.push(icpId ? "/icp" : "/start");
    setFinding(true);
    setOpen(true);
    try {
      const { added, hidden } = await api<{ added: number; hidden: number }>("/api/discover", "POST", { icpId });
      toast.success(`Found ${added} new buyers. ${hidden} hidden.`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setFinding(false);
    }
  };

  const showAnyway = async (id: string) => {
    try {
      await api(`/api/leads/${id}`, "PATCH", { action: "show" });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <TierSpread rows={rows} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input aria-label="Search buyers" placeholder="Search" className="h-11 text-base md:w-60" value={search} onChange={(e) => setSearch(e.target.value)} />
        {(["A", "B", "C"] as const).map((t) => (
          <Button key={t} variant={tier === t ? "default" : "outline"} className="h-11 px-4" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)}>
            Tier {t}
          </Button>
        ))}
        <select aria-label="Sort by" className="h-11 rounded-lg border bg-background px-3 text-base" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}>
          {Object.entries(SORTS).map(([key, { label }]) => <option key={key} value={key}>Sort: {label}</option>)}
        </select>
      </div>
      <EnrichAll rows={rows} canEnrich={canEnrich} />

      <div className="flex flex-col gap-3 md:hidden">
        {visible.map((row) => <BuyerCard key={row.lead.id} row={row} canEnrich={canEnrich} />)}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="text-xs [&_td]:p-1.5 [&_td]:whitespace-normal [&_th]:px-1.5">
          <TableHeader>
            <TableRow>
              {["Company", "Buyer", "Title", "Score", "Contact", "Top signal", "Sources", "Stage"].map((h) => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const { lead, company, person, topSignal, sources } = row;
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Cited href={company.sources[0].url}>{company.name}</Cited>
                    <span className="block text-xs text-muted-foreground">{company.hq}</span>
                  </TableCell>
                  <TableCell><span className="flex items-center gap-2"><Avatar src={row.art} small /><Cited href={person.sources[0].url}>{person.name}</Cited></span></TableCell>
                  <TableCell>{person.title}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger className="flex min-h-11 items-center gap-2" aria-label="Why this lead">
                        <ScoreRing {...lead.score} size={44} />
                        <TierBadge tier={lead.score.tier} />
                      </PopoverTrigger>
                      <PopoverContent className="w-80"><Reasons row={row} /></PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="max-w-44"><ContactInfo person={person} /><EnrichButton row={row} canEnrich={canEnrich} /></TableCell>
                  <TableCell className="max-w-40">
                    {topSignal && <Cited href={topSignal.source.url}>{topSignal.summary}</Cited>}
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger className="min-h-11 rounded-full px-2 underline">{sources.length}<span className="sr-only"> sources</span></PopoverTrigger>
                      <PopoverContent className="w-80"><SourceLinks sources={sources} /></PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>{STAGE_LABELS[lead.stage]}<SequenceButton row={row} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {visible.length === 0 && <p className="p-8 text-center text-muted-foreground">No buyers match.</p>}

      {hidden.length > 0 && (
        <details className="mt-4 rounded-xl border bg-card">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Hidden ({hidden.length}): why?</summary>
          <ul className="divide-y border-t">
            {hidden.map(({ lead, company, person }) => (
              <li key={lead.id} className="flex items-center gap-2 px-4 py-2">
                <p className="mr-auto text-sm"><span className="font-medium">{person.name}, {company.name}.</span> {lead.hidden?.reason}</p>
                <Button variant="outline" className="h-11" onClick={() => showAnyway(lead.id)}>Show anyway</Button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <StickyAction>
        <Button onClick={find} disabled={finding}>{finding ? "Finding buyers..." : "Find buyers"}</Button>
      </StickyAction>
    </>
  );
}

const TIER_FILL = { A: "var(--good)", B: "var(--warn)", C: "var(--bad)" };

function TierSpread({ rows }: { rows: BuyerRow[] }) {
  const open = rows.filter((r) => !r.lead.hidden);
  const counts = (["A", "B", "C"] as const).map((tier) => ({ tier, n: open.filter((r) => r.lead.score.tier === tier).length })).filter((c) => c.n > 0);
  if (open.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex h-2 gap-0.5" role="img" aria-label={counts.map((c) => `${c.n} in tier ${c.tier}`).join(", ")}>
        {counts.map((c) => <span key={c.tier} className="rounded-full" style={{ flex: c.n, background: TIER_FILL[c.tier] }} />)}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{open.length} leads: {counts.map((c) => `${c.n} tier ${c.tier}`).join(", ")}. Rings show fit (outer) and intent (inner).</p>
    </div>
  );
}

function Cited({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={sourceHref(href)} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4">
      {children} <Link2 className="inline size-3 text-link" aria-label="source" />
    </a>
  );
}

function Avatar({ src, small }: { src: string; small?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={small ? "size-8 rounded-lg" : "size-12 rounded-xl"} />;
}

function Reasons({ row }: { row: BuyerRow }) {
  return (
    <div className="text-sm">
      <p className="font-medium">Fit {row.lead.score.fit} of 60, intent {row.lead.score.intent} of 40</p>
      <ul className="my-2 list-disc space-y-1 pl-5">{row.lead.score.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      <SourceLinks sources={row.sources} />
    </div>
  );
}

function BuyerCard({ row, canEnrich }: { row: BuyerRow; canEnrich: boolean }) {
  const { lead, company, person, topSignal } = row;
  return (
    <article data-lead={lead.id} className="rounded-xl border bg-card p-4 shadow-lg shadow-black/20">
      <div className="flex items-start gap-3">
        <Avatar src={row.art} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold"><Cited href={person.sources[0].url}>{person.name}</Cited></h2>
          <p className="text-sm text-muted-foreground">{person.title} at <Cited href={company.sources[0].url}>{company.name}</Cited></p>
          <p className="text-sm text-muted-foreground">{[company.hq, STAGE_LABELS[lead.stage]].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-col items-center gap-1"><ScoreRing {...lead.score} size={60} /><TierBadge tier={lead.score.tier} /></div>
      </div>
      {topSignal && <SignalChip type={topSignal.type} />}
      {topSignal && <SourceLink source={topSignal.source} label={topSignal.summary} />}
      <ContactInfo person={person} />
      <EnrichButton row={row} canEnrich={canEnrich} />
      <SequenceButton row={row} />
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-sm font-medium">Why this lead <ChevronDown className="size-4" aria-hidden /></summary>
        <Reasons row={row} />
      </details>
    </article>
  );
}
