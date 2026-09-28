# Multi-stage build для React (по аналогии с LMS frontend)
FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV CI=true
ARG VITE_APP_TITLE=
ARG VITE_TELEGRAM_BOT_USERNAME=
ARG VITE_ANALYTICS_WEBHOOK_URL=
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_TELEGRAM_BOT_USERNAME=${VITE_TELEGRAM_BOT_USERNAME}
ENV VITE_ANALYTICS_WEBHOOK_URL=${VITE_ANALYTICS_WEBHOOK_URL}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN printf '%s\n' \
  "VITE_APP_TITLE=${VITE_APP_TITLE}" \
  "VITE_TELEGRAM_BOT_USERNAME=${VITE_TELEGRAM_BOT_USERNAME}" \
  "VITE_ANALYTICS_WEBHOOK_URL=${VITE_ANALYTICS_WEBHOOK_URL}" \
  > .env
RUN npm run build
FROM nginx:1.27-alpine
RUN apk add --no-cache wget curl \
  && printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location /healthz { access_log off; return 200 "healthy\n"; add_header Content-Type text/plain; }' \
  '  location = /api/news {' \
  '    resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;' \
  '    set $news_upstream "https://t.me/s/if_market_news";' \
  '    proxy_pass $news_upstream;' \
  '    proxy_ssl_server_name on;' \
  '    proxy_set_header Host t.me;' \
  '    proxy_set_header User-Agent "Mozilla/5.0 (compatible; IFMiniApp)";' \
  '    proxy_connect_timeout 5s;' \
  '    proxy_read_timeout 10s;' \
  '    proxy_hide_header Set-Cookie;' \
  '    proxy_hide_header Cache-Control;' \
  '    add_header Cache-Control "public, max-age=1500";' \
  '  }' \
  '  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; try_files $uri =404; }' \
  '  location /data/ { add_header Cache-Control "no-cache, no-store, must-revalidate"; try_files $uri =404; }' \
  '  location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate"; }' \
  '  location / { add_header Cache-Control "no-cache, no-store, must-revalidate"; try_files $uri $uri/ /index.html; }' \
  '}' \
  > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
