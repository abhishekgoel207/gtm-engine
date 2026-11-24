import { type ReactNode, Suspense } from "react";
import { BottomTabs } from "./BottomTabs";
import { AppName, CreditsPill, ThinkingButton } from "./Brand";
import { PendingBadge } from "./PendingBadge";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pendingBadge = (
    <Suspense fallback={null}>
      <PendingBadge />
    </Suspense>
  );

  // Suspense: the active tab is unknown while prerendering pages with dynamic params.
  return (
    <div className="flex min-h-dvh w-full">
      <Suspense fallback={<aside className="hidden w-60 shrink-0 border-r md:block" />}>
        <Sidebar pendingBadge={pendingBadge} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
          <div className="mr-auto">
            <AppName />
          </div>
          <CreditsPill />
          <ThinkingButton />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-8">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <BottomTabs pendingBadge={pendingBadge} />
      </Suspense>
    </div>
  );
}
