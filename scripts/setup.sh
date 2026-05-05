#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET}  $1"; exit 1; }
step() { echo -e "\n${BOLD}$1${RESET}"; }

echo ""
echo -e "${BOLD}microlab — setup${RESET}"
echo ""

# ─── 1. verificar Docker ──────────────────────────────────────────────────────
step "1. Verificando pré-requisitos..."

if ! command -v docker &>/dev/null; then
  fail "Docker não encontrado. Instale em: https://docs.docker.com/get-docker/"
fi

DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null | grep -oE '^[0-9]+' || echo "0")
if [ "$DOCKER_VERSION" -lt 24 ]; then
  warn "Docker versão antiga detectada. Recomendado: 24+. Pode funcionar, mas não garantimos."
else
  ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null)"
fi

if ! docker compose version &>/dev/null; then
  fail "Docker Compose plugin não encontrado. Atualize o Docker para 24+."
fi
ok "Docker Compose $(docker compose version --short)"

# memória disponível (apenas Linux/Mac)
if command -v free &>/dev/null; then
  MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
  if [ "$MEM_GB" -lt 4 ]; then
    warn "Menos de 4GB de RAM detectados (${MEM_GB}GB). Labs avançados podem ser lentos."
  else
    ok "${MEM_GB}GB de RAM disponíveis"
  fi
fi

# verificar porta 80
if lsof -i :80 &>/dev/null 2>&1 || ss -tlnp 'sport = :80' 2>/dev/null | grep -q LISTEN; then
  warn "Porta 80 ocupada. Edite .env e mude PLATFORM_PORT para outra porta (ex: 8080)"
fi

# ─── 2. criar .env se não existir ─────────────────────────────────────────────
step "2. Configurando ambiente..."

if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
LAB_ATIVO=01
PLATFORM_PORT=80
COMPOSE_PROJECT_NAME=microlab
EOF
  ok ".env criado"
else
  ok ".env já existe"
fi

# criar .lab-state.json se não existir
if [ ! -f .lab-state.json ]; then
  echo '{}' > .lab-state.json
  ok ".lab-state.json criado"
fi

# ─── 3. clonar repositórios dos labs ──────────────────────────────────────────
step "3. Clonando laboratórios..."

mkdir -p labs

REPOS=(
  "lab-01:https://github.com/feandres/microlab-lab-01"
  "lab-02:https://github.com/feandres/microlab-lab-02"
)

for entry in "${REPOS[@]}"; do
  LAB="${entry%%:*}"
  URL="${entry##*:}"

  if [ -d "labs/$LAB/.git" ]; then
    ok "$LAB já clonado — atualizando..."
    cd "labs/$LAB" && git pull --quiet origin main && cd ../..
  else
    echo "  clonando $LAB..."
    if git clone --quiet "$URL" "labs/$LAB" 2>/dev/null; then
      ok "$LAB clonado"
    else
      warn "$LAB não pôde ser clonado (repositório ainda não existe?). Pulando."
    fi
  fi
done

# ─── 4. fazer pull das imagens base ───────────────────────────────────────────
step "4. Baixando imagens Docker (pode demorar na primeira vez)..."

IMAGES=(
  "python:3.12-slim"
  "node:20-alpine"
  "nginx:alpine"
  "prom/prometheus:latest"
  "grafana/grafana:latest"
  "shopify/toxiproxy:latest"
  "rabbitmq:3-management-alpine"
  "redis:7-alpine"
)

for img in "${IMAGES[@]}"; do
  echo -n "  pulling $img... "
  docker pull "$img" --quiet && echo "ok" || echo "falhou (continuando)"
done

# ─── 5. pronto ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setup concluído.${RESET}"
echo ""
echo "  Execute: make start"
echo ""
