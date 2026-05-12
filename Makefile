.PHONY: start stop reset logs test lab-01 lab-02 reset-lab

include .env
export

start:
	@docker compose --profile lab-$(LAB_ATIVO) up -d --build
	@echo ""
	@echo "  lab-$(LAB_ATIVO) → http://localhost:800$(LAB_ATIVO)/docs"
	@echo ""

stop:
	@docker compose --profile lab-$(LAB_ATIVO) down

reset:
	@docker compose down --volumes --remove-orphans
	@echo "LAB_ATIVO=01" > .env
	@echo "Resetado. Execute: make start"

logs:
	@docker compose logs -f --tail=50

test:
	@docker exec microlab-lab-$(LAB_ATIVO)-1 pytest tests/ -v 2>/dev/null \
	  || echo "Container não está rodando. Execute: make start"

_switch:
	@docker compose --profile lab-$(LAB_ATIVO) down 2>/dev/null || true
	@sed -i.bak 's/LAB_ATIVO=.*/LAB_ATIVO=$(NOVO)/' .env && rm -f .env.bak
	@docker compose --profile lab-$(NOVO) up -d --build
	@echo "lab-$(NOVO) → http://localhost:800$(NOVO)/docs"

lab-01: ; @$(MAKE) _switch NOVO=01
lab-02: ; @$(MAKE) _switch NOVO=02

reset-lab:
	@./scripts/reset-lab.sh