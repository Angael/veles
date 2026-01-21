FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/.output .output

# Copy node_modules for drizzle-kit
COPY --from=builder /app/node_modules ./node_modules

# Copy migration files
COPY --from=builder /app/drizzle ./drizzle

# Copy drizzle config
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy package.json for drizzle-kit to work
COPY --from=builder /app/package.json ./package.json

# Copy database wait script
COPY wait-for-db.mjs /app/wait-for-db.mjs

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

CMD ["/docker-entrypoint.sh"]
