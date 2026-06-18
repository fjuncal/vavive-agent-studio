# Vavive Agent Studio

Vavive Agent Studio e o MVP SaaS da Vavive para franquias operarem agentes GPTMaker por meio de uma camada propria da Vavive. O front-end nunca fala diretamente com o GPTMaker.

## Arquitetura atual

- `apps/admin-web`: front-end em Next.js, TypeScript e Tailwind.
- `apps/api`: backend em Java 21, Spring Boot, JWT, JPA e integracao com GPTMaker.
- `PostgreSQL`: persistencia de usuarios, franquias, setups, leads, agentes, conversas, regras, intencoes e treinamentos.

O backend centraliza autenticacao, autorizacao por franquia, persistencia do negocio e protecao do token do GPTMaker. O front-end nunca chama o GPTMaker diretamente.

## Fluxo real da plataforma

```text
Franquia
  -> Workspace GPTMaker
    -> Agente da franquia
      -> Configuracao e treinamento
        -> Conversas e atendimento
```

Regras de produto:

- `SUPER_ADMIN` ve e gerencia workspaces GPTMaker.
- `ADMIN_FRANQUIA` nao deve operar o conceito de workspace na experiencia principal.
- agente pertence a uma franquia.
- criar agente depende de workspace vinculada.
- nao existe agente solto como fluxo principal.

## Estrutura de pastas

```text
vavive-agent-studio/
|-- apps/
|   |-- admin-web/
|   `-- api/
|-- docs/
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

app:
  cors:
    allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:3000}
  features:
    real-channels-enabled: ${APP_FEATURE_REAL_CHANNELS_ENABLED:true}
    live-inbox-enabled: ${APP_FEATURE_LIVE_INBOX_ENABLED:true}
    sales-handoff-enabled: ${APP_FEATURE_SALES_HANDOFF_ENABLED:true}
```

Flags de rollout:

- `APP_FEATURE_REAL_CHANNELS_ENABLED`: liga sincronizacao de canais reais por workspace.
- `APP_FEATURE_LIVE_INBOX_ENABLED`: liga inbox operacional com sync de chats/mensagens GPTMaker.
- `APP_FEATURE_SALES_HANDOFF_ENABLED`: liga handoff comercial para WhatsApp do franqueado.

## Integracao GPTMaker

Documentacao oficial: https://developer.gptmaker.ai/api-reference/introduction

- O backend usa OpenFeign para falar com a API do GPTMaker.
- O projeto hoje usa principalmente workspaces, agentes, conversa com agente, mensagens de interacao, inicio de atendimento humano, treinamentos e intencoes.
- `GPTMAKER_MOCK_ENABLED=true` existe apenas para desenvolvimento local.
- `GPTMAKER_MOCK_ENABLED=false` usa a API real do GPTMaker.
- Em modo real, se a API GPTMaker falhar, o sistema mostra erro controlado e nao simula sucesso.
- `GPTMAKER_API_TOKEN` fica apenas no backend.
- Nenhum endpoint, log ou tela deve expor o token do GPTMaker.

## Permissoes

- `SUPER_ADMIN`
  - cria franquias
  - vincula workspace GPTMaker
  - cria, troca ou limpa agente GPTMaker
  - lista workspaces e agentes do GPTMaker
  - acompanha toda a rede
- `ADMIN_FRANQUIA`
  - acessa apenas a propria franquia
  - acessa apenas o proprio agente, setup, leads e conversas permitidas
  - nao acessa outra franquia
  - nao altera conexao GPTMaker da franquia
  - nao deve ver workspace na UX principal

## Fluxo de nova franquia

1. `SUPER_ADMIN` cria a franquia no Vavive Agent Studio.
2. Pode vincular uma workspace GPTMaker existente ou deixar a franquia pendente.
3. O sistema cria junto o usuario `ADMIN_FRANQUIA`.
4. A franquia segue para configuracao do agente.
5. O agente GPTMaker so pode ser criado quando existir workspace vinculada.
6. Textos padrao ativos da matriz alimentam setup, contexto inicial e treinamentos.
7. `ADMIN_FRANQUIA` entra e acessa apenas a propria franquia, agente, leads e configuracoes permitidas.

## Regras do MVP

- Nao criar workspace GPTMaker automaticamente.
- Nao inventar endpoint de criacao de workspace.
- Apenas `SUPER_ADMIN` pode listar workspaces GPTMaker, acessar diagnostics e provisionar ou trocar agente GPTMaker.
- `ADMIN_FRANQUIA` nao ve o conceito de workspace, nao pode acessar diagnostics GPTMaker e nao pode alterar a conexao GPTMaker da franquia.
- Conversas e atendimento estao em evolucao; a camada de UX nao deve expor IDs ou termos tecnicos do GPTMaker.

## Roadmap de conversas

- Conversas GPTMaker com historico real por franquia.
- Assumir atendimento humano quando necessario.
- Enviar mensagem manual pela matriz ou franquia autorizada.
- Devolver atendimento para IA.
- Disparo automatico pos-atendimento fechado.

## Roadmap de canais e operacao

- Listar canais reais por workspace GPTMaker.
- Sincronizar configuracoes de canais suportados.
- Evoluir para inbox operacional por franquia.
- Adicionar pos-atendimento e analytics.

## Documentacao complementar

- [Docs index](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/README.md)
- [Brainstorming enterprise gap](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/brainstorming-enterprise-gap.md)

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

## Rollout recomendado em ambiente real

1. Suba backend com `GPTMAKER_MOCK_ENABLED=false` e token real.
2. Ligue apenas `APP_FEATURE_REAL_CHANNELS_ENABLED=true`.
3. Valide canais e ownership por franquia.
4. Ligue `APP_FEATURE_LIVE_INBOX_ENABLED=true`.
5. Valide inbox, takeover humano, mensagem manual e encerramento.
6. Ligue `APP_FEATURE_SALES_HANDOFF_ENABLED=true` somente apos definir provedor real de WhatsApp.

## Seeds e usuarios de teste

- `admin@vavive.com` / `admin123`
- `franquia@vavive.com` / `admin123`, criado somente quando existir uma franquia real com workspace associada.

O seed inicial nao cria franquias, leads ou agentes falsos. Em desenvolvimento, crie ou vincule dados reais pelo fluxo da plataforma.

## Importante para agentes de IA / OpenCode / Codex

- Nunca execute `npm install` na raiz do projeto.
- Sempre execute `npm install` dentro de `apps/admin-web`.
- O backend usa Maven e deve ser executado dentro de `apps/api`.
- Nao criar `packages/shared` neste MVP.
- Nao expor token do GPTMaker no front-end.
- Toda integracao com GPTMaker deve passar pelo backend.
- Nao alterar `docker-compose.yml` nem credenciais locais sem autorizacao.
