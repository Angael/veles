import { createDatabaseConnection } from '@veles/db';
import { getServerEnv } from '@/lib/env/server';

const globalForDb = globalThis as typeof globalThis & {
  __velesDbConnection?: ReturnType<typeof createDatabaseConnection>;
};

function getDatabaseConnection() {
  if (!globalForDb.__velesDbConnection) {
    globalForDb.__velesDbConnection = createDatabaseConnection({
      connectionString: getServerEnv().databaseUrl,
      maxConnections: 5,
    });
  }

  return globalForDb.__velesDbConnection;
}

export const db = getDatabaseConnection().db;
