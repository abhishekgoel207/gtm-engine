import { cn } from "@/lib/utils";

const COLORS = { A: "bg-good/15 text-good", B: "bg-warn/15 text-warn", C: "bg-bad/15 text-bad" };
export function TierBadge({ tier, large }: { tier: "A" | "B" | "C"; large?: boolean }) {
  return (
    <span data-tier={tier} aria-label={`Tier ${tier}`} className={cn("inline-flex items-center justify-center rounded-lg font-bold", COLORS[tier], large ? "size-11 text-xl" : "size-7 text-sm")}>
      {tier}
    </span>
  );
}
