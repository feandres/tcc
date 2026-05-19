#!/usr/bin/env bash
set -euo pipefail

G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; B="\033[1m"; N="\033[0m"
ok()   { echo -e "  ${G}✓${N}  $1"; }
fail() { echo -e "  ${R}✗${N}  $1"; exit 1; }

LAB=$(grep LAB_ATIVO .env | cut -d= -f2 | tr -d '[:space:]')
DIR="labs/lab-$LAB"

echo ""
echo -e "${B}reset lab-$LAB${N}"
echo ""
echo "  Isso apaga todo o código que você escreveu no lab-$LAB."
echo "  O código volta ao estado original do repositório."
echo ""
printf "  Confirmar? [s/N] "
read -r ans

[[ "$ans" = "s" ]] || [[ "$ans" = "S" ]] || { echo "  Cancelado."; exit 0; }

[[ -d "$DIR/.git" ]] || fail "$DIR não é um repositório git. Execute ./scripts/setup.sh"

cd "$DIR"
git reset --hard origin/main
git clean -fd --quiet
cd ../..

docker compose --profile "lab-$LAB" restart 2>/dev/null || true

echo ""
ok "lab-$LAB restaurado ao estado original."
echo ""