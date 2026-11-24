import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  // One store, so one test at a time.
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
  },
  // A production build, so it can run next to your own `npm run dev`.
  webServer: {
    command: `rm -rf .data/e2e && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 180_000,
    // Blank keys keep the AI on sample answers whatever .env.local says.
    env: { GTM_DATA_DIR: ".data/e2e", ANTHROPIC_API_KEY: "", ANTHROPIC_PROFILE: "" },
  },
});
