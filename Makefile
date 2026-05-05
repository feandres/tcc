.PHONY: start stop reset build logs health \
        lab-01 lab-02 lab-03 lab-04 lab-05 \
        reset-lab chaos-latency chaos-reset

include .env
export

# ─── AMBIENTE ─────────────────────────────────────────────────────────────────

start:
	@echo ""
	@echo "  microlab — iniciando (lab ativo: $(LAB_ATIVO))"
	@echo ""
	@docker compose build ui orchestrator 2>&1 | grep -E "(error|warning|built)" || true
	@docker compose up -d ui orchestrator nginx prometheus grafana toxiproxy
	@docker compose --profile lab-$(LAB_ATIVO) up -d --build
	@echo ""
	@echo "  ✓  plataforma:  http://localhost"
	@echo "  ✓  api docs:    http://localhost/api/docs"
	@echo "  ✓  grafana:     http://localhost/grafana"
	@echo ""

stop:
	@docker compose --profile lab-$(LAB_ATIVO) down
	@docker compose down

reset:
	@echo "Isso vai derrubar todos os containers e volumes. Confirmar? [s/N]"
	@read ans && [ "$$ans" = "s" ] || exit 0
	@docker compose down --volumes --remove-orphans
	@echo "LAB_ATIVO=01" > .env.tmp && mv .env.tmp .env
	@rm -f .lab-state.json
	@echo "Ambiente resetado. Execute: make start"

build:
	@docker compose build ui orchestrator
	@docker compose --profile lab-$(LAB_ATIVO) build

logs:
	@docker compose logs -f --tail=50

health:
	@./scripts/health-check.sh

# ─── TROCA DE LAB ─────────────────────────────────────────────────────────────

_switch:
	@echo "Parando lab-$(LAB_ATIVO)..."
	@docker compose --profile lab-$(LAB_ATIVO) down 2>/dev/null || true
	@sed -i.bak 's/LAB_ATIVO=.*/LAB_ATIVO=$(NOVO)/' .env && rm -f .env.bak
	@echo "Subindo lab-$(NOVO)..."
	@docker compose --profile lab-$(NOVO) up -d --build
	@echo "lab-$(NOVO) ativo."

lab-01: ; @$(MAKE) _switch NOVO=01
lab-02: ; @$(MAKE) _switch NOVO=02
lab-03: ; @$(MAKE) _switch NOVO=03
lab-04: ; @$(MAKE) _switch NOVO=04
lab-05: ; @$(MAKE) _switch NOVO=05

# ─── RESET DO LAB ATIVO ───────────────────────────────────────────────────────

reset-lab:
	@echo "Restaurando lab-$(LAB_ATIVO) ao estado original..."
	@cd labs/lab-$(LAB_ATIVO) && git reset --hard origin/main
	@docker compose --profile lab-$(LAB_ATIVO) restart
	@echo "lab-$(LAB_ATIVO) restaurado."

# ─── CAOS (atalhos para Labs 03+) ─────────────────────────────────────────────

chaos-latency:
	@curl -s -X POST http://localhost/api/chaos/latency/payment-service \
	  -H "Content-Type: application/json" \
	  -d '{"ms": 2000}' | python3 -m json.tool

chaos-reset:
	@curl -s -X DELETE http://localhost/api/chaos/latency/payment-service \
	  | python3 -m json.tool
