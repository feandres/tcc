#!/usr/bin/env bash
set -euo pipefail

G="\033[0;32m"; B="\033[1m"; N="\033[0m"
ok() { echo -e "  ${G}✓${N}  $1"; }

UI="platform/ui/vendor"
mkdir -p "$UI/codemirror" "$UI/mermaid" "$UI/preact" "$UI/htm"

# ─── CodeMirror ───────────────────────────────────────────────────────────────
if [[ -f "$UI/codemirror/codemirror.bundle.js" ]]; then
  ok "CodeMirror já existe — pulando"
else
  echo -e "${B}baixando e compilando CodeMirror 6...${N}"
  mkdir -p tmp-codemirror
  cd tmp-codemirror
  npm init -y >/dev/null
  npm install codemirror @codemirror/state @codemirror/view @codemirror/lang-python @codemirror/theme-one-dark --silent
  
  # Cria um ponto de entrada para expor o que precisamos
  cat <<EOF > entry.js
export { EditorState } from '@codemirror/state';
export { EditorView, keymap } from '@codemirror/view';
export { basicSetup } from 'codemirror';
export { python } from '@codemirror/lang-python';
export { oneDark } from '@codemirror/theme-one-dark';
EOF

  # Usa o esbuild (via npx) para compilar tudo em um arquivo ESM único minificado
  mkdir -p "../$UI/codemirror"
  npx esbuild entry.js --bundle --minify --format=esm --outfile=../$UI/codemirror/codemirror.bundle.js
  
  cd ..
  rm -rf tmp-codemirror
  ok "CodeMirror → $UI/codemirror/codemirror.bundle.js"
fi

# ─── Mermaid ──────────────────────────────────────────────────────────────────
if [[ -f "$UI/mermaid/mermaid.min.js" ]]; then
  ok "Mermaid já existe — pulando"
else
  echo -e "${B}baixando Mermaid...${N}"
  curl -sL "https://cdn.jsdelivr.net/npm/mermaid@10.9.6/dist/mermaid.min.js" \
       -o "$UI/mermaid/mermaid.min.js"
  ok "Mermaid → $UI/mermaid/mermaid.min.js"
fi

# ─── Preact — versão standalone para browser (sem bundler) ───────────────────
if [[ -f "$UI/preact/preact.module.js" ]]; then
  ok "Preact já existe — pulando"
else
  echo -e "${B}baixando Preact...${N}"
  # versão standalone: sem imports internos por nome de pacote
  curl -sL "https://cdn.jsdelivr.net/npm/preact@10/dist/preact.module.js" \
       -o "$UI/preact/preact.standalone.js"
  curl -sL "https://cdn.jsdelivr.net/npm/preact@10/hooks/dist/hooks.module.js" \
       -o "$UI/preact/hooks.standalone.js"
  # corrigir o import interno do hooks que referencia 'preact' por nome (suporta com ou sem espaços)
  sed -i.bak 's|from"preact"|from"/vendor/preact/preact.module.js"|g' \
      "$UI/preact/hooks.standalone.js"
  sed -i.bak 's|from "preact"|from "/vendor/preact/preact.module.js"|g' \
      "$UI/preact/hooks.standalone.js"
  sed -i.bak "s|from 'preact'|from '/vendor/preact/preact.module.js'|g" \
      "$UI/preact/hooks.standalone.js"
  rm -f "$UI/preact/hooks.standalone.js.bak"
  # renomear para os nomes esperados pelo index.html
  mv "$UI/preact/preact.standalone.js" "$UI/preact/preact.module.js"
  mv "$UI/preact/hooks.standalone.js"  "$UI/preact/hooks.module.js"
  ok "Preact → $UI/preact/"
fi

# ─── HTM — template literals reativos para Preact sem build ───────────────────
if [[ -f "$UI/htm/htm.module.js" ]]; then
  ok "htm já existe — pulando"
else
  echo -e "${B}baixando htm...${N}"
  curl -sL "https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.module.js" \
       -o "$UI/htm/htm.module.js"
  ok "htm → $UI/htm/htm.module.js"
fi

echo ""
echo -e "${B}vendors prontos.${N}"
echo ""
echo "  Execute: make start"
echo ""