"use client";

import { Check, MessageCircleQuestion, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { TwinResult } from "@/services/twin";

const REACTION = {
  would_reply: { label: "Would likely reply", className: "bg-good/15 text-good" },
  maybe: { label: "On the fence", className: "bg-warn/15 text-warn" },
  would_ignore: { label: "Might ignore it", className: "bg-bad/15 text-bad" },
};

export function BuyerTwin({ messageId, name, art, busy, onUse }: { messageId: string; name: string; art: string; busy: boolean; onUse: (body: string) => void }) {
  const still = useReducedMotion();
  const [twin, setTwin] = useState<TwinResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const first = name.split(" ")[0];

  const ask = async () => {
    setThinking(true);
    try {
      setTwin(await api<TwinResult>(`/api/messages/${messageId}/twin`, "POST"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setThinking(false);
    }
  };

  if (!twin) {
    return (
      <Button variant="outline" className="mt-3 h-11 w-full border-link/50 text-link" disabled={thinking || busy} onClick={ask}>
        <Sparkles aria-hidden />
        {thinking ? `Reading it as ${first} might...` : "Test on Buyer Twin"}
      </Button>
    );
  }
  const pop = (delay: number) => ({ initial: still ? false : { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35 } }) as const;
  return (
    <section aria-label="Buyer Twin" className="mt-4 rounded-xl border border-link/40 bg-link/5 p-4">
      <div className="flex items-start gap-3">
        <motion.span {...pop(0)} className="shrink-0 rounded-full ring-2 ring-link/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art} alt="" className="size-11 rounded-full" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm"><b>{first}&apos;s twin</b><span className={`rounded-full px-2 py-0.5 text-xs ${REACTION[twin.reaction].className}`}>{REACTION[twin.reaction].label}</span></p>
          <motion.p {...pop(0.15)} className="mt-2 rounded-xl rounded-tl-none bg-secondary p-3">{twin.voice}</motion.p>
          <motion.p {...pop(0.5)} className="mt-2 flex gap-2 rounded-xl rounded-tl-none bg-secondary p-3 font-medium"><MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />{twin.objection}</motion.p>
        </div>
      </div>
      {twin.fix && (
        <motion.div {...pop(0.9)} className="mt-4">
          <p className="text-sm font-medium">Suggested change</p>
          <p className="mt-1 text-sm text-muted-foreground line-through">{twin.fix.original}</p>
          <p className="text-sm text-good">{twin.fix.replacement}</p>
          <p className="mt-1 text-xs text-muted-foreground">{twin.fix.why}</p>
          <Button variant="outline" className="mt-2 h-11 w-full" disabled={busy} onClick={() => twin.fix && onUse(twin.fix.body)}><Check aria-hidden />Use this change</Button>
        </motion.div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {twin.simulated === "claude" ? "Simulated by Claude from their role and the facts above." : "Sample simulation, demo mode."} Not {first}&apos;s real opinion.
      </p>
    </section>
  );
}
