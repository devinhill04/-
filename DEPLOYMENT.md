# Публикация на if.investfuture.ru

Приложение собирается Vite в `dist`, затем Nginx отдаёт статические файлы.
Production работает в Kubernetes через Helm и Argo CD.

## GitLab CI

- `check-app`: установка зависимостей по lockfile, TypeScript и production-сборка
  для merge request и основной ветки.
- `build-docker`: сборка и публикация образа из основной ветки в
  `cr.yandex/crpvhgo33ec1f8rrvb74/if-navigation-miniapp:<CI_COMMIT_SHORT_SHA>.production`.
- Плановая синхронизация популярности тегов сохранена.

Используется существующий runner с тегом `gitlab-lms`. Для Docker-in-Docker
ему нужны privileged mode и общий каталог `/certs/client` для job и сервиса.

### Переменные CI/CD

| Переменная | Значение |
| --- | --- |
| `YCR_JSON_KEY` | Docker `config.json` с аутентификацией для `cr.yandex`, как в CI проектов `if-app` и `if-panel`. Поддерживаются переменные типов File и Variable. |
| `YCR_PATH` | По умолчанию `cr.yandex/crpvhgo33ec1f8rrvb74/if-navigation-miniapp`. При переопределении также обновить `image.name` и аннотацию `image-list` в Helm. |
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

## Первый запуск и автоматические обновления

1. Настроить `YCR_JSON_KEY` и runner, слить ветку изменений приложения в основную.
2. Дождаться успешной job `build-docker` с тегом `<SHA>.production`.
3. Опубликовать Helm-конфигурацию в `main` репозитория `apps-helm-charts`
   и один раз зарегистрировать `if-navigation-miniapp/application.yaml` в Argo CD.

Далее работает та же схема, что у `monolith-production`:

```text
CI → образ <SHA>.production в Yandex Registry
   → Image Updater → коммит .argocd-source-…yaml в Helm main
   → Argo CD → обновлённый сайт
```

Image Updater выбирает свежую сборку среди тегов `^[0-9a-f]{8}\.production$`
и записывает `image.name` и `image.tag` в
`if-navigation-miniapp/prod/.argocd-source-if-navigation-miniapp-production.yaml`.
Ручная подстановка SHA не нужна даже для первого запуска: до обнаружения образа
chart не создаёт Deployment, а `force-update: "true"` включает его обнаружение
без работающего Pod. После первого коммита Updater Deployment появится автоматически.

Chart использует namespace `production`, `yandex-registry-secret`,
`tls-secret` и ingress-класс `nginx-production` для `if.investfuture.ru`.
Балансировщик `51.250.115.232` уже направляет трафик к этому контроллеру.
Image Updater читает registry через `argocd/yandex-registry-secret` и пишет
в Helm-репозиторий с существующими учётными данными Argo CD.

После начальной настройки для выкладки достаточно успешной сборки основной
ветки. Для отката сначала приостановить обновления miniapp в Image Updater,
затем вернуть предыдущий тег в его `.argocd-source-…yaml` через Git;
подробности в README Helm chart.

Job для выкладки по SSH на VM удалена. `DEPLOY_SERVER`, `DEPLOY_USER`,
`SSH_PRIVATE_KEY` и GitLab Registry credentials этому pipeline не нужны.
`docker-compose.yml` можно использовать отдельно для локального запуска образа.
