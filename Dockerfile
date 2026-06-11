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

# Configure npm for better network reliability
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Use npm ci for faster, more reliable installs (requires package-lock.json)
RUN npm ci --prefer-offline --no-audit 
 
# --------------------------- 
# Stage 3: Builder (Production) 
# --------------------------- 
FROM base AS builder 
 
# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL 
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY 
 
COPY --from=installer /app/node_modules ./node_modules 
COPY . . 
 
# Create public directory if it doesn't exist 
RUN mkdir -p public 
 
RUN npm run build 
 
# --------------------------- 
# Stage 4: Runner (Production) 
# --------------------------- 
FROM base AS runner 
WORKDIR /app 
 
# Pass the build args to runtime stage
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NODE_ENV=production 
 
RUN addgroup --system --gid 1001 nodejs \ 
&& adduser --system --uid 1001 nextjs 
 
# Copy build outputs 
# Copy public folder (created if not exists) 
COPY --from=builder /app/public ./public 
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static 
 
USER nextjs 
EXPOSE 5173 
ENV PORT=5173
ENV HOSTNAME="0.0.0.0"
 
# Health check 
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \ 
CMD node -e "require('http').get('http://localhost:5173', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 
 
# Default: run production server 
CMD ["node", "server.js"] 
 
# --------------------------- 
# Optional: Dev mode (hot reload) 
# --------------------------- 
# To enable dev mode, override CMD when running container: 
# docker run -it -p 3000:3000 -v $(pwd):/app -v /app/node_modules feedy npm run dev 

 

 
