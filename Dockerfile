# Dockerfile for Open-LLM-VTuber Electron Web Application

# Use the official Node.js 20 Alpine image
FROM node:20-alpine AS base

# Build stage
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy web-specific package files
COPY package.web.json ./package.json

# Install all dependencies (including dev dependencies for building)
RUN npm install

COPY . .

# Set environment variables for build
ENV NODE_ENV=production

# Accept build args for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL

# Set environment variables from build args
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build the web version of the application
RUN npm run build:web

# Production image, copy all the files
FROM base AS runner
WORKDIR /app

# Copy the build output
COPY --from=builder /app/dist/web ./dist/web

# Copy package.json for version info
COPY --from=builder /app/package.json ./

EXPOSE 3001

# Install a simple HTTP server and serve the static files
RUN npm install -g http-server

# Serve the static files
CMD ["http-server", "/app/dist/web", "-p", "3001", "-a", "0.0.0.0"]