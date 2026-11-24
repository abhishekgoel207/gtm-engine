# GTM Engine

A phone-first sales tool. A rep describes a product, approves an ideal customer, gets cited buyers, approves every message, and tracks the pipeline.
Nothing is sent without the rep's approval, and every fact shown has a source.
It runs end to end in demo mode with no keys.

## Quick start

Needs Node 24 or newer.

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3000. On Home, press **Load demo** at any time to start over.

## Tests

```bash
npm run check         # types and unit tests
npx playwright install chromium
npx playwright test   # the full demo in a browser
```

## Demo or live

Demo mode uses made-up data. Vendor samples follow each vendor's published format and run through the same code as live answers. **No live service has been tested: there were no keys.**

| Job | Keys | Without keys | Live adapter |
| --- | --- | --- | --- |
| AI | `ANTHROPIC_API_KEY`, `LLM_MODEL` | Sample answers | Built |
| Search | `TAVILY_API_KEY` | Sample pages | Built |
| Search | `SERPER_API_KEY` | Sample pages | Not built: request format not public |
| Page reading | `PLAYWRIGHT` | Not used | Not built |
| Graph | `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` | In-memory graph | Not built |
| Contacts | `HUNTER_API_KEY`, `APOLLO_API_KEY`, `PROSPEO_API_KEY` | Sample contacts | Built |
| Contacts | `CLEARBIT_API_KEY` | Skipped | Not built: docs need a login |
| Email | `SENDGRID_API_KEY`, `SENDGRID_FROM` | Nothing is sent | Built |
| Email | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Nothing is sent | Not built |
| Credits | `FLEXPRICE_API_KEY`, `FLEXPRICE_BASE_URL`, `ORG_ID` | Local ledger | Built; balance stays local |
| Agent room | `BAND_BRIDGE_URL` | In-app room | Outgoing only |
| Shared token | `CRON_SECRET` | Webhooks refuse calls | Built |

Copy `.env.example` to `.env.local`. Don't set a key whose adapter is not built.

## Band

`band_bridge/` posts agent messages to a Band room using Band's published REST schema. It has not been run against a live account, and receiving messages from Band is not built.

1. Create four Band agents and copy `band_bridge/agent_config.example.yaml` to `agent_config.yaml`.
2. Set `BAND_REST_URL`, `BAND_CHAT_ID`, `BAND_REP_HANDLE` and `CRON_SECRET`.
3. Run `cd band_bridge && uv run uvicorn main:app --port 8900`.
4. Set `BAND_BRIDGE_URL=http://localhost:8900` and the same `CRON_SECRET` for the app.

## Security checks

`.github/workflows/security.yml` runs the tests and Snyk. It needs a `SNYK_TOKEN` repository secret.

## Deploy

The app has no login. Anyone with the link can use it and reset its data, so deploy it for demos only. On Vercel it keeps data in memory, which is lost on restart and not shared between instances.

More: [architecture](docs/ARCHITECTURE.md), [business case](docs/BUSINESS.md).
