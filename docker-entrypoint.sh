#!/bin/sh
set -e

# Configuration
MAX_RETRIES=10
INITIAL_WAIT=2
MAX_WAIT=30

echo "🔄 Running database migrations..."
echo "Using DATABASE_URL: $DATABASE_URL"

# Retry logic with exponential backoff
retry_count=0
wait_time=$INITIAL_WAIT

while [ $retry_count -lt $MAX_RETRIES ]; do
  if node_modules/.bin/drizzle-kit migrate; then
    echo "✅ Migrations complete"
    echo "🚀 Starting application..."
    exec node --import ./.output/server/instrument.server.mjs .output/server/index.mjs
  else
    retry_count=$((retry_count + 1))

    if [ $retry_count -ge $MAX_RETRIES ]; then
      echo "❌ Migration failed after $MAX_RETRIES attempts!"
      exit 1
    fi

    echo "⚠️  Migration attempt $retry_count failed. Retrying in ${wait_time}s..."
    sleep $wait_time

    # Exponential backoff with cap
    wait_time=$((wait_time * 2))
    if [ $wait_time -gt $MAX_WAIT ]; then
      wait_time=$MAX_WAIT
    fi
  fi
done

echo "❌ Migration failed after $MAX_RETRIES attempts!"
exit 1
