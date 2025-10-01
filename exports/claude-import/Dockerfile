# Multi-stage Dockerfile for Sunzi Cerebro Enterprise
# Production-ready containerization with optimization

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Backend Build
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Copy backend source
COPY backend/ .

# Stage 3: Production Runtime
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sunzi -u 1001 -G nodejs

WORKDIR /app

# Copy built backend
COPY --from=backend-builder --chown=sunzi:nodejs /app/backend ./backend

# Copy built frontend
COPY --from=frontend-builder --chown=sunzi:nodejs /app/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/exports /app/backups && \
    chown -R sunzi:nodejs /app

# Install PM2 for process management
RUN npm install -g pm2@latest

# Health check
COPY docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Copy PM2 ecosystem configuration
COPY docker/ecosystem.config.js /app/ecosystem.config.js

# Switch to non-root user
USER sunzi

# Expose ports
EXPOSE 8890

# Environment variables
ENV NODE_ENV=production
ENV PORT=8890
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=sunzi_cerebro
ENV DB_USER=sunzi_cerebro
ENV DB_PASSWORD=cerebro_production

# Start application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

# Labels for container metadata
LABEL org.opencontainers.image.title="Sunzi Cerebro Enterprise"
LABEL org.opencontainers.image.description="Enterprise Security Intelligence Platform with 272+ Security Tools"
LABEL org.opencontainers.image.version="3.2.0"
LABEL org.opencontainers.image.vendor="Sunzi Cerebro Team"
LABEL org.opencontainers.image.licenses="Enterprise"
LABEL org.opencontainers.image.source="https://github.com/sunzi-cerebro/enterprise"