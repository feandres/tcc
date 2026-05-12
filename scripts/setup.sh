#!/usr/bin/env bash
set -euo pipefail

G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; B="\033[1m"; N="\033[0m"
ok()   { echo -e "  ${G}✓${N}  $1"; }
warn() { echo -e "  ${Y}!${N}  $1"; }
fail() { echo -e "  ${R}✗${N}  $1"; exit 1; }

echo ""
echo -e "${B}microlab — setup${N}"
echo ""

# ─── pré-requisitos ───────────────────────────────────────────────────────────

command -v docker &>/dev/null      || fail "Docker não encontrado."
docker compose version &>/dev/null || fail "Docker Compose plugin não encontrado."
ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null)"

# ─── clonar ou atualizar labs ─────────────────────────────────────────────────

echo ""
echo -e "${B}clonando laboratórios...${N}"

mkdir -p labs

clone_or_update() {
  local NAME=$1
  local URL=$2

  if [ -d "labs/$NAME/.git" ]; then
    echo -n "  $NAME já existe — atualizando... "
    cd "labs/$NAME" && git pull --quiet origin main && cd ../.. && echo "ok"
  else
    echo "  clonando $NAME..."
    git clone --quiet "$URL" "labs/$NAME" && ok "$NAME clonado"
  fi
}

clone_or_update "lab-01" "https://github.com/feandres/tcc-lab-01.git"
clone_or_update "lab-02" "https://github.com/feandres/tcc-lab-02.git"

# ─── verificar estrutura ──────────────────────────────────────────────────────

echo ""
echo -e "${B}verificando estrutura...${N}"

for NAME in lab-01 lab-02; do
  DIR="labs/$NAME"
  MISSING=()
  [ -f "$DIR/Dockerfile" ]       || MISSING+=("Dockerfile")
  [ -f "$DIR/requirements.txt" ] || MISSING+=("requirements.txt")
  [ -d "$DIR/src" ]              || MISSING+=("src/")

  if [ ${#MISSING[@]} -eq 0 ]; then
    ok "$NAME"
  else
    warn "$NAME — faltam: ${MISSING[*]}"
  fi
done

echo ""
echo -e "${B}pronto.${N}"
echo ""
echo "  Para iniciar:  make start"
echo "  Para testar:   make test"
echo ""