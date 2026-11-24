# AI GTM Engine: rules for Claude Code

## What we are building
A phone-first sales tool. A rep describes their product, approves an ideal-customer
profile, gets cited buyer leads, approves AI-written outreach, and tracks the pipeline.
Spec: "AI GTM Engine" hackathon (Modules 1-5, plus Band, Flexprice and Snyk bonuses).

## Stack
Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui (Radix), zod, vitest,
Playwright, lucide-react. Node 24+. Graph: GraphStore interface, memory (default) and neo4j.

## Folder map
src/app/                 pages and API routes (routes only call services)
src/components/          UI
src/lib/types.ts         all domain types and zod schemas (single source of truth)
src/lib/store.ts         persistence (JSON file in .data/, memory fallback)
src/lib/audit.ts         audit log
src/lib/agentLog.ts      Agent Thinking events
src/lib/telemetry.ts     token and cost totals per agent
src/services/            business logic, one file per job
src/providers/<kind>/    index.ts (interface), mock.ts, <vendor>.ts
src/providers/registry.ts picks mock or live per kind from env
src/config/              weights, limits, prices, rules
src/data/                seed.ts and fixtures/*.json
tests/  e2e/

## Hard rules
1. Every external service sits behind an interface in src/providers. Never import a
   vendor SDK outside its adapter file. No key means mock.
2. Mock mode must work end to end with no keys and no network.
3. Never invent a vendor endpoint, field or SDK call. If unsure, keep the mock path,
   write `// TODO(verify): <docs url>` in the adapter, and say so in your summary.
4. Every lead, fact or claim shown to a user carries a source URL. Drop uncited data.
5. No message is sent unless status === 'approved' by a human. Enforce it in
   src/services/send.ts, not only in the UI.
6. Every state change writes an audit event with actor 'ai' or 'rep' and an ISO timestamp.
7. Emit agentLog steps for reasoning steps, graph queries and validations.
8. Meter billable events through BillingProvider: leads_enriched, outreach_sent,
   graph_queries_evaluated.
9. Secrets only from process.env. Never log them or send them to the client.
10. Cache Components is on: don't export `dynamic`, `revalidate` or `runtime`. Read live data
    inside `<Suspense>`, calling `connection()` first when the read is synchronous.

## UI rules (busy, non-technical sales reps on phones)
- Design at 390px first. No horizontal scroll on mobile.
- One primary action per screen as a big bottom button. Tap targets at least 44px.
- Plain words: "Ideal customer" not ICP; "Find buyers"; "Approve messages"; "Pipeline".
- Confidence chips: High >= 0.75 green, Medium 0.50-0.74 amber, Low < 0.50 red.
  Tap shows the number and the reason.
- Every empty state has a "Load example" button.
- Undo toasts instead of confirm dialogs, except Send and Reject.
- Desktop: dense spreadsheet tables. Mobile: cards with the same data.

## How to work each prompt
- Touch only the files the prompt names, plus their tests. No drive-by refactors.
- Do not start the next prompt's work.
- Write every test the prompt's "Test and validate" block asks for. Never skip, delete or weaken a test to make it pass.
- Finish by running `npm run check` and fixing failures.
- End with a summary of 5 lines max: files changed, how to see it, what is mocked or TODO.
