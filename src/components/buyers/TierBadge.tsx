import { cn } from "@/lib/utils";

const COLORS = { A: "bg-green-100 text-green-900", B: "bg-amber-100 text-amber-900", C: "bg-red-100 text-red-900" };
export function TierBadge({ tier, large }: { tier: "A" | "B" | "C"; large?: boolean }) {
  return (
    <span data-tier={tier} aria-label={`Tier ${tier}`} className={cn("inline-flex items-center justify-center rounded-lg font-bold", COLORS[tier], large ? "size-11 text-xl" : "size-7 text-sm")}>
      {tier}
    </span>
  );
}
