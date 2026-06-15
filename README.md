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
2. Pode vincular uma workspace GPTMaker existente ou deixar a franquia pendente.
3. `SUPER_ADMIN` cria o usuario `ADMIN_FRANQUIA`.
4. `SUPER_ADMIN` cria um agente GPTMaker ou vincula um agente existente da workspace.
5. O sistema salva `workspaceId`, `workspaceName`, `agentId`, `agentName`, avatar e sincronizacao local.
6. Textos padrao ativos da matriz alimentam setup, contexto inicial e treinamentos.
7. `ADMIN_FRANQUIA` entra e acessa apenas a propria franquia, agente, leads e configuracoes permitidas.
8. Chat GPTMaker, assumir atendimento e disparos automaticos ficam para uma etapa futura.

## Regras do MVP

- Nao criar workspace GPTMaker automaticamente.
- Nao inventar endpoint de criacao de workspace.
- Apenas `SUPER_ADMIN` pode listar workspaces GPTMaker, acessar diagnostics e provisionar ou trocar agente GPTMaker.
- `ADMIN_FRANQUIA` nao ve o conceito de workspace, nao pode acessar diagnostics GPTMaker e nao pode alterar a conexao GPTMaker da franquia.
- Nao implementar chat, webhooks ou disparos pos-atendimento neste MVP.

## Roadmap de conversas

- Conversas GPTMaker com historico real por franquia.
- Assumir atendimento humano quando necessario.
- Enviar mensagem manual pela matriz ou franquia autorizada.
- Devolver atendimento para IA.
- Disparo automatico pos-atendimento fechado.

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
- `franquia@vavive.com` / `admin123`, criado somente quando existir uma franquia real com workspace associada.

O seed inicial nao cria franquias, leads ou agentes falsos. Em desenvolvimento, crie ou vincule dados reais pelo fluxo da plataforma.

## Importante para agentes de IA / OpenCode / Codex

- Nunca execute `npm install` na raiz do projeto.
- Sempre execute `npm install` dentro de `apps/admin-web`.
- O backend usa Maven e deve ser executado dentro de `apps/api`.
- Nao criar `packages/shared` neste MVP.
- Nao criar pasta `docs` neste MVP.
- Nao expor token do GPTMaker no front-end.
- Toda integracao com GPTMaker deve passar pelo backend.
- Nao alterar `docker-compose.yml` nem credenciais locais sem autorizacao.
