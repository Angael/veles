import { type } from 'arktype';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { notes } from '@veles/db/schema';
import { VersionConflictError } from '@/lib/errors/VersionConflictError';
import { createTestDatabase, type TestDatabase } from '@/server/testDatabase.server';
import { toggleNoteTypeRecord, updateNoteRecord } from './notes.server';
import { saveNoteRecord } from './saveNote.server';
import { saveNoteInputType, updateNoteInputType } from './notes.validation';

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

async function createNote() {
  const [note] = await database
    .insert(notes)
    .values({ content: 'Loaded text', ownerId: 'owner', title: 'Plan', type: 'note' })
    .returning({ id: notes.id, version: notes.version });
  if (!note) throw new Error('Test note was not created.');
  return note;
}

async function storedNote(id: string) {
  const [note] = await database
    .select({ content: notes.content, title: notes.title, version: notes.version })
    .from(notes)
    .where(eq(notes.id, id));
  return note;
}

describe('updateNoteRecord', () => {
  it('saves against the current version and returns the next version', async () => {
    const note = await createNote();

    await expect(
      updateNoteRecord('owner', { content: 'First', id: note.id, version: 1 }),
    ).resolves.toEqual({ version: 2 });
    await expect(
      updateNoteRecord('owner', { id: note.id, title: 'Renamed', version: 2 }),
    ).resolves.toEqual({ version: 3 });
    expect(await storedNote(note.id)).toEqual({ content: 'First', title: 'Renamed', version: 3 });
  });

  it('rejects a stale editor and keeps the newer save intact', async () => {
    const note = await createNote();
    await updateNoteRecord('owner', { content: 'Editor A', id: note.id, version: note.version });

    const staleSave = updateNoteRecord('owner', {
      content: 'Editor B',
      id: note.id,
      version: note.version,
    });

    await expect(staleSave).rejects.toBeInstanceOf(VersionConflictError);
    await expect(staleSave).rejects.toMatchObject({ name: 'VersionConflictError', status: 412 });
    expect(await storedNote(note.id)).toEqual({ content: 'Editor A', title: 'Plan', version: 2 });
  });

  it('lets exactly one of several concurrent saves of the same version win', async () => {
    const note = await createNote();
    const editors = ['A', 'B', 'C', 'D', 'E'];

    const results = await Promise.allSettled(
      editors.map((editor) =>
        updateNoteRecord('owner', { content: editor, id: note.id, version: note.version }),
      ),
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    for (const result of results) {
      if (result.status === 'rejected') expect(result.reason).toBeInstanceOf(VersionConflictError);
    }

    const winner = editors[results.findIndex((result) => result.status === 'fulfilled')];
    expect(await storedNote(note.id)).toEqual({ content: winner, title: 'Plan', version: 2 });
  });

  it('reports a note outside the caller scope as not found, not as a conflict', async () => {
    const note = await createNote();

    const save = updateNoteRecord('stranger', { content: 'X', id: note.id, version: 1 });

    await expect(save).rejects.toThrow('Note not found.');
    await expect(save).rejects.not.toBeInstanceOf(VersionConflictError);
  });

  it('advances the version when a type change rewrites the content', async () => {
    const note = await createNote();
    await toggleNoteTypeRecord('owner', { id: note.id, version: note.version });

    await expect(
      updateNoteRecord('owner', { id: note.id, title: 'Stale', version: note.version }),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });
});

describe('updateNoteInputType', () => {
  it('requires the version token', () => {
    const id = crypto.randomUUID();

    expect(updateNoteInputType({ content: 'Text', id })).toBeInstanceOf(type.errors);
    expect(updateNoteInputType({ content: 'Text', id, version: 1 })).not.toBeInstanceOf(
      type.errors,
    );
  });
});

describe('saveNoteRecord', () => {
  it('refuses text changes without a version and changes nothing', async () => {
    const note = await createNote();
    const data = saveNoteInputType.assert({ content: 'Agent text', id: note.id });

    await expect(saveNoteRecord('owner', data)).rejects.toThrow('version is required');
    expect(await storedNote(note.id)).toEqual({
      content: 'Loaded text',
      title: 'Plan',
      version: 1,
    });
  });

  it('rejects a stale version and saves with the current one', async () => {
    const note = await createNote();
    await updateNoteRecord('owner', { content: 'App edit', id: note.id, version: 1 });

    await expect(
      saveNoteRecord('owner', { content: 'Agent text', id: note.id, version: 1 }),
    ).rejects.toBeInstanceOf(VersionConflictError);
    expect((await storedNote(note.id))?.content).toBe('App edit');

    await expect(
      saveNoteRecord('owner', { content: 'Agent text', id: note.id, version: 2 }),
    ).resolves.toEqual({ id: note.id, version: 3 });
  });

  it('changes sharing without a version and keeps the version', async () => {
    const note = await createNote();

    await expect(saveNoteRecord('owner', { id: note.id, shared: true })).resolves.toEqual({
      id: note.id,
      version: 1,
    });
  });
});
