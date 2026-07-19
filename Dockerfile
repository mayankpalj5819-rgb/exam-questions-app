FROM node:20-alpine AS base

# Install Bun
RUN npm install -g bun

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN npx prisma generate
RUN bun install --frozen-lockfile

# --- Builder stage ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN bun run build

# Copy static assets into standalone output
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install Bun for runtime
RUN npm install -g bun

ENV NODE_ENV=production

# Copy standalone Next.js server
COPY --from=builder /app/.next/standalone ./

# Create db directory (database must be seeded separately)
RUN mkdir -p db

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]