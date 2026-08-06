FROM node:26.2.0-alpine

ENV NODE_ENV=production

RUN npm install -g pnpm@11.5.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile --prod

COPY apps/worker apps/worker
COPY packages/db packages/db

USER node

CMD ["node", "apps/worker/src/index.ts"]
