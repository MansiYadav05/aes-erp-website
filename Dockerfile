# Stage 1: Build the frontend
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend assets
COPY --from=builder /app/dist ./dist
# Copy server source and database schema
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/database/schema.sql ./database/schema.sql

# Ensure database directory exists for SQLite
RUN mkdir -p database

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]