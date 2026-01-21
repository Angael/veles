#!/bin/sh
set -e

echo "📊 Database connection info:"
echo "   DATABASE_URL: $DATABASE_URL"

# Wait for database to be connectable
echo ""
node /app/wait-for-db.mjs || {
  echo "❌ Database is not reachable"
  exit 1
}

# Run migrations
echo ""
echo "🔄 Running database migrations..."
node_modules/.bin/drizzle-kit migrate || {
  echo "❌ Migration failed!"
  exit 1
}

echo "✅ Migrations complete"
echo "🚀 Starting application..."
exec node --import ./.output/server/instrument.server.mjs .output/server/index.mjs
