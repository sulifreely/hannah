#!/usr/bin/env bash
#
# install-skills.sh — register this repo's skills so agents (Cursor / Claude) can call them.
#
# Any directory under ./skills that contains a SKILL.md is treated as a skill (discovered at
# any nesting depth, e.g. skills/personal/<skill>/SKILL.md) and symlinked into the agent skill
# directories (~/.cursor/skills and ~/.claude/skills by default).
# Agents discover skills from those folders, so a symlink makes the skill callable while
# keeping the source of truth here in the repo.
#
# Usage:
#   ./install-skills.sh                 # install all skills (symlink, skip existing)
#   ./install-skills.sh --force         # replace existing links/dirs of the same name
#   ./install-skills.sh --uninstall     # remove links that point back into this repo
#   ./install-skills.sh --dry-run       # print what would happen, change nothing
#   ./install-skills.sh --list          # list the skills discovered in this repo
#   ./install-skills.sh --targets a,b   # override target dirs (comma separated)
#
# Flags can be combined, e.g. `./install-skills.sh --uninstall --dry-run`.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_ROOT="$REPO_ROOT/skills"

DEFAULT_TARGETS=("$HOME/.cursor/skills" "$HOME/.claude/skills")

FORCE=0
UNINSTALL=0
DRY_RUN=0
LIST_ONLY=0
TARGETS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1 ;;
    --uninstall) UNINSTALL=1 ;;
    --dry-run|-n) DRY_RUN=1 ;;
    --list) LIST_ONLY=1 ;;
    --targets)
      shift
      [[ $# -gt 0 ]] || { echo "error: --targets needs a value" >&2; exit 2; }
      IFS=',' read -r -a TARGETS <<< "$1"
      ;;
    -h|--help)
      sed -n '3,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "error: unknown argument '$1' (try --help)" >&2; exit 2 ;;
  esac
  shift
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=("${DEFAULT_TARGETS[@]}")
fi

# --- discover skills (any dir under ./skills containing SKILL.md, at any depth) ------
SKILL_DIRS=()
seen_names=" "
if [[ -d "$SKILLS_ROOT" ]]; then
  while IFS= read -r skill_md; do
    dir="$(cd "$(dirname "$skill_md")" && pwd)"
    name="$(basename "$dir")"
    # a symlinked skill name is a single flat dir; guard against collisions across categories
    case "$seen_names" in
      *" $name "*)
        echo "warning: duplicate skill name '$name' ($dir); keeping the first, skipping this one" >&2
        continue
        ;;
    esac
    seen_names+="$name "
    SKILL_DIRS+=("$dir")
  done < <(find "$SKILLS_ROOT" -name SKILL.md | sort)
fi

if [[ ${#SKILL_DIRS[@]} -eq 0 ]]; then
  echo "No skills found (looked for SKILL.md at any depth under $SKILLS_ROOT)." >&2
  exit 1
fi

if [[ $LIST_ONLY -eq 1 ]]; then
  echo "Skills in $SKILLS_ROOT:"
  for d in "${SKILL_DIRS[@]}"; do
    echo "  - $(basename "$d")"
  done
  exit 0
fi

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] $*"
  else
    "$@"
  fi
}

action_label=$([[ $UNINSTALL -eq 1 ]] && echo "Uninstalling" || echo "Installing")
echo "$action_label ${#SKILL_DIRS[@]} skill(s) from: $REPO_ROOT"
[[ $DRY_RUN -eq 1 ]] && echo "(dry-run: no changes will be made)"

for target in "${TARGETS[@]}"; do
  echo
  echo "Target: $target"
  [[ $UNINSTALL -eq 1 || -d "$target" ]] || run mkdir -p "$target"

  for src in "${SKILL_DIRS[@]}"; do
    name="$(basename "$src")"
    link="$target/$name"

    if [[ $UNINSTALL -eq 1 ]]; then
      if [[ -L "$link" ]]; then
        resolved="$(cd "$(dirname "$link")" && readlink "$link")"
        case "$resolved" in
          "$REPO_ROOT"/*|"$src") run rm "$link"; echo "  removed   $name" ;;
          *) echo "  skip      $name (link points elsewhere: $resolved)" ;;
        esac
      else
        echo "  absent    $name"
      fi
      continue
    fi

    # install
    if [[ -L "$link" ]]; then
      current="$(cd "$(dirname "$link")" && readlink "$link")"
      if [[ "$current" == "$src" ]]; then
        echo "  ok        $name (already linked)"
        continue
      fi
      if [[ $FORCE -eq 1 ]]; then
        run rm "$link"
      else
        echo "  skip      $name (link exists -> $current; use --force)"
        continue
      fi
    elif [[ -e "$link" ]]; then
      if [[ $FORCE -eq 1 ]]; then
        run rm -rf "$link"
      else
        echo "  skip      $name (path exists and is not a symlink; use --force)"
        continue
      fi
    fi

    run ln -s "$src" "$link"
    echo "  linked    $name"
  done
done

echo
if [[ $UNINSTALL -eq 1 ]]; then
  echo "Done. Restart / reload the agent to drop the skills."
else
  echo "Done. Reload Cursor (or restart your agent) to pick up the new skills."
fi
