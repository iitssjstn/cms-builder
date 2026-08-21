# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Compiler-toolchain voor het geval better-sqlite3 (of een andere native module)
# geen kant-en-klare binary heeft voor dit platform en zelf moet compileren.
# Op glibc (dit image) is dat zelden nodig -- in tegenstelling tot Alpine/musl,
# waar dit project eerder op vastliep, zie git-historie van dit bestand.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/sh --no-create-home nodejs

# Copy built assets
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Data- en uploads-mappen aanmaken met correcte rechten.
# /app/data wordt niet uit de builder-stage gekopieerd: die map bestaat daar
# niet (wordt pas bij het opstarten van de app aangemaakt/gevuld) en wordt in
# productie toch als named volume gemount, zie docker-compose.yml.
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nodejs:nodejs /app/data /app/public/uploads

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.js"]
