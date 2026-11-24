"use client";

import { Mic, Square } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Recognition {
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionClass = new () => Recognition;

function getRecognition(): RecognitionClass | undefined {
  const w = window as unknown as Record<string, RecognitionClass | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const never = () => () => {};

export function VoiceTextarea({ id, label, value, onChange, rows = 5 }: {
  id: string; label: string; value: string; onChange: (value: string) => void; rows?: number;
}) {
  const supported = useSyncExternalStore(never, () => Boolean(getRecognition()), () => false);
  const [listening, setListening] = useState(false);
  const active = useRef<Recognition | null>(null);

  const toggle = () => {
    if (listening) return active.current?.stop();
    const Recognizer = getRecognition();
    if (!Recognizer) return;
    const before = value ? `${value.trimEnd()} ` : "";
    const recognition = new Recognizer();
    recognition.continuous = true;
    recognition.onresult = ({ results }) =>
      onChange(before + Array.from(results).map((r) => r[0].transcript).join(" "));
    recognition.onend = () => setListening(false);
    active.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="relative">
      <Textarea id={id} aria-label={label} rows={rows} value={value} className="min-h-28 pr-14 text-base"
        onChange={(e) => onChange(e.target.value)} />
      {supported && (
        <Button type="button" variant={listening ? "destructive" : "outline"} className="absolute right-2 bottom-2 size-11"
          onClick={toggle} aria-label={listening ? "Stop recording" : "Speak your answer"}>
          {listening ? <Square aria-hidden /> : <Mic aria-hidden />}
        </Button>
      )}
    </div>
  );
}
