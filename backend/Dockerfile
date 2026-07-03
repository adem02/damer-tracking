# ---- Base ----
FROM node:22.15.0-alpine AS base
WORKDIR /app
ENV NODE_ENV=development

# ---- Dependencies ----
FROM base AS deps
COPY package.json yarn.lock ./
# Le postinstall lance `prisma generate` : le schéma doit être présent.
COPY prisma.config.ts ./
COPY prisma ./prisma
# DATABASE_URL factice, requise par prisma.config.ts au moment du generate.
# `prisma generate` ne se connecte pas ; le vrai URL est injecté au runtime.
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public" \
  yarn install --frozen-lockfile

# ---- Development ----
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Régénère le client Prisma (volume monté) et applique les migrations avant le watch.
CMD ["sh", "-c", "yarn prisma:generate && yarn prisma:deploy && yarn start:dev"]
