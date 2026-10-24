import { getTableName, type SQL } from 'drizzle-orm';
import { PgDialect, type PgTable } from 'drizzle-orm/pg-core';

/** One query the fake db received; `where` is the real SQL drizzle would send. */
export type FakeCall = {
  op: 'select' | 'insert' | 'update' | 'delete';
  table?: string;
  set?: Record<string, unknown>;
  values?: unknown;
  where?: { sql: string; params: unknown[] };
  lock?: string;
};

const dialect = new PgDialect();

/**
 * Records queries and answers selects and inserts from queues, in call order, so server
 * operations can be tested without a database. `transaction` runs the callback on the same fake
 * and has no rollback. Tests share `fakeDb` with `vi.mock('@/server/db.server', ...)`.
 */
function createFakeDb() {
  const calls: FakeCall[] = [];
  const selects: unknown[][] = [];
  const inserts: unknown[][] = [];

  const query = (call: FakeCall, result: () => unknown) => {
    calls.push(call);
    const chain = {
      for: (lock: string) => ((call.lock = lock), chain),
      from: (table: PgTable) => ((call.table = getTableName(table)), chain),
      innerJoin: () => chain,
      limit: () => chain,
      orderBy: () => chain,
      returning: () => chain,
      set: (values: Record<string, unknown>) => ((call.set = values), chain),
      values: (values: unknown) => ((call.values = values), chain),
      where: (where: SQL | undefined) => {
        if (where) call.where = dialect.sqlToQuery(where);
        return chain;
      },
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
        Promise.resolve().then(result).then(resolve, reject),
    };
    return chain;
  };

  const queries = {
    delete: (table: PgTable) => query({ op: 'delete', table: getTableName(table) }, () => []),
    insert: (table: PgTable) =>
      query({ op: 'insert', table: getTableName(table) }, () => inserts.shift() ?? []),
    select: () => query({ op: 'select' }, () => selects.shift() ?? []),
    update: (table: PgTable) => query({ op: 'update', table: getTableName(table) }, () => []),
  };
  const db = {
    ...queries,
    transaction: async <T>(run: (tx: typeof queries) => Promise<T>) => run(queries),
  };

  const reset = () => {
    calls.length = 0;
    selects.length = 0;
    inserts.length = 0;
  };

  return { calls, db, inserts, reset, selects };
}

export const fakeDb = createFakeDb();
