import { and, eq, gt, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db } from '@/server/db.server';

export type ResourceReadInput = { userId: string; cursor?: string; limit: number; id?: string };

/** Defines one allowlisted collection; ownership is applied to both pagination and detail lookups. */
export function defineAgentResource<TColumns extends Record<string, PgColumn | SQL.Aliased>>(
  name: string,
  description: string,
  table: PgTable,
  columns: TColumns,
  key: PgColumn | SQL | ((userId: string) => SQL),
  scope: (userId: string) => SQL,
) {
  return {
    name,
    description,
    fields: ['id', ...Object.keys(columns).filter((field) => field !== 'id')],
    async read({ userId, cursor, limit, id }: ResourceReadInput) {
      const textKey = sql<string>`${typeof key === 'function' ? key(userId) : key}::text`;
      const rows = await db
        .select({ ...columns, id: textKey.as('id') })
        .from(table)
        .where(
          and(
            scope(userId),
            cursor === undefined ? undefined : gt(textKey, cursor),
            id === undefined ? undefined : eq(textKey, id),
          ),
        )
        .orderBy(textKey)
        .limit(id === undefined ? limit + 1 : 1);
      const items = rows.slice(0, limit);
      return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
    },
  };
}
