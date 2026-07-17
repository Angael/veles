import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { diaryEntries } from '@/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { invariant } from '@/lib/invariant';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

export type DiaryEntrySummary = {
  entryDate: string;
  id: string;
  markdown: string;
  title: string;
};

export const getDiaryEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntries')])
  .handler(async () => {
    const session = await requireSession();

    const entries = await db
      .select({
        entryDate: diaryEntries.entryDate,
        id: diaryEntries.id,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, session.user.id))
      .orderBy(desc(diaryEntries.entryDate), desc(diaryEntries.createdAt));

    return entries;
  });

const idType = type({ id: 'string.uuid' });
const diaryEntryDateType = type('string.date');
const createDiaryEntryInputType = type({ entryDate: diaryEntryDateType });
const updateDiaryEntryInputType = type({
  entryDate: diaryEntryDateType,
  id: 'string.uuid',
  markdown: 'string <= 16000',
  title: 'string <= 160',
});

export const getDiaryEntryById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntryById')])
  .validator(arkTypeValidator(idType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const entries = await db
      .select({
        entryDate: diaryEntries.entryDate,
        id: diaryEntries.id,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)))
      .limit(1);
    const entry = entries[0];

    invariant(entry, () => {
      throw notFound();
    });

    return {
      entryDate: entry.entryDate,
      id: entry.id,
      markdown: entry.markdown,
      title: entry.title,
    };
  });

export const createDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createDiaryEntry')])
  .validator(arkTypeValidator(createDiaryEntryInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const entries = await db
      .insert(diaryEntries)
      .values({
        entryDate: data.entryDate,
        markdown: '',
        title: '',
        userId: session.user.id,
      })
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
        entryDate: data.entryDate,
        markdown: data.markdown,
        title: data.title,
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
