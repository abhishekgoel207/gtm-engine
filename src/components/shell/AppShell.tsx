import { type ReactNode, Suspense } from "react";
import { AgentThinking, ThinkingButton, ThinkingProvider } from "@/components/AgentThinking";
import { BottomTabs } from "./BottomTabs";
import { AppName } from "./AppName";
import { CreditsPill } from "./CreditsPill";
import { NextStepLoader } from "./NextStepLoader";
import { PendingBadge } from "./PendingBadge";
import { Sidebar } from "./Sidebar";
import { SubTabs } from "./SubTabs";

export function AppShell({ children }: { children: ReactNode }) {
  const pendingBadge = (
    <Suspense fallback={null}>
      <PendingBadge />
    </Suspense>
  );

  const credits = (
    <Suspense fallback={null}>
      <CreditsPill />
    </Suspense>
  );

  // Suspense: the active tab is unknown while prerendering pages with dynamic params.
  return (
    <ThinkingProvider>
      <div className="flex min-h-dvh w-full">
        <Suspense fallback={<aside className="hidden w-64 shrink-0 border-r md:block" />}>
          <Sidebar pendingBadge={pendingBadge} credits={credits} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:hidden">
            <div className="mr-auto">
              <AppName />
            </div>
            {credits}
            <ThinkingButton />
          </header>
          <Suspense fallback={<div className="h-11 border-b md:hidden" />}>
            <SubTabs pendingBadge={pendingBadge} />
          </Suspense>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-8">
            <Suspense fallback={null}>
              <NextStepLoader />
            </Suspense>
            {children}
          </main>
        </div>
        <AgentThinking />
        <Suspense fallback={null}>
          <BottomTabs pendingBadge={pendingBadge} />
        </Suspense>
      </div>
    </ThinkingProvider>
  );
}
