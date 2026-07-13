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
  entryAt: string;
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
        entryAt: diaryEntries.entryAt,
        id: diaryEntries.id,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, session.user.id))
      .orderBy(desc(diaryEntries.entryAt));

    return entries.map(
      (entry): DiaryEntrySummary => ({
        entryAt: entry.entryAt.toISOString(),
        id: entry.id,
        markdown: entry.markdown,
        title: entry.title,
      }),
    );
  });

const diaryEntryByIdInputType = type({ id: 'string.uuid' });
const deleteDiaryEntryInputType = type({ id: 'string.uuid' });
const updateDiaryEntryInputType = type({
  id: 'string.uuid',
  markdown: 'string < 16000',
  title: 'string < 1000',
});

export const getDiaryEntryById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntryById')])
  .validator(arkTypeValidator(diaryEntryByIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const entries = await db
      .select({
        entryAt: diaryEntries.entryAt,
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
      entryAt: entry.entryAt.toISOString(),
      id: entry.id,
      markdown: entry.markdown,
      title: entry.title,
    };
  });

export const updateDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateDiaryEntry')])
  .validator(arkTypeValidator(updateDiaryEntryInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .update(diaryEntries)
      .set({ markdown: data.markdown, title: data.title, updatedAt: new Date() })
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)));
  });

export const deleteDiaryEntry = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteDiaryEntry')])
  .validator(arkTypeValidator(deleteDiaryEntryInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, session.user.id)));
  });
