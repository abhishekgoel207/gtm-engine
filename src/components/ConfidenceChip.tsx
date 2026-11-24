"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function confidenceLevel(value: number) {
  if (value >= 0.75) return { label: "High", className: "bg-good/15 text-good" };
  if (value >= 0.5) return { label: "Medium", className: "bg-warn/15 text-warn" };
  return { label: "Low", className: "bg-bad/15 text-bad" };
}

export function ConfidenceChip({ value, why }: { value: number; why: string }) {
  const { label, className } = confidenceLevel(value);
  return (
    <Popover>
      <PopoverTrigger className="flex min-h-11 items-center" aria-label={`${label} confidence. Why?`}>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        <p className="font-medium">{value.toFixed(2)} confidence</p>
        <p>{why}</p>
      </PopoverContent>
    </Popover>
  );
}
