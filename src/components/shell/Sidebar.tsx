"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThinkingButton } from "@/components/AgentThinking";
import { cn } from "@/lib/utils";
import { AppName } from "./AppName";
import { isActive, SECTIONS, sectionOf } from "./nav";

export function Sidebar({ pendingBadge, credits }: { pendingBadge: ReactNode; credits: ReactNode }) {
  const pathname = usePathname();
  const current = sectionOf(pathname);
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-background/60 p-4 md:flex">
      <div className="flex items-center justify-between">
        <AppName />
        {credits}
      </div>
      <ThinkingButton />
      <nav aria-label="Main" className="flex flex-col gap-3">
        {SECTIONS.map((section) => {
          const open = section === current;
          const SectionIcon = section.icon;
          return (
            <section key={section.label} aria-label={section.label} className={cn("rounded-xl", open && "bg-card pb-1")}>
              <h2 className={cn("flex items-center gap-2 px-3 pt-2 pb-1 text-xs font-semibold", open ? "text-primary" : "text-muted-foreground")}>
                <SectionIcon className="size-4" aria-hidden />
                {section.label}
                {open && <span className="ml-auto font-normal text-muted-foreground">{section.help}</span>}
              </h2>
              <ul className={cn("mx-1", !open && "border-l border-border ml-5")}>
                {section.items.map(({ href, label, icon: Icon, badge }) => {
                  const active = isActive(href, pathname);
                  return (
                    <li key={href}>
                      <Link href={href} aria-current={active ? "page" : undefined}
                        className={cn("flex items-center gap-3 rounded-lg px-3 text-sm", open ? "min-h-11" : "min-h-9",
                          active ? "bg-primary/15 font-semibold shadow-[inset_3px_0_0_var(--s1)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                        {open && <Icon className="size-4" aria-hidden />}
                        {label}
                        {badge && <span className="ml-auto">{pendingBadge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
