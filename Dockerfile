FROM node:26.2.0-alpine AS builder

ARG VITE_APP_NAME=Veles
ARG VITE_CF_CDN_URL=https://cdn.example.com

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_CF_CDN_URL=$VITE_CF_CDN_URL

RUN npm install -g pnpm@11.5.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:26.2.0-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

RUN apk add --no-cache nginx supervisor

COPY --chown=node:node --from=builder /app/.output ./.output
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
