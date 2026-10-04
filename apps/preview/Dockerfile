FROM node:26.2.0-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g pnpm@12.3.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/preview/package.json apps/preview/package.json
RUN pnpm install --frozen-lockfile --prod --filter @veles/preview --filter veles

COPY --chown=node:node apps/preview/src apps/preview/src
RUN mkdir /data && chown node:node /data
WORKDIR /app/apps/preview
USER node
EXPOSE 3000
CMD ["node", "src/index.ts"]
