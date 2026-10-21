import { type } from 'arktype';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { diaryEntries } from '@veles/db/schema';
import { VersionConflictError } from '@/lib/errors/VersionConflictError';
import { createTestDatabase, type TestDatabase } from '@/server/testDatabase.server';
import { updateDiaryEntryRecord } from './diary.server';
import { updateDiaryEntryInputType } from './diary.validation';

const testDatabase = vi.hoisted((): { current?: TestDatabase['db'] } => ({}));

vi.mock('@/server/db.server', () => ({
  get db() {
    return testDatabase.current;
  },
}));
vi.mock('@/lib/i18n/getLocale', () => ({ translate: (text: { en: string }) => text.en }));

let testDb: TestDatabase;
let database: TestDatabase['db'];

beforeAll(async () => {
  testDb = await createTestDatabase();
  database = testDb.db;
  testDatabase.current = database;
});
beforeEach(() => testDb.reset());

async function createEntry() {
  const [entry] = await database
    .insert(diaryEntries)
    .values({ ciphertext: 'loaded', entryDate: '2026-10-20', userId: 'owner' })
    .returning({ id: diaryEntries.id, version: diaryEntries.version });
  if (!entry) throw new Error('Test entry was not created.');
  return entry;
}

async function storedEntry(id: string) {
  const [entry] = await database
    .select({ ciphertext: diaryEntries.ciphertext, version: diaryEntries.version })
    .from(diaryEntries)
    .where(eq(diaryEntries.id, id));
  return entry;
}

const save = (id: string, ciphertext: string, version: number, userId = 'owner') =>
  updateDiaryEntryRecord(userId, { ciphertext, entryDate: '2026-10-21', id, version });

describe('updateDiaryEntryRecord', () => {
  it('saves against the current version and returns the next version', async () => {
    const entry = await createEntry();

    await expect(save(entry.id, 'first', 1)).resolves.toEqual({ version: 2 });
    await expect(save(entry.id, 'second', 2)).resolves.toEqual({ version: 3 });
    expect(await storedEntry(entry.id)).toEqual({ ciphertext: 'second', version: 3 });
  });

  it('rejects editor B after editor A saved the same loaded version', async () => {
    const entry = await createEntry();
    await save(entry.id, 'editor A', entry.version);

    const staleSave = save(entry.id, 'editor B', entry.version);

    await expect(staleSave).rejects.toBeInstanceOf(VersionConflictError);
    await expect(staleSave).rejects.toMatchObject({ status: 412 });
    expect(await storedEntry(entry.id)).toEqual({ ciphertext: 'editor A', version: 2 });
  });

  it('lets exactly one of several concurrent saves of the same version win', async () => {
    const entry = await createEntry();
    const editors = ['A', 'B', 'C', 'D', 'E'];

    const results = await Promise.allSettled(
      editors.map((editor) => save(entry.id, editor, entry.version)),
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    for (const result of results) {
      if (result.status === 'rejected') expect(result.reason).toBeInstanceOf(VersionConflictError);
    }
    const winner = editors[results.findIndex((result) => result.status === 'fulfilled')];
    expect(await storedEntry(entry.id)).toEqual({ ciphertext: winner, version: 2 });
  });

  it("reports another user's entry as not found, not as a conflict", async () => {
    const entry = await createEntry();

    const foreignSave = save(entry.id, 'X', 1, 'stranger');

    await expect(foreignSave).rejects.toThrow('Diary entry not found.');
    await expect(foreignSave).rejects.not.toBeInstanceOf(VersionConflictError);
    expect(await storedEntry(entry.id)).toEqual({ ciphertext: 'loaded', version: 1 });
  });
});

describe('updateDiaryEntryInputType', () => {
  it('requires the version token', () => {
    const input = { ciphertext: 'x', entryDate: '2026-10-21', id: crypto.randomUUID() };

    expect(updateDiaryEntryInputType(input)).toBeInstanceOf(type.errors);
    expect(updateDiaryEntryInputType({ ...input, version: 1 })).not.toBeInstanceOf(type.errors);
  });
});
