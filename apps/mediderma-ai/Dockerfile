# MEDIDERMA AI — 단일 컨테이너 배포용 (Node 22). 빌드 컨텍스트: apps/mediderma-ai
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./
RUN mkdir -p /data && chown node /data
USER node
VOLUME /data
EXPOSE 3200
CMD ["npx", "next", "start", "-p", "3200"]
