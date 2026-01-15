FROM node:18-alpine

WORKDIR /app

# Install Python (for tensorflow if needed)
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]