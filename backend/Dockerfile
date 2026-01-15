FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN npm install --production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
