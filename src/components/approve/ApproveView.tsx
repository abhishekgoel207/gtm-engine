"use client";

import { Linkedin, Mail } from "./icons";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { TierBadge } from "@/components/buyers/TierBadge";
import { RippleBadge } from "@/components/ripple/RippleBadge";
import { SourceLink } from "@/components/SourceLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { CHANNEL_LABELS } from "@/lib/labels";
import type { QueueItem } from "@/services/queue";

const REASONS = ["wrong person", "tone", "inaccurate", "timing", "other"] as const;
const SWIPE = 100;
const noop = () => () => {};

function Highlighted({ item }: { item: QueueItem }) {
  const hook = item.message.ripple?.hook;
  const phrase = hook && item.message.body.includes(hook) ? hook : item.signals.map((s) => s.summary).find((s) => item.message.body.includes(s));
  if (!phrase) return <>{item.message.body}</>;
  const at = item.message.body.indexOf(phrase);
  return (
    <>
      {item.message.body.slice(0, at)}
      <mark className="rounded bg-warn/25 text-[#FFE2B0] px-0.5">{phrase}</mark>
      {item.message.body.slice(at + phrase.length)}
    </>
  );
}

export function ApproveView({ drafts, ready, waiting, demo }: { drafts: QueueItem[]; ready: QueueItem[]; waiting: QueueItem[]; demo: boolean }) {
  const router = useRouter();
  const [tier, setTier] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const still = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], still ? [0, 0] : [-6, 6]);
  const yes = useTransform(x, [20, SWIPE], [0, 1]);
  const no = useTransform(x, [-SWIPE, -20], [1, 0]);
  // With a mouse, dragging would get in the way of selecting text.
  const touchScreen = useSyncExternalStore(noop, () => window.matchMedia("(pointer: coarse)").matches, () => false);

  const shown = drafts.filter((d) => !tier || d.lead.score.tier === tier);
  // Skipped messages go to the back of the line.
  const queue = [...shown.filter((d) => !skipped.includes(d.message.id)), ...shown.filter((d) => skipped.includes(d.message.id))];
  const item = queue[0];

  const call = async (path: string, method: "POST" | "PATCH", body: unknown, done: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api<{ status?: string }>(path, method, body);
      toast.success(result.status === "scheduled" ? "Daily limit reached. It will go out tomorrow." : done);
      setEditing(null);
      setRejecting(false);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const act = (body: unknown, done: string) => call(`/api/messages/${item.message.id}`, "PATCH", body, done);
  const skip = () => setSkipped((s) => [...s.filter((id) => id !== item.message.id), item.message.id]);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <p className="mr-auto text-sm" aria-live="polite">{item ? `1 of ${queue.length}` : "None waiting"}</p>
        {["A", "B", "C"].map((t) => (
          <Button key={t} variant={tier === t ? "default" : "outline"} className="h-11 px-3" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)}>Tier {t}</Button>
        ))}
      </div>
      {item ? (
        <div className="relative md:max-w-2xl">
        {queue.length > 1 && <div aria-hidden className="absolute inset-x-4 top-6 -bottom-2 rounded-xl border bg-card opacity-60" />}
        <motion.article
          key={item.message.id}
          aria-label="Message to approve"
          className="relative rounded-xl border bg-card p-4 shadow-2xl shadow-black/40"
          style={{ x, rotate, touchAction: "pan-y" }}
          initial={still ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          drag={editing === null && !rejecting && !busy ? "x" : false}
          dragListener={touchScreen}
          dragSnapToOrigin
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x > SWIPE) void act({ action: "approve" }, "Approved");
            else if (info.offset.x < -SWIPE) skip();
          }}
        >
          <motion.span aria-hidden style={{ opacity: yes }} className="absolute top-3 right-3 z-10 rounded-lg bg-good px-3 py-1 font-bold text-[#03110E]">Approve</motion.span>
          <motion.span aria-hidden style={{ opacity: no }} className="absolute top-3 right-3 z-10 rounded-lg bg-secondary px-3 py-1 font-bold">Skip</motion.span>
          <div className="flex items-center gap-3">
            <TierBadge tier={item.lead.score.tier} large />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{item.person.name}</h2>
              <p className="text-sm text-muted-foreground">{item.person.title}, {item.company.name}</p>
            </div>
            {item.message.channel === "email" ? <Mail /> : <Linkedin />}
            <Badge variant="secondary">{CHANNEL_LABELS[item.message.channel]} {item.message.variant}</Badge>
          </div>
          {item.message.ripple && <RippleBadge owner={item.message.ripple.owner} />}
          {item.message.flags?.map((f) => <p key={f} className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">{f}</p>)}
          {editing !== null ? (
            <Textarea aria-label="Message" className="mt-3 min-h-60 text-base" value={editing} onChange={(e) => setEditing(e.target.value)} />
          ) : (
            <>
              {item.message.subject && <p className="mt-3 font-medium">{item.message.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap"><Highlighted item={item} /></p>
            </>
          )}
          <ul className="mt-3">{item.message.citations.map((s) => <li key={s.url}><SourceLink source={s} /></li>)}</ul>
          {rejecting ? (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Why reject?">
              {REASONS.map((reason) => <Button key={reason} variant="outline" className="h-11 capitalize" disabled={busy} onClick={() => act({ action: "reject", reason }, "Rejected")}>{reason}</Button>)}
              <Button variant="ghost" className="h-11" onClick={() => setRejecting(false)}>Cancel</Button>
            </div>
          ) : editing !== null ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="h-12" disabled={busy || !editing.trim()} onClick={() => act({ action: "edit", body: editing }, "Saved")}>Save</Button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_2fr] gap-2">
              <Button variant="outline" className="h-12 px-1" onClick={() => setRejecting(true)}>Reject</Button>
              <Button variant="outline" className="h-12 px-1" onClick={() => setEditing(item.message.body)}>Edit</Button>
              <Button variant="outline" className="h-12 px-1" onClick={skip}>Skip</Button>
              <Button className="h-12" disabled={busy} onClick={() => act({ action: "approve" }, "Approved")}>Approve</Button>
            </div>
          )}
        </motion.article>
        </div>
      ) : <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No messages are waiting for you.</p>}

      {ready.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">Ready to send ({ready.length})</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {ready.map(({ message, person, company }) => (
              <li key={message.id} data-message={message.id} className="flex items-center gap-2 px-4 py-2">
                <p className="mr-auto text-sm"><span className="font-medium">{person.name}</span>, {company.name}<br />{CHANNEL_LABELS[message.channel]}{message.status === "scheduled" && ", waiting for tomorrow"}</p>
                {message.status === "approved" && (message.channel === "email" ? (
                  <Button className="h-11" disabled={busy} onClick={() => call(`/api/messages/${message.id}/send`, "POST", {}, "Sent")}>Send</Button>
                ) : (
                  <>
                    <Button variant="outline" className="h-11" onClick={async () => {
                      await navigator.clipboard?.writeText(message.body).catch(() => {});
                      toast("Message copied. Paste it in LinkedIn.");
                      if (person.linkedinUrl && !demo) window.open(person.linkedinUrl, "_blank", "noopener");
                    }}>Copy</Button>
                    <Button className="h-11" disabled={busy} onClick={() => call(`/api/messages/${message.id}/send`, "POST", { repSentIt: true }, "Marked as sent")}>I sent it</Button>
                  </>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}
      {waiting.length > 0 && demo && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">Waiting for a reply</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {waiting.slice(0, 5).map(({ message, person, company }) => (
              <li key={message.id} data-message={message.id} className="flex items-center gap-2 px-4 py-2">
                <p className="mr-auto text-sm"><span className="font-medium">{person.name}</span>, {company.name}</p>
                <Button variant="outline" className="h-11" disabled={busy} onClick={() => call(`/api/messages/${message.id}/reply`, "POST", {}, `${person.name} replied`)}>Simulate reply</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
