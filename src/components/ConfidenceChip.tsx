"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function confidenceLevel(value: number) {
  if (value >= 0.75) return { label: "High", className: "bg-green-100 text-green-900" };
  if (value >= 0.5) return { label: "Medium", className: "bg-amber-100 text-amber-900" };
  return { label: "Low", className: "bg-red-100 text-red-900" };
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
