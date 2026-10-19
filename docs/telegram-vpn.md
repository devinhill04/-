# Telegram через VPN if-api

`/api/news` получает публичную страницу `https://t.me/s/if_market_news` через
SSH-клиент к тому же VPN-серверу, что и if-api: `178.208.81.28:22`,
пользователь `if-api-proxy`. Прямое TCP-соединение с Telegram из production
не устанавливается; Nginx возвращал 504 через 5 секунд.

Клиент работает в отдельном контейнере `telegram-vpn` с общей сетью Nginx.
Он использует закреплённый digest образа if-api с SSH-клиентом и существующий
выделенный ключ if-api с проверенным `known_hosts`. Приватные значения не
попадают в репозиторий, ConfigMap, логи или локальные файлы задачи.

if-api использует динамический SOCKS forwarding (`ssh -D`). Для Nginx используется
фиксированный TCP forwarding (`ssh -L 127.0.0.1:8443:t.me:443`), поскольку Nginx
не умеет отправлять HTTP upstream через SOCKS. Сервер VPN сам разрешает `t.me`.
Nginx подключается к loopback-порту 8443, передаёт SNI и Host `t.me` и проверяет
TLS-сертификат Telegram через системные CA. Другие маршруты используют прежние
upstream. При отсутствии туннеля новости недоступны, прямого fallback нет.

## Kubernetes

Парная правка находится в `apps-helm-charts/if-navigation-miniapp/prod`:
контейнер `telegram-vpn`, параметры `telegramProxy`, startup probe с HTTPS-запросом
через туннель. Secret `production/if-navigation-miniapp-ssh-proxy` содержит только
`id_ed25519` и `known_hosts` из `development/if-api-runtime-20261009`, без `.env`
и других секретов API. Он монтируется read-only только в VPN-клиент, с правами
0440 и `fsGroup: 10001`. Startup probe не пропускает новый Pod до успешного ответа Telegram.
SSH keepalive завершает соединение при потере VPN-сервера, после чего Kubernetes
перезапускает контейнер. Nginx продолжает обслуживать остальные маршруты.

Обновлять приложение и chart нужно вместе: новый `/api/news` требует туннель
на `127.0.0.1:8443`. Тег миниаппа продолжает обновлять Argo CD Image Updater.
При ротации SSH-ключа if-api обновить два поля Secret миниаппа. При обновлении
SSH-клиента закрепить новый проверенный digest в chart и Docker Compose.

```bash
kubectl --context yc-site-k8s-cluster -n production logs \
  deployment/if-navigation-miniapp -c nginx --tail=100 --timestamps
kubectl --context yc-site-k8s-cluster -n production logs \
  deployment/if-navigation-miniapp -c telegram-vpn --tail=100 --timestamps
curl --fail --max-time 15 https://app.investfuture.ru/api/news
```

## Docker Compose

Из каталога репозитория с настроенным `DOCKER_IMAGE` и `TELEGRAM_SSH_DIRECTORY`.
Последняя переменная указывает на уже подготовленный вне Git каталог с
`id_ed25519` и проверенным `known_hosts`, доступными на чтение UID 10001.
Приватный ключ должен иметь владельца UID 10001 и права 0600; файлы
монтируются read-only. Kubernetes Secret для Docker Compose автоматически
не выгружается.

```bash
docker compose up -d --force-recreate
docker compose logs -f --tail=100 if-navigation-miniapp telegram-vpn
```

Для обоих образов требуется доступ на pull из существующего приватного registry.
Порт 8443 доступен только внутри общей сети контейнеров, на хост не публикуется.
