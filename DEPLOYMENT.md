# Публикация на if.investfuture.ru

Приложение собирается Vite в `dist`, затем Nginx отдаёт статические файлы.
Production работает в Kubernetes через Helm и Argo CD.

## GitLab CI

- `check-app`: установка зависимостей по lockfile, TypeScript и production-сборка
  для merge request и основной ветки.
- `build-docker`: сборка и публикация образа из основной ветки в
  `cr.yandex/crpvhgo33ec1f8rrvb74/if-navigation-miniapp:<CI_COMMIT_SHORT_SHA>`.
- Плановая синхронизация популярности тегов сохранена.

Используется существующий runner с тегом `gitlab-lms`. Для Docker-in-Docker
ему нужны privileged mode и общий каталог `/certs/client` для job и сервиса.

### Переменные CI/CD

| Переменная | Значение |
| --- | --- |
| `YCR_JSON_KEY` | Docker `config.json` с аутентификацией для `cr.yandex`, как в CI проектов `if-app` и `if-panel`. Поддерживаются переменные типов File и Variable. |
| `YCR_PATH` | По умолчанию `cr.yandex/crpvhgo33ec1f8rrvb74/if-navigation-miniapp`. При переопределении также обновить `image.repository` в Helm. |
| `VITE_APP_TITLE`, `VITE_TELEGRAM_BOT_USERNAME`, `VITE_ANALYTICS_WEBHOOK_URL` | Необязательные параметры frontend, встраиваются при сборке. |

`YCR_JSON_KEY` содержит именно Docker config с секцией `auths` для `cr.yandex`,
а не исходный JSON авторизованного ключа сервисного аккаунта. Учётной записи
нужно право `container-registry.images.pusher` на целевой registry/repository.
Формат аутентификации описан в [документации Yandex Container Registry](https://yandex.cloud/ru/docs/container-registry/operations/authentication).

Настроить переменную в GitLab проекта; при scope `production` она доступна
job `build-docker` с `environment: production` и `action: prepare`.
Для protected-переменной основная ветка также должна быть protected.
Конфигурация Docker создаётся во временном каталоге вне контекста сборки
и удаляется при завершении job. Секреты в репозиторий не добавлять.

## Первый запуск

1. Настроить `YCR_JSON_KEY` и runner, слить ветку изменений приложения в основную.
2. Дождаться успешной job `build-docker` и взять её `CI_COMMIT_SHORT_SHA`.
3. В `apps-helm-charts/if-navigation-miniapp/prod/values-prod.yaml` задать
   `image.tag` равным этому SHA. Если merge создал новый коммит, использовать
   SHA именно сборки основной ветки.
4. Опубликовать Helm-конфигурацию и зарегистрировать
   `apps-helm-charts/if-navigation-miniapp/application.yaml` в Argo CD.

Chart использует namespace `production`, `yandex-registry-secret`,
`tls-secret` и ingress-класс `nginx-production` для `if.investfuture.ru`.
Балансировщик `51.250.115.232` уже направляет трафик к этому контроллеру.

Дальнейшие обновления: сборка образа → изменение SHA в Helm → синхронизация
Argo CD. Автоматическая запись SHA из CI в Helm-репозиторий не настроена.
Для отката вернуть предыдущий тег в Helm.

Job для выкладки по SSH на VM удалена. `DEPLOY_SERVER`, `DEPLOY_USER`,
`SSH_PRIVATE_KEY` и GitLab Registry credentials этому pipeline не нужны.
`docker-compose.yml` можно использовать отдельно для локального запуска образа.
