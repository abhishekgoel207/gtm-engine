import { rmSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";

// Each test file gets its own data folder, so tests never touch the app's
// .data/db.json or each other's.
const name = path.basename(expect.getState().testPath ?? "unknown", ".test.ts");
const dir = path.join(process.cwd(), ".data", "test", name);
rmSync(dir, { recursive: true, force: true });
process.env.GTM_DATA_DIR = dir;
