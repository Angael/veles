FROM node:22-alpine AS builder

# Build arguments for Vite (baked in at build time)
ARG VITE_CF_CDN_URL
ARG VITE_BASE_URL
ARG VITE_APP_TITLE

ENV VITE_CF_CDN_URL=$VITE_CF_CDN_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm ts
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

# Copy only the built application
COPY --from=builder /app/.output .output

EXPOSE 3000

# Start the application directly (no migrations, no wait scripts)
CMD ["node", "--import", "./.output/server/instrument.server.mjs", ".output/server/index.mjs"]
