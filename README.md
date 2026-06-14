# Vavive Agent Studio

Vavive Agent Studio e o MVP SaaS da Vavive para franquias, com painel administrativo em Next.js e backend em Spring Boot. O GPTMaker e tratado como integracao externa protegida pela API da Vavive.

## Arquitetura do MVP

- `apps/admin-web`: front-end em Next.js, TypeScript e Tailwind.
- `apps/api`: backend em Java 21, Spring Boot, JWT, JPA e integracao com GPTMaker.
- `PostgreSQL`: persistencia de usuarios, franquias, leads, agentes, regras, intencoes e treinamentos.

O backend centraliza autenticacao, autorizacao por franquia, persistencia do negocio e protecao do token do GPTMaker. O front-end nunca chama o GPTMaker diretamente.

## Estrutura de pastas

```text
vavive-agent-studio/
|-- apps/
|   |-- admin-web/
|   `-- api/
|-- docker-compose.yml
|-- .env.example
|-- .gitignore
`-- README.md
```

## Como rodar o banco

```powershell
docker compose up -d
```

## Como rodar o backend

```powershell
cd apps/api
mvnw.cmd spring-boot:run
```

## Como rodar o front-end

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

Configuracao padrao do backend:

```yml
gptmaker:
  base-url: ${GPTMAKER_BASE_URL:https://api.gptmaker.ai}
  api-token: ${GPTMAKER_API_TOKEN:}
  mock-enabled: ${GPTMAKER_MOCK_ENABLED:true}
```

## Integracao GPTMaker

Documentacao oficial: https://developer.gptmaker.ai/api-reference/introduction

- O backend usa OpenFeign para falar com a API do GPTMaker.
- `GPTMAKER_MOCK_ENABLED=true` existe apenas para desenvolvimento local.
- `GPTMAKER_MOCK_ENABLED=false` usa a API real do GPTMaker.
- Em modo real, se a API GPTMaker falhar, o sistema mostra erro controlado e nao simula sucesso.
- `GPTMAKER_API_TOKEN` fica apenas no backend.
- Nenhum endpoint, log ou tela deve expor o token do GPTMaker.

## Fluxo de nova franquia

1. `SUPER_ADMIN` cria a franquia no Vavive Agent Studio.
2. `SUPER_ADMIN` cria o usuario `ADMIN_FRANQUIA`.
3. A workspace precisa existir previamente no GPTMaker.
4. `SUPER_ADMIN` seleciona uma workspace existente.
5. `SUPER_ADMIN` cria o agente GPTMaker da franquia pela plataforma.
6. O sistema salva `workspaceId`, `workspaceName`, `agentId`, `agentName` e a sincronizacao local.
7. O sistema cria ou atualiza o `GptMakerAgent` local e salva um treinamento inicial local com o contexto padrao Vavive.
8. `ADMIN_FRANQUIA` entra e acessa apenas a propria franquia, seus leads, agentes e configuracoes permitidas.

## Regras do MVP

- Nao criar workspace GPTMaker automaticamente.
- Nao inventar endpoint de criacao de workspace.
- Apenas `SUPER_ADMIN` pode listar workspaces GPTMaker, acessar diagnostics e provisionar ou trocar agente GPTMaker.
- `ADMIN_FRANQUIA` nao pode listar workspaces globais, nao pode acessar diagnostics GPTMaker e nao pode alterar a conexao GPTMaker da franquia.
- Nao implementar chat, webhooks ou disparos pos-atendimento neste MVP.

## Como testar GPTMaker real

1. Suba o backend com:
   - `GPTMAKER_MOCK_ENABLED=false`
   - `GPTMAKER_API_TOKEN=seu_token`
   - `GPTMAKER_BASE_URL=https://api.gptmaker.ai`
2. Faca login como `SUPER_ADMIN`.
3. Use `GET /gptmaker/health` para verificar o estado local da configuracao.
4. Use `GET /gptmaker/diagnostics` para validar a conexao real.
5. Abra uma franquia em `/franquias/[id]`.
6. Selecione uma workspace existente.
7. Crie o agente GPTMaker pela tela da franquia.
8. Revise o contexto padrao Vavive e depois envie treinamentos pela tela do agente.

## Seeds e usuarios de teste

- `admin@vavive.com` / `admin123`
- `franquia@vavive.com` / `admin123`

O seed inicial cria uma franquia de exemplo, um `ADMIN_FRANQUIA`, um agente local mockado e alguns leads.

## Importante para agentes de IA / OpenCode / Codex

- Nunca execute `npm install` na raiz do projeto.
- Sempre execute `npm install` dentro de `apps/admin-web`.
- O backend usa Maven e deve ser executado dentro de `apps/api`.
- Nao criar `packages/shared` neste MVP.
- Nao criar pasta `docs` neste MVP.
- Nao expor token do GPTMaker no front-end.
- Toda integracao com GPTMaker deve passar pelo backend.
- Nao alterar `docker-compose.yml` nem credenciais locais sem autorizacao.
