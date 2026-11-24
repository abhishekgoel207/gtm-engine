import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import {
  AuditEventSchema,
  CompanySchema,
  CompetitorSchema,
  ExpansionSchema,
  ICPSchema,
  LeadSchema,
  LedgerEntrySchema,
  MessageSchema,
  PersonSchema,
  ProductSchema,
  SettingsSchema,
  SignalSchema,
} from "./types";

const schemas = {
  products: ProductSchema,
  icps: ICPSchema,
  expansions: ExpansionSchema,
  companies: CompanySchema,
  people: PersonSchema,
  competitors: CompetitorSchema,
  signals: SignalSchema,
  leads: LeadSchema,
  messages: MessageSchema,
  audit: AuditEventSchema,
  ledger: LedgerEntrySchema,
  settings: SettingsSchema,
};

export type Collection = keyof typeof schemas;
export type RecordOf<C extends Collection> = z.infer<(typeof schemas)[C]>;
export const COLLECTIONS = Object.keys(schemas) as Collection[];

type DB = { [C in Collection]: RecordOf<C>[] };
type State = {
  db: DB;
  /** Identifies the file version the cache matches; null when there is no file. */
  version: string | null;
  memoryOnly: boolean;
};

// On globalThis because Next can load this module more than once per process.
const holder = globalThis as typeof globalThis & { __gtmStore?: State };

const READ_ONLY_ERRORS = ["EROFS", "EACCES", "EPERM"];

const dataDir = () =>
  process.env.GTM_DATA_DIR || path.join(process.cwd(), ".data");
const dbFile = () => path.join(dataDir(), "db.json");

function emptyDB(): DB {
  return Object.fromEntries(COLLECTIONS.map((c) => [c, []])) as unknown as DB;
}

function fileVersion(): string | null {
  const stat = fs.statSync(dbFile(), { throwIfNoEntry: false });
  return stat ? `${stat.ino}:${stat.mtimeMs}:${stat.size}` : null;
}

// Re-reads the file when another process (such as `npm run seed`) changed it.
function load(): State {
  const cached = holder.__gtmStore;
  if (cached?.memoryOnly) return cached;

  const version = fileVersion();
  if (cached && cached.version === version) return cached;

  const db = emptyDB();
  if (version !== null) {
    try {
      Object.assign(db, JSON.parse(fs.readFileSync(dbFile(), "utf8")));
    } catch (cause) {
      throw new Error(`Cannot read ${dbFile()}. Fix or delete it.`, { cause });
    }
  }
  return (holder.__gtmStore = { db, version, memoryOnly: false });
}

function save(db: DB): void {
  if (holder.__gtmStore?.memoryOnly) {
    holder.__gtmStore.db = db;
    return;
  }
  try {
    fs.mkdirSync(dataDir(), { recursive: true });
    // Write then rename, so a crash never leaves a half-written file.
    const temp = `${dbFile()}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(db, null, 2));
    fs.renameSync(temp, dbFile());
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "";
    if (!READ_ONLY_ERRORS.includes(code)) throw error;
    holder.__gtmStore = { db, version: null, memoryOnly: true };
    return;
  }
  holder.__gtmStore = { db, version: fileVersion(), memoryOnly: false };
}

// Records are cloned in and out, so callers can't change the cache by accident.
export function list<C extends Collection>(c: C): RecordOf<C>[] {
  return structuredClone(load().db[c]) as RecordOf<C>[];
}

export function get<C extends Collection>(
  c: C,
  id: string,
): RecordOf<C> | undefined {
  return structuredClone(load().db[c].find((r) => r.id === id)) as
    | RecordOf<C>
    | undefined;
}

/** Adds the record, or replaces the one with the same id. Throws if invalid. */
export function upsert<C extends Collection>(
  c: C,
  obj: RecordOf<C>,
): RecordOf<C> {
  const record = schemas[c].parse(obj) as RecordOf<C>;
  const { db } = load();
  const records = [...db[c]] as RecordOf<C>[];
  const index = records.findIndex((r) => r.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
  save({ ...db, [c]: records });
  return structuredClone(record);
}

export function remove(c: Collection, id: string): void {
  const { db } = load();
  save({ ...db, [c]: db[c].filter((r) => r.id !== id) });
}

export function reset(): void {
  save(emptyDB());
}
