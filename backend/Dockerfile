# ---- Base ----
FROM node:22.15.0-alpine AS base
WORKDIR /app
ENV NODE_ENV=development

# ---- Dependencies ----
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---- Development ----
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["yarn", "start:dev"]
