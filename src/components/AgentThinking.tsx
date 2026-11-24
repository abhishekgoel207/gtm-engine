"use client";

import { format } from "date-fns";
import {
  ArrowRightLeft,
  Brain,
  type LucideIcon,
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { AgentStep } from "@/lib/types";

const MAX_STEPS = 500;

const KINDS: Record<AgentStep["kind"], { icon: LucideIcon; label: string }> = {
  think: { icon: Brain, label: "Thinking" },
  graph: { icon: Share2, label: "Connections" },
  validate: { icon: ShieldCheck, label: "Checking" },
  tool: { icon: Wrench, label: "Using a tool" },
  handoff: { icon: ArrowRightLeft, label: "Handing over" },
};

interface Thinking {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Steps on screen; frozen while paused. */
  steps: AgentStep[];
  paused: boolean;
  /** Steps that arrived while paused. */
  waiting: number;
  togglePause: () => void;
  clear: () => void;
}

const ThinkingContext = createContext<Thinking | null>(null);

export function useThinking(): Thinking {
  const value = useContext(ThinkingContext);
  if (!value) throw new Error("useThinking needs ThinkingProvider");
  return value;
}

/** Keeps one connection open, so steps are kept while the panel is closed. */
export function ThinkingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  // What was on screen when the rep pressed pause.
  const [frozen, setFrozen] = useState<AgentStep[] | null>(null);

  useEffect(() => {
    // Reconnecting can repeat steps, including ones the rep has cleared.
    const seen = new Set<string>();
    const source = new EventSource("/api/agent-stream");
    source.onmessage = (event) => {
      const step = JSON.parse(event.data) as AgentStep;
      if (seen.has(step.id)) return;
      seen.add(step.id);
      setSteps((current) => [...current, step].slice(-MAX_STEPS));
    };
    return () => source.close();
  }, []);

  const lastFrozenId = frozen?.at(-1)?.id;
  const waiting = frozen
    ? steps.length - (steps.findIndex((s) => s.id === lastFrozenId) + 1)
    : 0;

  return (
    <ThinkingContext
      value={{
        open,
        setOpen,
        steps: frozen ?? steps,
        paused: frozen !== null,
        waiting,
        togglePause: () => setFrozen(frozen ? null : steps),
        clear: () => {
          setSteps([]);
          if (frozen) setFrozen([]);
        },
      }}
    >
      {children}
    </ThinkingContext>
  );
}

export function ThinkingButton() {
  const { open, setOpen } = useThinking();
  return (
    <Button
      variant="outline"
      className="h-11 px-3"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
    >
      <Brain aria-hidden />
      Thinking
    </Button>
  );
}

const DESKTOP = "(min-width: 768px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

/** Bottom sheet on mobile, right rail on desktop. */
export function AgentThinking() {
  const { open, setOpen } = useThinking();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    if (!open) return null;
    return (
      <aside
        aria-label="Agent Thinking"
        className="sticky top-0 flex h-dvh w-80 shrink-0 flex-col border-l"
      >
        <Panel title={<h2 className="text-base font-medium">Agent Thinking</h2>} />
      </aside>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 pb-[env(safe-area-inset-bottom)] data-[side=bottom]:h-[75dvh]"
      >
        <SheetDescription className="sr-only">What the AI is doing right now</SheetDescription>
        <Panel title={<SheetTitle>Agent Thinking</SheetTitle>} />
      </SheetContent>
    </Sheet>
  );
}

function Panel({ title }: { title: ReactNode }) {
  const { steps, paused, waiting, togglePause, clear, setOpen } = useThinking();
  const scroller = useRef<HTMLDivElement>(null);
  // Follow new steps unless the rep has scrolled up to read.
  const following = useRef(true);

  useEffect(() => {
    const element = scroller.current;
    if (element && following.current) element.scrollTop = element.scrollHeight;
  }, [steps]);

  return (
    <>
      <div className="flex items-center gap-1 border-b py-1.5 pr-1.5 pl-4">
        <div className="mr-auto">{title}</div>
        <Button
          variant="ghost"
          className="size-11"
          onClick={togglePause}
          aria-label={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
        </Button>
        <Button variant="ghost" className="size-11" onClick={clear} aria-label="Clear">
          <Trash2 aria-hidden />
        </Button>
        <Button
          variant="ghost"
          className="size-11"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X aria-hidden />
        </Button>
      </div>
      {paused && (
        <p role="status" className="bg-muted px-4 py-2 text-sm">
          Paused{waiting > 0 && `, ${waiting} new`}
        </p>
      )}
      <div
        ref={scroller}
        tabIndex={0}
        role="log"
        aria-label="Steps"
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={({ currentTarget: e }) => {
          following.current = e.scrollHeight - e.scrollTop - e.clientHeight < 40;
        }}
      >
        {steps.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nothing yet. Steps appear here while the AI works.
          </p>
        ) : (
          <ol className="divide-y">
            {steps.map((step) => (
              <Step key={step.id} step={step} />
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

function Step({ step }: { step: AgentStep }) {
  const { icon: Icon, label } = KINDS[step.kind];
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="sr-only">{label}</span>
        <Badge variant="secondary">{step.agent}</Badge>
        <time dateTime={step.ts} className="ml-auto tabular-nums">
          {format(new Date(step.ts), "HH:mm:ss")}
        </time>
      </div>
      <p className="mt-1 text-sm break-words">{step.text}</p>
    </li>
  );
}
