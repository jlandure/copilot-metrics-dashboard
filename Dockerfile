# =====================================================
# Stage 1: Build
# =====================================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies (clean install for reproducibility)
RUN npm ci --silent

# Copy source code
COPY . .

# Production build
RUN npm run build

# =====================================================
# Stage 2: Production avec nginx
# =====================================================
FROM nginx:1.27-alpine AS production

# OCI labels for metadata
LABEL org.opencontainers.image.source="https://github.com/your-org/copilot-metrics-dashboard"
LABEL org.opencontainers.image.description="Copilot Metrics Dashboard"
LABEL org.opencontainers.image.licenses="MIT"

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Remove default nginx configuration
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run injects PORT via environment variable
# Copy entrypoint script for dynamic port substitution
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Adjust permissions for nginx and non-root user
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Use non-root user
USER appuser

# Expose port (documentation, Cloud Run uses $PORT)
EXPOSE 8080

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/ || exit 1

# Entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
