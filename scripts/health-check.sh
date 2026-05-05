#!/usr/bin/env bash

LAB_ATIVO=$(grep LAB_ATIVO .env | cut -d= -f2 | tr -d '[:space:]')
OK=0; FAIL=0

check() {
  local name=$1 url=$2
  if curl -sf --max-time 3 "$url" &>/dev/null; then
    echo "  ✓  $name"
    ((OK++))
  else
    echo "  ✗  $name  ($url)"
    ((FAIL++))
  fi
}

echo ""
echo "  plataforma:"
check "nginx"      "http://localhost/health"
check "api lab-${LAB_ATIVO}" "http://localhost/api/docs"
check "grafana"    "http://localhost/grafana/api/health"

echo ""
echo "  resultado: ${OK} ok · ${FAIL} falhou"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
