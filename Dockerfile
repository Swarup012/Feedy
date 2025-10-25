# ---------------------------
# Stage 1: Base image
# ---------------------------
FROM node:20-alpine AS base
WORKDIR /app

# ---------------------------
# Stage 2: Installer
# ---------------------------
FROM base AS installer
COPY package.json package-lock.json* ./
RUN npm install

# ---------------------------
# Stage 3: Builder (Production)
# ---------------------------
FROM base AS builder
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------
# Stage 4: Runner (Production)
# ---------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 5173
ENV PORT=5173

# Default: run production server
CMD ["node", "server.js"]

# ---------------------------
# Optional: Dev mode (hot reload)
# ---------------------------
# To enable dev mode, override CMD when running container:
# docker run -it -p 3000:3000 -v $(pwd):/app -v /app/node_modules feedy npm run dev
