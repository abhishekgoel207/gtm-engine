"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "./nav";

/** Keeps the rep moving: the next unfinished step, from anywhere. */
export function NextStep({ label, href, step, total }: { label: string; href: string; step: number; total: number }) {
  const pathname = usePathname();
  // Home has its own Continue button, and the step's own screen needs no reminder.
  if (pathname === "/" || isActive(href, pathname) || pathname.startsWith("/demo")) return null;
  return (
    <Link href={href} className="mb-5 flex min-h-12 items-center gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-2 text-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warn text-xs font-bold text-[#1a1200]">{step}</span>
      <span className="min-w-0"><span className="text-muted-foreground">Next, step {step} of {total}: </span><b>{label}</b></span>
      <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden />
    </Link>
  );
}
