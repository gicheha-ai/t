# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Python and build dependencies (for tensorflow if needed)
RUN apk add --no-cache python3 py3-pip make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV MONGODB_URI=${MONGODB_URI}
ENV JWT_SECRET=${JWT_SECRET}
ENV MPESA_CONSUMER_KEY=${MPESA_CONSUMER_KEY}
ENV MPESA_CONSUMER_SECRET=${MPESA_CONSUMER_SECRET}
ENV ML_SERVICE_URL=http://localhost:5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/api/health', (r) => {if(r.statusCode!==200)throw new Error()})"

# Start application
CMD ["node", "server.js"]