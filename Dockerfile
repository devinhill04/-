# Multi-stage build для React (по аналогии с LMS frontend)
FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV CI=true
ARG VITE_APP_TITLE=
ARG VITE_TELEGRAM_BOT_USERNAME=
ARG VITE_ANALYTICS_WEBHOOK_URL=
# Необязательно: --build-arg VITE_COMMIT=$CI_COMMIT_SHORT_SHA — тогда экран диагностики покажет номер коммита
ARG VITE_COMMIT=
ENV VITE_COMMIT=${VITE_COMMIT}
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
RUN apk add --no-cache wget curl ca-certificates \
  && printf '%s\n' \
  'proxy_cache_path /var/cache/nginx/ifquotes levels=1:2 keys_zone=ifquotes:1m max_size=10m inactive=10m use_temp_path=off;' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location = /healthz { access_log off; try_files /index.html =503; }' \
  '  location = /robots.txt { default_type text/plain; add_header Cache-Control "public, max-age=3600"; try_files /robots.txt =404; }' \
  '  location = /api/if-calendar/bonds {' \
  '    resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;' \
  '    set $if_cal_bonds "https://investfuture.ru/calendar/bonds$is_args$args";' \
  '    proxy_pass $if_cal_bonds;' \
  '    proxy_ssl_server_name on;' \
  '    proxy_set_header Host investfuture.ru;' \
  '    proxy_set_header User-Agent "Mozilla/5.0 (compatible; IFMiniApp)";' \
  '    proxy_set_header Accept-Encoding "";' \
  '    proxy_connect_timeout 5s;' \
  '    proxy_read_timeout 10s;' \
  '    proxy_hide_header Set-Cookie;' \
  '    proxy_hide_header Cache-Control;' \
  '    add_header Cache-Control "public, max-age=300";' \
  '  }' \
  '  location = /api/if-calendar/key-rate {' \
  '    resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;' \
  '    set $if_cal_kr "https://investfuture.ru/calendar/key-rate";' \
  '    proxy_pass $if_cal_kr;' \
  '    proxy_ssl_server_name on;' \
  '    proxy_set_header Host investfuture.ru;' \
  '    proxy_set_header User-Agent "Mozilla/5.0 (compatible; IFMiniApp)";' \
  '    proxy_set_header Accept-Encoding "";' \
  '    proxy_connect_timeout 5s;' \
  '    proxy_read_timeout 10s;' \
  '    proxy_hide_header Set-Cookie;' \
  '    proxy_hide_header Cache-Control;' \
  '    add_header Cache-Control "public, max-age=300";' \
  '  }' \
  '  location = /api/news {' \
  '    set $news_upstream "https://127.0.0.1:8443/s/if_market_news";' \
  '    proxy_pass $news_upstream;' \
  '    proxy_ssl_server_name on;' \
  '    proxy_ssl_name t.me;' \
  '    proxy_ssl_verify on;' \
  '    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;' \
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
  '  include /etc/nginx/conf.d/quotes-api.inc;' \
  '}' \
  > /etc/nginx/conf.d/default.conf
# API котировок InvestFuture. Токен НЕ хранится в образе: при старте контейнера стандартный скрипт nginx
# (/docker-entrypoint.d/20-envsubst-on-templates.sh) подставляет переменную окружения QUOTES_API_TOKEN
# из секрета в шаблон и пишет /etc/nginx/conf.d/quotes-api.inc. Если переменной нет или шаблон не обработан —
# остаётся запасной quotes-api.inc: маршруты отвечают 503 token_not_configured, nginx стартует, приложение
# работает на прежних источниках.
# Токен можно передать при сборке из переменной GitLab (--build-arg QUOTES_API_TOKEN=...) — тогда он лежит в образе
# и виден тем, у кого есть доступ к реестру. Правильнее — секрет Kubernetes в деплое: он перекрывает это значение.
ARG QUOTES_API_TOKEN=
ENV QUOTES_API_TOKEN=${QUOTES_API_TOKEN}
ENV NGINX_ENVSUBST_FILTER=QUOTES_API_TOKEN
RUN mkdir -p /etc/nginx/templates /var/cache/nginx/ifquotes \
  && printf '%s\n' \
  'location = /api/ifq/overview {' \
  '  default_type application/json;' \
  '  set $ifq_token "${QUOTES_API_TOKEN}";' \
  '  if ($ifq_token = "") { return 503 "{\"error\":\"token_not_configured\"}"; }' \
  '  resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;' \
  '  set $ifq_upstream "https://investfuture.ru/api/v1/market-snapshot?universe=overview";' \
  '  proxy_pass $ifq_upstream;' \
  '  proxy_ssl_server_name on;' \
  '  proxy_ssl_name investfuture.ru;' \
  '  proxy_ssl_verify on;' \
  '  proxy_ssl_verify_depth 3;' \
  '  proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;' \
  '  proxy_set_header Host investfuture.ru;' \
  '  proxy_set_header Authorization "Bearer $ifq_token";' \
  '  proxy_set_header Cookie "";' \
  '  proxy_set_header Accept-Encoding "";' \
  '  proxy_connect_timeout 5s;' \
  '  proxy_read_timeout 10s;' \
  '  proxy_cache ifquotes;' \
  '  proxy_cache_key "ifq-overview";' \
  '  proxy_cache_valid 200 30s;' \
  '  proxy_cache_valid any 5s;' \
  '  proxy_cache_lock on;' \
  '  proxy_cache_lock_timeout 10s;' \
  '  proxy_cache_use_stale error timeout updating http_429 http_500 http_502 http_503 http_504;' \
  '  proxy_cache_background_update on;' \
  '  proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;' \
  '  proxy_hide_header Set-Cookie;' \
  '  proxy_hide_header Cache-Control;' \
  '  add_header Cache-Control "public, max-age=20" always;' \
  '  add_header X-IFQ-Cache $upstream_cache_status always;' \
  '}' \
  'location = /api/ifq/top40 {' \
  '  default_type application/json;' \
  '  set $ifq_token "${QUOTES_API_TOKEN}";' \
  '  if ($ifq_token = "") { return 503 "{\"error\":\"token_not_configured\"}"; }' \
  '  resolver 1.1.1.1 8.8.8.8 valid=300s ipv6=off;' \
  '  set $ifq_upstream "https://investfuture.ru/api/v1/market-snapshot?universe=moex-top40";' \
  '  proxy_pass $ifq_upstream;' \
  '  proxy_ssl_server_name on;' \
  '  proxy_ssl_name investfuture.ru;' \
  '  proxy_ssl_verify on;' \
  '  proxy_ssl_verify_depth 3;' \
  '  proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;' \
  '  proxy_set_header Host investfuture.ru;' \
  '  proxy_set_header Authorization "Bearer $ifq_token";' \
  '  proxy_set_header Cookie "";' \
  '  proxy_set_header Accept-Encoding "";' \
  '  proxy_connect_timeout 5s;' \
  '  proxy_read_timeout 10s;' \
  '  proxy_cache ifquotes;' \
  '  proxy_cache_key "ifq-top40";' \
  '  proxy_cache_valid 200 30s;' \
  '  proxy_cache_valid any 5s;' \
  '  proxy_cache_lock on;' \
  '  proxy_cache_lock_timeout 10s;' \
  '  proxy_cache_use_stale error timeout updating http_429 http_500 http_502 http_503 http_504;' \
  '  proxy_cache_background_update on;' \
  '  proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;' \
  '  proxy_hide_header Set-Cookie;' \
  '  proxy_hide_header Cache-Control;' \
  '  add_header Cache-Control "public, max-age=20" always;' \
  '  add_header X-IFQ-Cache $upstream_cache_status always;' \
  '}' \
  > /etc/nginx/templates/quotes-api.inc.template \
  && printf '%s\n' \
  'location = /api/ifq/overview {' \
  '  default_type application/json;' \
  '  return 503 "{\"error\":\"token_not_configured\"}";' \
  '}' \
  'location = /api/ifq/top40 {' \
  '  default_type application/json;' \
  '  return 503 "{\"error\":\"token_not_configured\"}";' \
  '}' \
  > /etc/nginx/conf.d/quotes-api.inc
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
