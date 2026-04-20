FROM public.ecr.aws/docker/library/node:20-slim AS builder
WORKDIR /app

# Memory limit for build
ENV NODE_OPTIONS=--max-old-space-size=400
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps --no-optional --no-audit --no-fund

# Build
COPY . .
RUN npm run build

FROM public.ecr.aws/docker/library/node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
