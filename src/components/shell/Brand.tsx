import { Brain, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppName() {
  return (
    <Link href="/" className="flex min-h-11 items-center text-lg font-semibold">
      GTM Engine
    </Link>
  );
}

/** Placeholder until billing is connected (P34). */
export function CreditsPill() {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground">
      <Coins className="size-4" aria-hidden />
      <span aria-hidden>--</span>
      <span className="sr-only">Credits not available yet</span>
    </span>
  );
}

/** Does nothing until the Agent Thinking panel is built (P08). */
export function ThinkingButton() {
  return (
    <Button variant="outline" className="h-11 px-3" disabled>
      <Brain aria-hidden />
      Thinking
    </Button>
  );
}
