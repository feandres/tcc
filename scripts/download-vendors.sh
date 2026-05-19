#!/usr/bin/env bash
set -euo pipefail

G="\033[0;32m"; B="\033[1m"; N="\033[0m"
ok() { echo -e "  ${G}✓${N}  $1"; }

UI="platform/ui/vendor"
mkdir -p "$UI/monaco" "$UI/mermaid" "$UI/preact"

# ─── Monaco ───────────────────────────────────────────────────────────────────
if [ -d "$UI/monaco/vs" ]; then
  ok "Monaco já existe — pulando"
else
  echo -e "${B}baixando Monaco Editor...${N}"
  npm pack monaco-editor@0.47.0 --silent
  tar xzf monaco-editor-0.47.0.tgz
  mv package/min/vs "$UI/monaco/vs"
  rm -rf package monaco-editor-0.47.0.tgz
  ok "Monaco → $UI/monaco/vs"
fi

# ─── Mermaid ──────────────────────────────────────────────────────────────────
if [ -f "$UI/mermaid/mermaid.esm.min.mjs" ]; then
  ok "Mermaid já existe — pulando"
else
  echo -e "${B}baixando Mermaid...${N}"
  curl -sL "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs" \
       -o "$UI/mermaid/mermaid.esm.min.mjs"
  ok "Mermaid → $UI/mermaid/mermaid.esm.min.mjs"
fi

# ─── Preact — versão standalone para browser (sem bundler) ───────────────────
if [ -f "$UI/preact/preact.module.js" ]; then
  ok "Preact já existe — pulando"
else
  echo -e "${B}baixando Preact...${N}"
  # versão standalone: sem imports internos por nome de pacote
  curl -sL "https://cdn.jsdelivr.net/npm/preact@10/dist/preact.module.js" \
       -o "$UI/preact/preact.standalone.js"
  curl -sL "https://cdn.jsdelivr.net/npm/preact@10/hooks/dist/hooks.module.js" \
       -o "$UI/preact/hooks.standalone.js"
  # corrigir o import interno do hooks que referencia 'preact' por nome
  sed -i.bak "s|from 'preact'|from '/vendor/preact/preact.standalone.js'|g" \
      "$UI/preact/hooks.standalone.js"
  rm -f "$UI/preact/hooks.standalone.js.bak"
  # renomear para os nomes esperados pelo index.html
  mv "$UI/preact/preact.standalone.js" "$UI/preact/preact.module.js"
  mv "$UI/preact/hooks.standalone.js"  "$UI/preact/hooks.module.js"
  ok "Preact → $UI/preact/"
fi

echo ""
echo -e "${B}vendors prontos.${N}"
echo ""
echo "  Execute: make start"
echo ""