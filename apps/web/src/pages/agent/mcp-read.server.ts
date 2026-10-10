import { type } from 'arktype';
import { and, eq, gte, lt, lte } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { fromHundredths, HUNDREDTHS } from '@/lib/nutrition';

export interface ReadQuery {
  limit: number;
  cursor?: string;
  id?: string;
  from?: string;
  to?: string;
}

export interface ReadPage {
  items: unknown[];
  nextCursor: string | null;
}

export const isoDate = type(/^\d{4}-\d{2}-\d{2}$/).describe('a YYYY-MM-DD date');
const uuid = type('string.uuid');

/** Rejects ids and cursors in the wrong format before Postgres tries to cast them. */
export function parseKey(value: string, kind: 'uuid' | 'date') {
  if ((kind === 'uuid' ? uuid : isoDate).allows(value)) return value;
  throw new ClientSafeError(`Expected ${kind === 'uuid' ? 'a UUID' : 'a YYYY-MM-DD date'}.`);
}

/** Keeps `limit` rows of a `limit + 1` query; the extra row only signals that a next page exists. */
export function toPage<T>(rows: T[], limit: number, cursorOf: (row: T) => string) {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > limit && last ? cursorOf(last) : null };
}

/** Newest-first keyset paging and id lookup for UUIDv7 primary keys. */
export function byIdDesc(column: PgColumn, query: ReadQuery) {
  return and(
    query.cursor ? lt(column, parseKey(query.cursor, 'uuid')) : undefined,
    query.id ? eq(column, parseKey(query.id, 'uuid')) : undefined,
  );
}

/** Inclusive `from`/`to` filter for dated resources. */
export function inDateRange(column: PgColumn, query: ReadQuery) {
  return and(
    query.from ? gte(column, query.from) : undefined,
    query.to ? lte(column, query.to) : undefined,
  );
}

/** Stored hundredths to kcal and grams; energy stays apart from macros (protein, fat, carbs). */
export function toNutrition(value: {
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}) {
  return {
    kcal: value.kcal / HUNDREDTHS,
    macros: {
      protein: fromHundredths(value.protein),
      fat: fromHundredths(value.fat),
      carbs: fromHundredths(value.carbs),
    },
  };
}
