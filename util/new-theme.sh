#!/usr/bin/env bash
# Scaffold a new theme: extension, demo page and registry entry.
# Usage: util/new-theme.sh <id> "<Title>"
set -euo pipefail

id="${1:?usage: util/new-theme.sh <id> \"<Title>\"}"
title="${2:-$id}"
root="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! "$id" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "theme id must be lower-case letters, digits and dashes" >&2
  exit 1
fi
if [[ -e "$root/_extensions/$id" ]]; then
  echo "_extensions/$id already exists" >&2
  exit 1
fi

mkdir -p "$root/_extensions/$id"
cat > "$root/_extensions/$id/_extension.yml" <<YAML
title: $title
author: Jan Simson
version: 0.1.0
quarto-required: ">=1.4.0"
contributes:
  formats:
    revealjs:
      theme: [default, $id.scss]
      slide-number: true
      date-format: long
YAML

cat > "$root/_extensions/$id/$id.scss" <<'SCSS'
/*-- scss:defaults --*/

// $body-bg: #ffffff !default;
// $body-color: #222222 !default;
// $link-color: #2a76dd !default;
// $font-family-sans-serif: sans-serif !default;
// $presentation-heading-font: sans-serif !default;

/*-- scss:rules --*/

// Classes used by the shared template.qmd; every theme should style them.
.reveal .alert {
  font-weight: 600;
}

.reveal .highlight {
  background: rgba(255, 230, 0, 0.5);
}

.reveal .sticker {
  display: inline-block;
  font-size: 0.6em;
  padding: 0.25em 0.7em;
}
SCSS

# the format goes after the include: the last front matter block wins
cat > "$root/themes/$id.qmd" <<QMD
{{< include ../template.qmd >}}

---
format: $id-revealjs
---
QMD

cat >> "$root/themes.yml" <<YAML
- title: $title
  path: themes/$id.html
  image: screenshots/$id/title.png
  description: >
    TODO: describe the $title theme.
YAML

echo "Created theme '$id'. Next: edit _extensions/$id/$id.scss and the description in themes.yml,"
echo "then run: npm --prefix util run build"
