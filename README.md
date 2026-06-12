# Vavive Agent Studio

Vavive Agent Studio e o MVP SaaS da Vavive para franquias, com painel administrativo em Next.js e backend em Spring Boot. O GPTMaker e tratado como integracao externa protegida pela API da Vavive.

## Arquitetura do MVP

- `apps/admin-web`: front-end em Next.js, TypeScript e Tailwind.
- `apps/api`: backend em Java 21, Spring Boot, JWT, JPA e integracao com GPTMaker.
- `PostgreSQL`: persistencia de usuarios, franquias, leads, agentes, regras, intencoes e treinamentos.

O backend existe para centralizar autenticacao, autorizacao por franquia, persistencia do negocio e protecao do token do GPTMaker. O front-end nao chama o GPTMaker diretamente para evitar exposicao de credenciais e para garantir que toda integracao passe pelas regras da Vavive.

## Estrutura de pastas

```text
vavive-agent-studio/
├── apps/
│   ├── admin-web/
│   └── api/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Como rodar o banco

```powershell
docker compose up -d
```

## Como rodar o front-end

```powershell
cd apps/admin-web
npm install
npm run dev
```

## Como rodar o backend

Em sistemas Unix:

```bash
cd apps/api
./mvnw spring-boot:run
```

No Windows:

```powershell
cd apps/api
mvnw.cmd spring-boot:run
```

## Ordem correta para rodar localmente

Backend:

```powershell
cd apps/api
mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd apps/admin-web
npm install
npm run dev
```

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

- `admin@vavive.com` / `admin123`
- `franquia@vavive.com` / `admin123`

O seed inicial tambem cria uma franquia mockada, um agente GPTMaker mockado e alguns leads mockados.

## Importante para agentes de IA / OpenCode / Codex

- Nunca execute `npm install` na raiz do projeto.
- Sempre execute `npm install` dentro de `apps/admin-web`.
- O backend usa Maven e deve ser executado dentro de `apps/api`.
- Nao criar `packages/shared` neste MVP.
- Nao criar pasta `docs` neste MVP.
- Nao expor token do GPTMaker no front-end.
- Toda integracao com GPTMaker deve passar pelo backend.
- Nao alterar `docker-compose.yml` nem credenciais locais sem autorizacao.
