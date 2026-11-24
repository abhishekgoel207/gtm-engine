"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SECTIONS, sectionOf } from "./nav";

/** Main tabs on phones. Each opens the first screen of its section. */
export function BottomTabs({ pendingBadge }: { pendingBadge: ReactNode }) {
  const current = sectionOf(usePathname());
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {SECTIONS.map((section) => {
        const active = section === current;
        const Icon = section.icon;
        return (
          <Link
            key={section.label}
            href={section.items[0].href}
            aria-current={active ? "true" : undefined}
            className={cn("relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}
          >
            {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_12px_var(--s1)]" />}
            <Icon className="size-5" aria-hidden />
            {section.label}
            {section.items.some((i) => i.badge) && <span className="absolute top-1 left-1/2 ml-2">{pendingBadge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
