# Nome a Definir

Laboratório prático de microserviços. Um ambiente completamente dockerizado
que roda na sua máquina — sem instalação de dependências, sem configuração
de ambiente, sem deploy em nuvem.

Você abre o browser, escreve código, clica em verificar.

---

## O que é isso

Uma sequência de cinco laboratórios práticos que partem de um monólito simples
e evoluem até um sistema distribuído com mensageria, observabilidade e
escalabilidade horizontal. O domínio e arquitetura evoluem com o passar dos desafios.

Cada lab tem desafios em código com validação automática. Você sabe que
terminou quando todos os testes passam.

---

## Pré-requisitos

- Docker 24+ com Docker Compose plugin
- Git
- 8GB de RAM disponível
- Portas livres: 80, 9090, 3100, 15672

Só isso. Nada de Python, Node.js ou qualquer outra runtime local.

---

## Início rápido

```bash
git clone https://github.com/feandres/tcc
cd tcc
./scripts/setup.sh
make start
```

Abra **http://localhost** no browser.

O `setup.sh` vai clonar os repositórios dos laboratórios e fazer pull
das imagens Docker necessárias. Dependendo da sua conexão, pode levar
alguns minutos na primeira vez.

---

## Laboratórios

| Lab | Tema | Stack |
|-----|------|-------|
| 01 | Monólito — camadas e acoplamento | Python · FastAPI · SQLite |
| 02 | Monólito Modular — interfaces e inversão de dependência | Python · FastAPI · SQLite |
| 03 | Quebra de Serviços — comunicação síncrona e resiliência | Python · FastAPI · Toxiproxy |
| 04 | Mensageria — comunicação assíncrona e consistência | Python · FastAPI · RabbitMQ |
| 05 | Escalabilidade — stateless, réplicas e observabilidade | Python · FastAPI · Redis · Grafana |

Cada lab parte do estado final do anterior. Você não descarta o que aprendeu —
evolui o sistema que já conhece.

---

## Comandos

```bash
make start          # sobe o ambiente com o lab ativo
make stop           # para tudo
make reset          # volta o ambiente ao estado inicial
make lab-01         # troca para o lab 01
make lab-02         # troca para o lab 02
make lab-03         # troca para o lab 03
make lab-04         # troca para o lab 04
make lab-05         # troca para o lab 05
```

Para reiniciar um lab do zero (sem perder os outros):

```bash
make reset-lab      # restaura o código do lab ativo ao estado original
```

---

## Estrutura do projeto

```
nomeadefinir/
├── docker-compose.yml      ← orquestra tudo
├── Makefile                ← comandos acima
├── .env                    ← LAB_ATIVO=01
│
├── scripts/
│   ├── setup.sh            ← primeiro boot: clona labs, faz pull de imagens
│   ├── reset-lab.sh        ← restaura o lab ativo ao starter original
│   └── health-check.sh     ← valida que os containers estão respondendo
│
├── platform/               ← a interface web (você não precisa editar isso)
│   ├── nginx/
│   ├── ui/                 ← painel com editor Monaco, desafios e checkpoints
│   └── orchestrator/       ← API que controla os containers e roda os testes
│
├── infra/                  ← observabilidade (você não precisa editar isso)
│   ├── prometheus/
│   ├── grafana/
│   ├── toxiproxy/
│   └── k6/
│
└── labs/                   ← populado pelo setup.sh
    ├── lab-01/             ← repositório git independente
    ├── lab-02/
    ├── lab-03/
    ├── lab-04/
    └── lab-05/
```

Os laboratórios ficam em `labs/` como repositórios git independentes.
Isso permite resetar um lab individualmente sem afetar os outros.

---

## Como funciona a validação

Cada laboratório tem testes automatizados em `tests/test_challenges.py`.
Quando você clica em **▶ verificar** na plataforma, os testes rodam dentro
do container e o resultado aparece no painel — um ✓ ou ✗ por desafio.

Você não precisa rodar os testes manualmente, mas pode:

```bash
# dentro do container do lab ativo
docker exec nomeadefinir-lab-01-1 pytest tests/ -v
```

---

## Acesso às ferramentas

| Ferramenta | URL | Disponível a partir de |
|-----------|-----|----------------------|
| Plataforma (editor + desafios) | http://localhost | sempre |
| Swagger da API do lab ativo | http://localhost/api/docs | sempre |
| Grafana | http://localhost/grafana | lab 05 |
| RabbitMQ Management | http://localhost:15672 | lab 04 |
| Prometheus | http://localhost:9090 | lab 05 |

---

## Problemas comuns

**`setup.sh` falha no clone dos labs**
Verifique se tem acesso à internet e se o Git está configurado com suas
credenciais. Os repositórios são públicos, mas o Git precisa estar instalado.

**`make start` trava no build**
Isso costuma acontecer quando o Docker não tem memória suficiente.
Garanta que o Docker tem pelo menos 4GB de RAM alocados nas configurações.

**Hot reload não funciona (código salvo não reflete)**
O editor salva via API — se o container não recarregou, tente
`make stop && make start`. Se persistir, verifique os logs com `make logs`.

**Porta 80 ocupada**
Edite `.env` e mude `PLATFORM_PORT=80` para outra porta, como `8080`.
Depois `make start` novamente.

---

## Repositórios dos laboratórios

Cada lab é um repositório público independente. Se quiser explorar
o código antes de começar ou comparar com outra abordagem:

- github.com/feandres/nomeadefinir-lab-01
- github.com/feandres/nomeadefinir-lab-02
- github.com/feandres/nomeadefinir-lab-03
- github.com/feandres/nomeadefinir-lab-04
- github.com/feandres/nomeadefinir-lab-05

A branch `main` de cada repositório contém o starter — o código que
você recebe com os desafios em aberto. As solutions não são públicas.

---

## Contexto acadêmico

Este projeto é o artefato prático do TCC desenvolvido na UFMA para a
cadeira de Hipermídia. O objetivo é oferecer um ambiente de aprendizado
prático de arquitetura de microserviços que não exija configuração de
máquina e que forneça feedback imediato sobre o progresso do aluno.

---

## Licença

MIT