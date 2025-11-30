# syntax=docker/dockerfile:1
# Force rebuild: 2025-11-30-1608

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json ./

# Pulisci eventuali build precedenti e ricompila
RUN rm -rf dist && npm run build

# Rimuovi devDependencies per produzione
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000
CMD ["node", "dist/index.js"]
