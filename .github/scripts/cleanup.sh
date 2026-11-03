#!/usr/bin/env bash
# Чистка репозитория после релиза (правило проекта, см. CLAUDE.md):
#   1. удаляет все релизы и их теги, кроме текущей версии из package.json;
#   2. удаляет прогоны GitHub Actions, оставляя у каждого workflow только самый свежий.
# Нужны переменные окружения REPO (owner/name) и GH_TOKEN
# (права contents: write и actions: write). CURRENT_RUN — id текущего прогона, его не трогаем.
set -u

VERSION=$(node -p "require('./package.json').version")

echo "== Релизы: оставляем v$VERSION =="
gh release list --repo "$REPO" --limit 100 --json tagName -q '.[].tagName' | while read -r TAG; do
  [ -z "$TAG" ] && continue
  [ "$TAG" = "v$VERSION" ] && continue
  echo "Deleting release $TAG"
  gh release delete "$TAG" --repo "$REPO" --yes --cleanup-tag || true
done

echo "== Прогоны Actions: оставляем самый свежий у каждого workflow =="
# API отдаёт прогоны от новых к старым: первый встреченный у workflow — самый свежий.
declare -A seen
gh api --paginate "repos/$REPO/actions/runs?per_page=100" \
  -q '.workflow_runs[] | "\(.id) \(.workflow_id) \(.status)"' | while read -r ID WF STATUS; do
  [ -z "$ID" ] && continue
  if [ -z "${seen[$WF]:-}" ]; then
    seen[$WF]=1
    continue
  fi
  [ "$ID" = "${CURRENT_RUN:-}" ] && continue
  [ "$STATUS" != "completed" ] && continue # идущие прогоны удалить нельзя
  echo "Deleting run $ID"
  gh api -X DELETE "repos/$REPO/actions/runs/$ID" || true
done
