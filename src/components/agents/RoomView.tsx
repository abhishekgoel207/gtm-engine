"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useThinking } from "@/components/AgentThinking";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Approval, RoomMessage } from "@/services/agents/room";

const COLORS: Record<string, string> = { Planner: "bg-blue-100 text-blue-900", Builder: "bg-green-100 text-green-900", Reviewer: "bg-amber-100 text-amber-900", Security: "bg-red-100 text-red-900", rep: "bg-foreground text-background" };

export interface Telemetry { agent: string; input: number; output: number; cost: number; messages: number }

export function RoomView({ messages, approvals, telemetry, estimated }: { messages: RoomMessage[]; approvals: Approval[]; telemetry: Telemetry[]; estimated: boolean }) {
  const router = useRouter();
  const { setOpen } = useThinking();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const call = async (path: string, body: unknown, after?: () => void) => {
    setBusy(true);
    try {
      await api(path, "POST", body);
      after?.();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      router.refresh();
      setBusy(false);
    }
  };
  const total = telemetry.reduce((sum, t) => sum + t.cost, 0);

  return (
    <>
      <details className="mb-4 rounded-xl border">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-medium">
          Cost so far ${total.toFixed(4)}{estimated && " (estimated, demo mode)"}
        </summary>
        <ul className="divide-y border-t text-sm">
          {telemetry.map((t) => <li key={t.agent} className="px-4 py-2">{t.agent}: {t.input} tokens in, {t.output} out, ${t.cost.toFixed(4)}, {t.messages} messages</li>)}
        </ul>
      </details>
      {approvals.filter((a) => a.status === "pending").map((a) => (
        <article key={a.id} aria-label="Approval needed" className="mb-4 rounded-xl border-2 border-amber-500 p-4">
          <p className="font-semibold">{a.text}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" disabled={busy} onClick={() => call(`/api/agents/approvals/${a.id}`, { approve: false })}>Deny</Button>
            <Button className="h-12" disabled={busy} onClick={() => call(`/api/agents/approvals/${a.id}`, { approve: true })}>Approve</Button>
          </div>
        </article>
      ))}
      <ol aria-label="Agent room" className="flex flex-col gap-3">
        {messages.length === 0 && <li className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Run the plan to see the agents work together.</li>}
        {messages.map((m) => (
          <li key={m.id} data-from={m.from} className="flex gap-3">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${COLORS[m.from] ?? "bg-muted"}`} aria-hidden>{m.from[0].toUpperCase()}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{m.from === "rep" ? "You" : m.from} <time className="font-normal text-muted-foreground">{m.ts.slice(11, 19)} UTC</time></p>
              <p className="break-words">{m.text.split(/(@\w+)/).map((part, i) => part.startsWith("@") ? <strong key={i} className="text-blue-700">{part}</strong> : part)}</p>
            </div>
          </li>
        ))}
      </ol>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void call("/api/agents/post", { text }, () => setText("")); }}>
        <Input aria-label="Message an agent" placeholder="@Reviewer check the drafts" className="h-12 text-base" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" variant="outline" className="h-12" disabled={busy || !text.trim()}>Post</Button>
      </form>
      <StickyAction><Button disabled={busy} onClick={() => { setOpen(window.innerWidth >= 768); void call("/api/agents/run", {}); }}>{busy ? "Working..." : "Run full GTM plan"}</Button></StickyAction>
    </>
  );
}
