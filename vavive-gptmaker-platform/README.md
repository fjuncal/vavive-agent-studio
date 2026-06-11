# Vavive GPTMaker Platform

MVP SaaS da Vavive para franquias, usando o GPTMaker como integracao externa de IA/WhatsApp. O front-end nunca chama o GPTMaker diretamente; toda integracao deve passar pelo backend Java.

## Stack

- Monorepo com `apps/admin-web`, `apps/api` e `packages/shared`
- Front-end: Next.js, TypeScript, Tailwind CSS e App Router
- Backend: Java 21, Spring Boot, Spring Security, JWT e JPA
- Banco: PostgreSQL via Docker Compose
- Integracao externa: `GptMakerClient` preparado para Bearer Token, mockado neste MVP

## Como rodar

```bash
cd vavive-gptmaker-platform
cp .env.example .env
docker compose up -d postgres
npm install
npm run dev:web
```

Em outro terminal:

```bash
cd vavive-gptmaker-platform/apps/api
./mvnw spring-boot:run
```

No Windows PowerShell, use:

```powershell
cd vavive-gptmaker-platform\apps\api
.\mvnw.cmd spring-boot:run
```

URLs:

- Admin Web: http://localhost:3000
- API: http://localhost:8080
- Login mockado no seed: `admin@vavive.com` / `admin123`
- Usuario de franquia: `franquia@vavive.com` / `admin123`

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

## Telas criadas

- `/login`
- `/dashboard`
- `/franquias`
- `/franquias/nova`
- `/franquias/[id]`
- `/leads`
- `/agentes`
- `/agentes/[id]`
- `/agentes/[id]/treinamentos`
- `/agentes/[id]/intencoes`
- `/agentes/[id]/regras`
- `/setup-guiado`

## GPTMaker

`apps/api/src/main/java/br/com/vavive/gptmaker/integration/gptmaker/GptMakerClient.java` le `GPTMAKER_BASE_URL`, `GPTMAKER_API_TOKEN` e `GPTMAKER_MOCK_ENABLED`.

Neste primeiro MVP, `GPTMAKER_MOCK_ENABLED=true` retorna respostas mockadas. Quando a API real for integrada, implemente as chamadas HTTP nesse client mantendo o token apenas no backend.

## Regras de produto implementadas na base

- `SUPER_ADMIN` pode listar todas as franquias.
- `ADMIN_FRANQUIA` fica limitado a sua propria franquia.
- Leads, franquias, usuarios, agentes, treinamentos, intencoes e regras sao entidades persistidas no banco da Vavive.
- O token do GPTMaker nao aparece no front-end.

## Proximos passos recomendados

1. Conectar o admin-web aos endpoints reais com armazenamento seguro do JWT Vavive.
2. Implementar chamadas HTTP reais no `GptMakerClient`.
3. Adicionar migrations com Flyway ou Liquibase antes de producao.
4. Criar CRUD completo de usuarios e vinculacao de agente GPTMaker por franquia.
5. Adicionar testes de autorizacao para escopo `SUPER_ADMIN` e `ADMIN_FRANQUIA`.
