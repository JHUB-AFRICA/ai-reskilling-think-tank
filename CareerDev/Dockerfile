# ============================================================
# Frontend Dockerfile — AI Reskilling Platform (React/Vite)
# ============================================================
# Multi-stage build: Node builder compiles the app, Nginx serves it.
# Build: docker build -t ai-reskilling-frontend .
# Run:   docker run -p 80:80 ai-reskilling-frontend
# ============================================================

# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install dependencies
# Use npm install instead of npm ci to handle lockfile version differences
# between the local npm version and the container's npm version.
RUN npm install --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Build args for environment variables (passed at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL=https://ai-reskilling-api.up.railway.app

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

# Type-check and build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runner

# Copy Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
