# syntax=docker/dockerfile:1
# eligibil.org — Node.js Express app for Cloud Run

FROM node:20-alpine AS base
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY . .

# Cloud Run injects PORT env var (default 8080)
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/grants?limit=1 || exit 1

# Run as non-root user (Alpine has 'node' user pre-installed)
USER node

CMD ["node", "server.js"]
