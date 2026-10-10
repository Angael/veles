import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';
import { diaryEntries, diaryKeys } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { dateOnlyType } from '@/lib/dateOnly';
import { requireSession } from '@/server/getSession.server';
import { invariant } from '@/lib/invariant';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import type { DiaryKeyRecord } from './diaryCrypto';

export type EncryptedDiaryEntry = {
  ciphertext: string | null;
  entryDate: string;
  id: string;
};

// Sealed JSON of a 160-char title and 16000-char body, with room for escapes, UTF-8, and base64.
const ciphertextType = type('string <= 200000');
const keyRecordType = type({
  iterations: 'number.integer >= 100000',
  salt: 'string <= 64',
  wrappedKey: 'string <= 256',
});
const idType = type({ id: 'string.uuid' });
const createDiaryEntryInputType = type({ entryDate: dateOnlyType });
const updateDiaryEntryInputType = type({
  ciphertext: ciphertextType,
  entryDate: dateOnlyType,
  id: 'string.uuid',
});
const setupDiaryKeyInputType = type({
  entries: type({ ciphertext: ciphertextType, id: 'string.uuid' }).array(),
  key: keyRecordType,
});

/** Formats a server-validated diary date for display. */
export function formatDiaryDate(value: string) {
  return format(parseISO(value), 'MMMM d, yyyy');
}

async function getKeyRecord(userId: string): Promise<DiaryKeyRecord | null> {
  const rows = await db
    .select({
      iterations: diaryKeys.iterations,
      salt: diaryKeys.salt,
      wrappedKey: diaryKeys.wrappedKey,
    })
    .from(diaryKeys)
    .where(eq(diaryKeys.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

const encryptedEntryColumns = {
  ciphertext: diaryEntries.ciphertext,
  entryDate: diaryEntries.entryDate,
  id: diaryEntries.id,
};

export const getDiaryEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntries')])
  .handler(async () => {
    const session = await requireSession();

    const [keyRecord, entries] = await Promise.all([
      getKeyRecord(session.user.id),
      db
        .select(encryptedEntryColumns)
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, session.user.id))
        .orderBy(desc(diaryEntries.entryDate), desc(diaryEntries.createdAt)),
    ]);

    return {
      entries: entries.filter((entry) => dateOnlyType.allows(entry.entryDate)),
      keyRecord,
    };
  });

export const getDiaryEntryById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntryById')])
  .validator(arkTypeValidator(idType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [keyRecord, entries] = await Promise.all([
      getKeyRecord(session.user.id),
      db
        .select(encryptedEntryColumns)
        .from(diaryEntries)
        .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)))
        .limit(1),
    ]);
    const entry = entries[0];

    if (!entry || !dateOnlyType.allows(entry.entryDate)) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw notFound();
    }

    return { entry, keyRecord };
  });

/** Returns entries still stored as plaintext, so the browser can encrypt them during setup. */
export const getLegacyDiaryEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getLegacyDiaryEntries')])
  .handler(async () => {
    const session = await requireSession();
    const rows = await db
      .select({ id: diaryEntries.id, markdown: diaryEntries.markdown, title: diaryEntries.title })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, session.user.id), isNull(diaryEntries.ciphertext)));

    return rows.map((row) => ({
      id: row.id,
      markdown: row.markdown ?? '',
      title: row.title ?? '',
    }));
  });

/**
 * Stores the wrapped diary key and swaps every plaintext entry for its browser-encrypted
 * version in one transaction. Fails if any plaintext entry would stay readable.
 */
export const setupDiaryKey = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setupDiaryKey')])
  .validator(arkTypeValidator(setupDiaryKeyInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;

    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(diaryKeys)
        .values({ ...data.key, userId })
        .onConflictDoNothing()
        .returning({ userId: diaryKeys.userId });
      invariant(inserted[0], 'Diary passphrase is already set.');

      for (const entry of data.entries) {
        await tx
          .update(diaryEntries)
          .set({ ciphertext: entry.ciphertext, markdown: null, title: null })
          .where(and(eq(diaryEntries.id, entry.id), eq(diaryEntries.userId, userId)));
      }

      const leftovers = await tx
        .select({ id: diaryEntries.id })
        .from(diaryEntries)
        .where(
          and(
            eq(diaryEntries.userId, userId),
            isNull(diaryEntries.ciphertext),
            or(isNotNull(diaryEntries.title), isNotNull(diaryEntries.markdown)),
          ),
        )
        .limit(1);
      invariant(leftovers.length === 0, 'Some diary entries were not encrypted. Try again.');
    });
  });

export const createDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createDiaryEntry')])
  .validator(arkTypeValidator(createDiaryEntryInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const entries = await db
      .insert(diaryEntries)
      .values({ entryDate: data.entryDate, userId: session.user.id })
      .returning({ id: diaryEntries.id });
    const entry = entries[0];

    invariant(entry, 'Diary entry could not be created.');
    return entry;
  });

export const updateDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateDiaryEntry')])
  .validator(arkTypeValidator(updateDiaryEntryInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .update(diaryEntries)
      .set({
        ciphertext: data.ciphertext,
        entryDate: data.entryDate,
        markdown: null,
        title: null,
        updatedAt: new Date(),
      })
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)));
  });

export const deleteDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteDiaryEntry')])
  .validator(arkTypeValidator(idType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)));
  });
