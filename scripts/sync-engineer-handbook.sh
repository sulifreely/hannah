#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ENGINEER_HANDBOOK_SRC:-$ROOT/../engineer/.vitepress/dist}"
DEST="$ROOT/public/engineer/handbook"

if [[ ! -d "$SRC" ]]; then
  if [[ -f "$DEST/index.html" ]]; then
    echo "skip sync: engineer dist not found, using existing public/engineer/handbook"
    exit 0
  fi
  echo "error: engineer handbook dist not found at $SRC" >&2
  echo "hint: run 'pnpm docs:build' in the engineer repo first" >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
rsync -a --delete "$SRC/" "$DEST/"
echo "synced engineer handbook -> public/engineer/handbook"
