import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    setupFiles: ["tests/setup.ts"],
    // Playwright specs in e2e/ are not vitest tests.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
