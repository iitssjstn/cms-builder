# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# better-sqlite3 is een native module. Als er geen kant-en-klare binary is
# voor deze Node/Alpine(musl)-combinatie, valt npm terug op node-gyp, wat een
# C/C++ toolchain nodig heeft die Alpine niet standaard meelevert.
RUN apk add --no-cache python3 py3-setuptools make g++ linux-headers

# Forceer compilatie vanaf source i.p.v. een gedownloade prebuilt binary.
# Prebuilt binaries voor better-sqlite3 zijn tegen glibc gelinkt; Alpine
# gebruikt musl, wat op runtime een "symbol not found: fcntl64"-crash geeft.
ENV npm_config_build_from_source=true

COPY package*.json ./
RUN npm ci

# Forceer een verse, lokale compile van better-sqlite3 op dit exacte
# Alpine(musl)-systeem. npm's eigen install-heuristiek (prebuild-install
# met een 'build-from-source'-vlag) blijkt niet betrouwbaar de gedownloade,
# tegen glibc gelinkte prebuilt binary te vervangen -- dus we roepen
# node-gyp hier expliciet en direct aan, zodat er geen twijfel over bestaat
# dat de binary daadwerkelijk op dit systeem gebouwd is.
RUN rm -rf node_modules/better-sqlite3/build && \
    cd node_modules/better-sqlite3 && \
    ../.bin/node-gyp rebuild --release && \
    test -f build/Release/better_sqlite3.node

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

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
