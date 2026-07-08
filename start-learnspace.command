#!/bin/zsh

cd "$(dirname "$0")"

NODE_BIN="/Users/volodya102201mail.ru/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
PNPM="/Users/volodya102201mail.ru/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pnpm"

if [ ! -x "$PNPM" ]; then
  echo "Не найден встроенный pnpm Codex."
  echo "Тогда установи Node.js LTS с https://nodejs.org и запусти: npm install -g pnpm"
  read "?Нажми Enter, чтобы закрыть окно..."
  exit 1
fi

export PATH="$NODE_BIN:$PATH"

echo "Открываю LearnSpace..."
echo "Адрес будет: http://localhost:3000"
echo ""

if [ ! -d "node_modules" ]; then
  echo "Устанавливаю зависимости. Это может занять несколько минут..."
  "$PNPM" install
fi

"$PNPM" exec next dev -H 127.0.0.1 -p 3000

read "?Нажми Enter, чтобы закрыть окно..."
