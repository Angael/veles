FROM node:26.2.0-alpine AS builder

ARG VITE_APP_NAME=Veles
ARG VITE_APP_URL=http://localhost:3000
ARG VITE_CF_CDN_URL=https://cdn.example.com

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_CF_CDN_URL=$VITE_CF_CDN_URL

RUN npm install -g pnpm@11.5.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:26.2.0-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
