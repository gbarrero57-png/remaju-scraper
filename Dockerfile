FROM node:22-slim

# Dependencias del sistema para Playwright/Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    python3 \
    make \
    g++ \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV PROXY_SERVER=http://geo.iproyal.com:12321
ENV PROXY_USERNAME=C3JW6OyAJzKHiyWk
ENV PROXY_PASSWORD=DZtORkEUEOsRppKT_country-pe_city-lima
ENV ADMIN_TELEGRAM_TOKEN=8481244553:AAG1p0ExiDfLP1khxYzzRp-OLj5ik-MuH4s
ENV ADMIN_TELEGRAM_CHAT_ID=7727513100
ENV SUPABASE_URL=https://rdjpkfcztnourihqpffe.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkanBrZmN6dG5vdXJpaHFwZmZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY0MTU0NCwiZXhwIjoyMDk0MjE3NTQ0fQ.UhX4I_06RIoqPVx9Gyw0W1U_ABobWUDlkYl16waZGjs
ENV PAYMENT_PRICE_SOLES=75
ENV PAYMENT_YAPE=905858566
ENV PAYMENT_PLIN=905858566
ENV PAYMENT_ADMIN_NAME="Gabriel Barrero"

WORKDIR /app

RUN mkdir -p /app/data

COPY package.json .
RUN npm install --omit=dev

ARG CACHEBUST=3
COPY src/ ./src/

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["sh", "-c", "echo '177.54.156.39 p.webshare.io' >> /etc/hosts && node src/server.js"]
