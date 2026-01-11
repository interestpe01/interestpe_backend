# Dockerfile
FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# OS deps for building native modules and pg client
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libpq-dev \
    postgresql-client \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for caching
COPY package*.json ./

# Install node deps (dev deps included for dev mode)
RUN npm install

# Copy app source
COPY . .

# Make the wait script executable
RUN chmod +x ./wait-for-postgres.sh

EXPOSE 5000

# Wait for Postgres, then start app via package.json start script
CMD ["sh", "-c", "./wait-for-postgres.sh && npm run start"]
