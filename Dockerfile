FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

# Copy only the built application
COPY --from=builder /app/.output .output

EXPOSE 3000

# Start the application directly (no migrations, no wait scripts)
CMD ["node", "--import", "./.output/server/instrument.server.mjs", ".output/server/index.mjs"]
