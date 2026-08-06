FROM node:26.2.0-alpine AS builder

ARG VITE_APP_NAME=Veles
ARG VITE_CF_CDN_URL=https://cdn.example.com

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_CF_CDN_URL=$VITE_CF_CDN_URL

RUN npm install -g pnpm@11.5.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/db packages/db

RUN pnpm --filter @veles/web build

FROM node:26.2.0-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --chown=node:node --from=builder /app/apps/web/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
