#!/usr/bin/env bash
set -euo pipefail

LAB_ATIVO=$(grep LAB_ATIVO .env | cut -d= -f2 | tr -d '[:space:]')
LAB_DIR="labs/lab-${LAB_ATIVO}"

echo ""
echo "  Restaurando lab-${LAB_ATIVO} ao estado original..."
echo "  Isso vai apagar todo o código que você escreveu no lab-${LAB_ATIVO}."
echo ""
echo "  Confirmar? [s/N]"
read -r ans

if [ "$ans" != "s" ] && [ "$ans" != "S" ]; then
  echo "  Cancelado."
  exit 0
fi

if [ ! -d "$LAB_DIR/.git" ]; then
  echo "  Erro: $LAB_DIR não é um repositório git."
  echo "  Execute ./scripts/setup.sh para clonar os labs."
  exit 1
fi

cd "$LAB_DIR"
git reset --hard origin/main
git clean -fd --quiet
cd ../..

# reiniciar container do lab
docker compose --profile "lab-${LAB_ATIVO}" restart 2>/dev/null || true

echo ""
echo "  ✓  lab-${LAB_ATIVO} restaurado ao estado original."
echo ""
