import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { diaryEntries } from '@/db/schema';
import { getSessionUserId } from '@/lib/auth/getSession';
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
    const userId = await getSessionUserId();

    if (!userId) {
      return [];
    }

    const entries = await db
      .select({
        entryAt: diaryEntries.entryAt,
        id: diaryEntries.id,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, userId))
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

export const getDiaryEntryById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getDiaryEntryById')])
  .validator(arkTypeValidator(diaryEntryByIdInputType))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();

    if (!userId) {
      return null;
    }

    const entries = await db
      .select({
        entryAt: diaryEntries.entryAt,
        id: diaryEntries.id,
        markdown: diaryEntries.markdown,
        title: diaryEntries.title,
      })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, data.id), eq(diaryEntries.userId, userId)))
      .limit(1);
    const entry = entries[0];

    return entry
      ? {
          entryAt: entry.entryAt.toISOString(),
          id: entry.id,
          markdown: entry.markdown,
          title: entry.title,
        }
      : null;
  });
