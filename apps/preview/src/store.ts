import { DatabaseSync } from 'node:sqlite';
import { type } from 'arktype';
import type { Slot, SlotRecord, SlotStore } from './types.ts';

const rowType = type({
  slot: 'number.integer',
  owner: 'number.integer | null',
  branch: 'string | null',
  phase: "'idle' | 'assigned' | 'configured' | 'deployed' | 'active' | 'releasing'",
});

/** Stores reservations before side effects so a restart can resume a partially changed slot. */
export function createStore(path: string, slots: Slot[]): SlotStore {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS slots (
      slot INTEGER PRIMARY KEY,
      owner INTEGER,
      branch TEXT,
      phase TEXT NOT NULL DEFAULT 'idle'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS slots_unique_owner ON slots(owner) WHERE owner IS NOT NULL;
  `);
  const insert = db.prepare('INSERT OR IGNORE INTO slots (slot) VALUES (?)');
  for (const slot of slots) insert.run(slot.number);
  const configured = new Set(slots.map((slot) => slot.number));
  const all = db.prepare('SELECT slot, owner, branch, phase FROM slots ORDER BY slot');
  const save = db.prepare('UPDATE slots SET owner = ?, branch = ?, phase = ? WHERE slot = ?');
  function storedRows(): SlotRecord[] {
    return all.all().map((row) => {
      const parsed = rowType(row);
      if (parsed instanceof type.errors) throw new Error(`Invalid stored slot: ${parsed.summary}`);
      return parsed;
    });
  }
  function list(): SlotRecord[] {
    return storedRows().filter((row) => configured.has(row.slot));
  }
  for (const row of storedRows()) {
    if (!configured.has(row.slot) && row.owner !== null)
      throw new Error(`Occupied slot ${row.slot} was removed from PREVIEW_SLOTS`);
  }
  for (const row of list()) {
    if (
      (row.owner === null && (row.branch !== null || row.phase !== 'idle')) ||
      (row.owner !== null && (!row.branch || row.phase === 'idle'))
    )
      throw new Error(`Invalid stored state for slot ${row.slot}`);
  }
  return {
    list,
    save: (row) => {
      if (!configured.has(row.slot)) throw new Error('Unknown preview slot');
      save.run(row.owner, row.branch, row.phase, row.slot);
    },
    close: () => db.close(),
  };
}
