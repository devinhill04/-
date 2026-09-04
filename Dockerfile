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
COPY package.json package-lock.json* ./
RUN npm install
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
  '  location / { try_files $uri $uri/ /index.html; }' \
  '}' \
  > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
