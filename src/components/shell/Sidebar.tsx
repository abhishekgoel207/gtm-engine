"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThinkingButton } from "@/components/AgentThinking";
import { cn } from "@/lib/utils";
import { AppName } from "./AppName";
import { isActive, MORE_ITEMS, TABS } from "./nav";

export function Sidebar({ pendingBadge, credits }: { pendingBadge: ReactNode; credits: ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-background/60 gap-4 overflow-y-auto border-r p-4 md:flex">
      <div className="flex items-center justify-between">
        <AppName />
        {credits}
      </div>
      <ThinkingButton />
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {[...TABS, ...MORE_ITEMS].map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm",
                    active
                      ? "bg-primary/15 font-semibold text-foreground shadow-[inset_3px_0_0_var(--s1)]"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                  {badge && <span className="ml-auto">{pendingBadge}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
