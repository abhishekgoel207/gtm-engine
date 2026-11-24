"use client";

import { Brain, Check, Hammer, SearchCheck, ShieldCheck, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { RoomMessage } from "@/services/agents/room";

const STEPS = [
  { name: "Planner", icon: Brain }, { name: "Builder", icon: Hammer }, { name: "Reviewer", icon: SearchCheck },
  { name: "Security", icon: ShieldCheck }, { name: "You", icon: UserRound },
];

/** Who has acted since the rep last spoke, from the real room messages. */
export function AgentTrack({ messages, waiting, busy }: { messages: RoomMessage[]; waiting: boolean; busy: boolean }) {
  const still = useReducedMotion();
  const start = messages.map((m) => m.from).lastIndexOf("rep");
  const acted = new Set(messages.slice(start + 1).map((m) => m.from));
  const status = waiting ? "Waiting for your decision." : busy ? "The agents are working." : acted.size > 0 ? "Finished. Nothing is waiting for you here." : "Ready to start.";
  return (
    <section className="mb-4 rounded-xl border bg-card p-4" aria-label="Agent progress">
      <ol className="flex items-start">
        {STEPS.map(({ name, icon: Icon }, i) => {
          const you = name === "You";
          const on = you ? waiting : acted.has(name);
          const color = on ? (you ? "var(--warn)" : "var(--s1)") : "var(--secondary)";
          return (
            <li key={name} className="relative flex flex-1 flex-col items-center gap-2 text-center text-xs">
              {i > 0 && <motion.span className="absolute top-[22px] right-1/2 h-0.5 w-full" animate={{ backgroundColor: on ? color : "var(--hair)" }} />}
              <motion.span
                className="relative z-10 flex size-11 items-center justify-center rounded-full"
                style={{ background: color, color: on ? "#03110E" : "var(--foreground)" }}
                animate={you && waiting && !still ? { boxShadow: ["0 0 0 0 rgb(242 178 76 / 0.6)", "0 0 0 14px rgb(242 178 76 / 0)"] } : { boxShadow: "0 0 0 0 rgb(0 0 0 / 0)" }}
                transition={you && waiting && !still ? { repeat: Infinity, duration: 1.6 } : undefined}
              >
                {on && !you ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
              </motion.span>
              {name}<span className="sr-only">{on ? (you ? ", your turn" : ", done") : ""}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">{status}</p>
    </section>
  );
}
