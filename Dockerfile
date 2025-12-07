# =============================================================================
# myMemorableAnimes - Production Dockerfile
# Multi-stage build for optimized image size and security
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Compile TypeScript and build assets
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Set build-time environment
ENV NODE_ENV=production

WORKDIR /app

# Install build dependencies for native modules (bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++

# Copy dependency files first (better layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY src ./src
COPY public ./public
COPY tailwind.config.js postcss.config.js ./

# Build TypeScript and CSS
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal production image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Labels for container metadata
LABEL maintainer="Gabriel Danilo <gabrieldnsilva>"
LABEL description="myMemorableAnimes - Anime catalog with user authentication"
LABEL version="2.0.0"

# Install runtime dependencies
# - dumb-init: Proper signal handling (SIGTERM/SIGINT)
# - tini: Alternative init system (fallback)
RUN apk add --no-cache dumb-init

# Create non-root user for security
# Using numeric IDs for better compatibility with Kubernetes
RUN addgroup -g 1001 -S nodejs \
    && adduser -S -u 1001 -G nodejs nodejs

WORKDIR /app

# Copy package files for npm scripts
COPY --from=builder /app/package*.json ./

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create database directory with correct permissions
# Database will be stored in a volume for persistence
RUN mkdir -p /app/database \
    && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set production environment
ENV NODE_ENV=production \
    PORT=3000 \
    # Default database path (can be overridden)
    DATABASE_URL=./database/database.db

# Expose application port
EXPOSE 3000

# Health check configuration
# - Checks /health endpoint every 30 seconds
# - Allows 5 seconds for startup before first check
# - 3 retries before marking unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3000, path: '/health', timeout: 5000 }; \
    const req = http.request(options, (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Use dumb-init as PID 1 for proper signal handling
# This ensures graceful shutdown when container receives SIGTERM
ENTRYPOINT ["dumb-init", "--"]

# Start application using npm script
# npm start includes seeding and running the server
CMD ["npm", "start"]
