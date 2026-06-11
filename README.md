# Vavive Agent Studio

Vavive Agent Studio e o MVP SaaS da Vavive para operacao de franquias com agentes conectados ao GPTMaker. A plataforma organiza login, franquias, leads, configuracao comercial e treinamento do agente em uma camada propria da Vavive.

## Arquitetura do MVP

- `apps/admin-web`: painel administrativo em Next.js, TypeScript e Tailwind.
- `apps/api`: backend em Java 21 com Spring Boot, JWT, JPA e integracao protegida com GPTMaker.
- `PostgreSQL`: base oficial da Vavive para usuarios, franquias, agentes, leads, regras, intencoes e treinamentos.

O backend existe porque a Vavive precisa centralizar autenticacao, autorizacao por franquia, persistencia dos dados do negocio e protecao do token do GPTMaker. O front-end nunca chama o GPTMaker diretamente para evitar exposicao de credenciais e para manter validacoes, auditoria e regras de permissao no servidor.

## Estrutura de pastas

```text
vavive-agent-studio/
├── apps/
│   ├── admin-web/
│   └── api/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Como rodar

1. PostgreSQL:

```powershell
docker compose up -d postgres
```

2. Front-end:

```powershell
npm install
npm run dev:web
```

3. Backend:

```powershell
cd apps\api
.\mvnw.cmd spring-boot:run
```

URLs padrao:

- Front-end: `http://localhost:3000`
- Backend: `http://localhost:8080`

## Variaveis de ambiente

Arquivo base: [.env.example](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/.env.example)

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `SERVER_PORT`
- `JWT_SECRET`
- `JWT_EXPIRATION_SECONDS`
- `GPTMAKER_BASE_URL`
- `GPTMAKER_API_TOKEN`
- `GPTMAKER_MOCK_ENABLED`
- `NEXT_PUBLIC_API_BASE_URL`

## Seeds e usuarios mockados

- `admin@vavive.com` / `admin123` : `SUPER_ADMIN`
- `franquia@vavive.com` / `admin123` : `ADMIN_FRANQUIA`

O seed inicial tambem cria:

- uma franquia mockada
- um agente GPTMaker mockado
- alguns leads mockados

## Endpoints iniciais

- `POST /auth/login`
- `GET /me`
- `GET /franchises`
- `POST /franchises`
- `GET /franchises/{id}`
- `GET /dashboard/summary`
- `GET /leads`
- `GET /agents`
- `POST /agents/{id}/trainings`
- `POST /agents/{id}/intents`
- `POST /agents/{id}/rules`

## Observacoes

- A integracao real com GPTMaker ainda esta encapsulada em `GptMakerClient` no backend e hoje responde com mocks quando `GPTMAKER_MOCK_ENABLED=true`.
- `ADMIN_FRANQUIA` deve enxergar apenas a propria franquia; `SUPER_ADMIN` pode ver toda a rede.
