# Dedicated multiplayer server image. Build from apps/special-soldier:
#   docker build -f server/Dockerfile -t special-soldier-mp .
#   docker run -p 8787:8787 special-soldier-mp
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server/mp-server.mjs server/
COPY src/net/authority.js src/net/
ENV PORT=8787
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8787/health || exit 1
CMD ["node", "server/mp-server.mjs"]
