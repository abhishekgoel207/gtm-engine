"use client";

import { Bot, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TierBadge } from "@/components/buyers/TierBadge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { RippleBadge } from "@/components/ripple/RippleBadge";
import { STAGE_FILL, StageBar } from "@/components/visual/StageBar";
import { cn } from "@/lib/utils";
import type { Board } from "@/services/pipeline";
import type { Lead } from "@/lib/types";

export function BoardView({ board }: { board: Board }) {
  const router = useRouter();
  const [over, setOver] = useState<string | null>(null);

  const move = async (id: string, stage: Lead["stage"], undoTo?: Lead["stage"]) => {
    try {
      await api(`/api/leads/${id}/move`, "POST", { stage });
      if (undoTo) toast("Moved", { action: { label: "Undo", onClick: () => void move(id, undoTo) } });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
    <StageBar board={board} />
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:gap-2 md:px-0">
      {board.map(({ stage, label, cards, value }) => (
        <section
          key={stage}
          aria-label={label}
          style={{ borderTopColor: STAGE_FILL[stage] }}
          className={cn("w-[85%] shrink-0 snap-center rounded-xl border-t-4 bg-muted/50 p-3 md:w-auto md:p-2", over === stage && "ring-2 ring-ring")}
          onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            setOver(null);
            const [id, from] = e.dataTransfer.getData("text/plain").split("|");
            if (id && from !== stage) void move(id, stage, from as Lead["stage"]);
          }}
        >
          <h2 className="font-semibold">{label} <span className="text-muted-foreground">{cards.length}</span></h2>
          <p className="mb-2 text-sm text-muted-foreground">${value.toLocaleString("en-US")}</p>
          <ul className="flex flex-col gap-2">
            {cards.map(({ lead, company, person, lastActivity, ripple }) => (
              <li key={lead.id} data-lead={lead.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", `${lead.id}|${stage}`)}
                className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{person}</p>
                    <p className="text-muted-foreground">{company}</p>
                  </div>
                  <TierBadge tier={lead.score.tier} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Score {lead.score.total}{lastActivity && `. Last activity ${lastActivity.slice(0, 10)}`}</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs" data-owner={lead.owner}>
                  {lead.owner === "ai" ? <><Bot className="size-3" aria-hidden /> AI</> : <><UserRound className="size-3" aria-hidden /> Rep: Alex</>}
                </p>
                {ripple && <RippleBadge owner={ripple} />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" className="mt-2 h-11 w-full">Move to...</Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {board.filter((b) => b.stage !== stage).map((b) => (
                      <DropdownMenuItem key={b.stage} className="min-h-11" onSelect={() => move(lead.id, b.stage, stage)}>{b.label}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link className="inline-flex min-h-11 items-center text-sm underline" href={`/activity?lead=${lead.id}`}>Activity</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
    </>
  );
}
