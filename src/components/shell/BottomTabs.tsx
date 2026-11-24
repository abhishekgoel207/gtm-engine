"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isActive, MORE_ITEMS, TABS } from "./nav";

const tabClass = (active: boolean) =>
  cn(
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
    active ? "font-semibold text-foreground" : "text-muted-foreground",
  );

const ActiveBar = () => (
  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-foreground" />
);

export function BottomTabs({ pendingBadge }: { pendingBadge: ReactNode }) {
  const pathname = usePathname();
  const moreActive = MORE_ITEMS.some((item) => isActive(item.href, pathname));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TABS.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={tabClass(active)}
          >
            {active && <ActiveBar />}
            <Icon className="size-5" aria-hidden />
            {label}
            {badge && (
              <span className="absolute top-1 left-1/2 ml-2">{pendingBadge}</span>
            )}
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          className={tabClass(moreActive)}
          data-active={moreActive || undefined}
        >
          {moreActive && <ActiveBar />}
          <Menu className="size-5" aria-hidden />
          More
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="pb-[env(safe-area-inset-bottom)] [&>[data-slot=sheet-close]]:size-11"
        >
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">Other screens</SheetDescription>
          </SheetHeader>
          <ul className="grid grid-cols-2 gap-1 px-3 pb-4">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href, pathname);
              return (
                <li key={href}>
                  <SheetClose asChild>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base",
                        active && "bg-muted font-semibold",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                      {label}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
