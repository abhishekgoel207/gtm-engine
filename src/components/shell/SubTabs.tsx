"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isActive, sectionOf } from "./nav";

/** Screens in the current section. On desktop the sidebar shows them. */
export function SubTabs({ pendingBadge }: { pendingBadge: ReactNode }) {
  const pathname = usePathname();
  const section = sectionOf(pathname);
  if (!section) return null;
  return (
    <nav aria-label={section.label} className="sticky top-14 z-20 flex gap-1 overflow-x-auto border-b bg-background/95 px-3 backdrop-blur md:hidden">
      {section.items.map(({ href, label, badge }) => {
        const active = isActive(href, pathname);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={cn("flex min-h-11 flex-1 items-center justify-center gap-1.5 border-b-2 px-2 text-sm whitespace-nowrap", active ? "border-primary font-semibold" : "border-transparent text-muted-foreground")}>
            {label}
            {badge && pendingBadge}
          </Link>
        );
      })}
    </nav>
  );
}
