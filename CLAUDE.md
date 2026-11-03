# AVN Binder

Electron + React + TypeScript (electron-vite). Сборка и публикация — GitHub Actions
(`.github/workflows/build-win.yml`), релизы в этом же репозитории (`Snuchi/application`).

## Релизы

- **Правило: при каждом новом релизе всё старое удаляется** — остаётся только текущая
  версия и её тег. Старые релизы и теги удаляет сам workflow **Build Windows**
  (job `cleanup-old-releases`) после успешной публикации. Ручная чистка — workflow
  **Cleanup old releases** (Actions → Cleanup old releases → Run workflow).
- Не удалять релиз текущей версии — по нему работают автообновления установленных
  приложений (electron-updater читает `latest.yml`) и постоянная ссылка
  `releases/latest/download/AVN-Binder.exe`.
- Перед запуском релиза поднять версию в `package.json` (тег релиза — `v<версия>`).
  Релиз собирается на каждый пуш в `claude/**` и `main`.
- Пуш и удаление тегов из сессии Claude Code блокируются git-прокси — все операции
  с тегами/релизами делать через GitHub Actions.
