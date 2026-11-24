"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { type AnswerKey, type Answers, EMPTY_ANSWERS, fromProduct, isComplete, QUESTIONS, toProduct } from "./answers";
import { VoiceTextarea } from "./VoiceTextarea";
import type { Product } from "@/lib/types";

export function Intake({ saved, example }: { saved: Answers | null; example: Product }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(saved ?? EMPTY_ANSWERS);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const set = (key: AnswerKey, value: string) => setAnswers((a) => ({ ...a, [key]: value }));
  const complete = isComplete(answers);
  const current = QUESTIONS[step];

  const build = async () => {
    setSaving(true);
    try {
      const product = await api<Product>("/api/product", "POST", toProduct(answers));
      await api("/api/icp", "POST", { productId: product.id });
      router.push(`/icp?productId=${product.id}`);
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  };

  const addChip = (key: AnswerKey, chip: string) =>
    set(key, answers[key].trim() ? `${answers[key].trimEnd()}\n${chip}` : chip);

  return (
    <>
      <Button variant="outline" className="mb-4 h-11 self-start" onClick={() => setAnswers(fromProduct(example))}>
        Use example product
      </Button>
      <Tabs defaultValue="chat">
        <TabsList className="h-12! w-full md:w-96">
          <TabsTrigger value="chat" className="h-full text-base">Talk it through</TabsTrigger>
          <TabsTrigger value="form" className="h-full text-base">Fill a form</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="pt-4">
          <div className="mb-4 flex gap-1" aria-label={`Question ${step + 1} of 5`}>
            {QUESTIONS.map((q, i) => (
              <button key={q.key} type="button" aria-label={`Question ${i + 1}`} onClick={() => setStep(i)}
                className="flex h-11 flex-1 items-center">
                <span className={cn("h-2 w-full rounded-full", answers[q.key].trim() ? "bg-foreground" : "bg-muted",
                  i === step && "ring-2 ring-ring")} />
              </button>
            ))}
          </div>
          <label htmlFor="chat-answer" className="text-lg font-medium">{current.question}</label>
          <p className="mb-2 text-sm text-muted-foreground">{current.help}</p>
          <VoiceTextarea key={current.key} id="chat-answer" label={current.question} value={answers[current.key]}
            onChange={(v) => set(current.key, v)} />
          <div className="mt-3 flex flex-wrap gap-2">
            {current.chips.map((chip) => (
              <button key={chip} type="button" onClick={() => addChip(current.key, chip)}
                className="min-h-11 rounded-full border px-4 py-2 text-left text-sm">{chip}</button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="h-11 flex-1" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button variant="outline" className="h-11 flex-1" disabled={step === 4} onClick={() => setStep(step + 1)}>Next</Button>
          </div>
        </TabsContent>
        <TabsContent value="form" className="flex flex-col gap-5 pt-4">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label htmlFor={`form-${q.key}`} className="font-medium">{q.question}</label>
              <p className="mb-1 text-sm text-muted-foreground">{q.help}</p>
              <VoiceTextarea id={`form-${q.key}`} label={q.question} rows={3} value={answers[q.key]} onChange={(v) => set(q.key, v)} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
      <StickyAction>
        <Button disabled={!complete || saving} onClick={build}>
          {saving ? "Building..." : "Build my ideal customer"}
        </Button>
      </StickyAction>
    </>
  );
}
