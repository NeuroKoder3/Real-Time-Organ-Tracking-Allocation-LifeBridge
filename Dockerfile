# syntax=docker/dockerfile:1.7

# ======================================
# Stage 1: Install Dependencies
# ======================================
FROM node:20-bookworm-slim AS deps
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# ======================================
# Stage 2: Build App (client + server)
# ======================================
FROM node:20-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

# Build client and server
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm run build:client && pnpm run build:server

# ======================================
# Stage 3: Production Runtime
# ======================================
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy only what’s needed
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 5000

# ✅ Run compiled server entrypoint (matches tsconfig + package.json build output)
CMD ["node", "dist/server/server/index.js"]
