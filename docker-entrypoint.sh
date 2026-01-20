#!/bin/sh
set -e

echo "🔄 Running database migrations..."
echo "Using DATABASE_URL: $DATABASE_URL"
node_modules/.bin/drizzle-kit migrate || {
  echo "❌ Migration failed!"
  exit 1
}

echo "✅ Migrations complete"
echo "🚀 Starting application..."
exec node --import ./.output/server/instrument.server.mjs .output/server/index.mjs
