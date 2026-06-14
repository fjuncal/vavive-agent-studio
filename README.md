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

## Integracao GPTMaker

Documentacao oficial: https://developer.gptmaker.ai/api-reference/introduction

- O backend usa OpenFeign para falar com a API do GPTMaker.
- O backend usa Spring Boot `4.0.x` com Spring Cloud `2025.1.x` para manter a combinacao oficialmente suportada pelo Spring Cloud.
- `GPTMAKER_MOCK_ENABLED=true` existe apenas para desenvolvimento local.
- `GPTMAKER_MOCK_ENABLED=false` usa a API real do GPTMaker.
- Em modo real, se a API GPTMaker falhar, o sistema mostra erro controlado e nao simula sucesso.
- Nao existe fallback funcional em modo real.
- `GPTMAKER_API_TOKEN` fica apenas no backend.
- O front-end nunca chama o GPTMaker diretamente.
- Toda integracao com GPTMaker passa pela API Java da Vavive.

## Validacao da integracao GPTMaker

- Documentacao oficial: https://developer.gptmaker.ai/api-reference/introduction
- O backend usa OpenFeign.
- Health local: `GET /gptmaker/health`
- Diagnostico real: `GET /gptmaker/diagnostics`
- Payload bruto seguro: `GET /gptmaker/diagnostics/workspaces/raw`
- `GPTMAKER_MOCK_ENABLED=true`: simula publicacao
- `GPTMAKER_MOCK_ENABLED=false` sem token: erro controlado
- `GPTMAKER_MOCK_ENABLED=false` com token: tenta chamar GPTMaker real
- Nao existe fallback funcional em modo real

## Como testar GPTMaker real

1. Suba o backend com:
   - `GPTMAKER_MOCK_ENABLED=false`
   - `GPTMAKER_API_TOKEN=seu_token`
   - `GPTMAKER_BASE_URL=https://api.gptmaker.ai`
2. Faça login como `SUPER_ADMIN`.
3. Abra o dashboard.
4. Confira `GET /gptmaker/health`. Ele deve mostrar `READY` quando a configuracao local estiver pronta.
5. Teste direto da API real com curl:
   - `GET https://api.gptmaker.ai/v2/workspaces`
   - `Authorization: Bearer <token>`
6. Se o curl funcionar e o backend falhar, o problema esta no backend, normalmente em Feign, parser ou tratamento de erro.
7. Rode `GET /gptmaker/diagnostics`. Ele chama a API real do GPTMaker e deve mostrar:
   - `status=CONNECTED`
   - `workspaceCount=2`
   - `details=Workspaces retornados: teste, Meu Workspace`
8. Rode `GET /gptmaker/diagnostics/workspaces/raw` como `SUPER_ADMIN`. O endpoint retorna:
   - `endpoint`
   - `httpStatus`
   - `payload` em sucesso
   - `errorCode`, `message` e `responsePreview` em erro
9. Abra uma franquia. A tela deve listar `teste` e `Meu Workspace` ao carregar os workspaces pelo backend.
10. Ao selecionar um workspace, a tela deve buscar os agentes pelo backend em `GET /v2/workspace/{workspaceId}/agents`.

Observacoes:
- `GET /gptmaker/health` nao chama a API real.
- `GET /gptmaker/diagnostics` chama a API real.
- Workspaces usam `GET /v2/workspaces`.
- Agentes usam `GET /v2/workspace/{workspaceId}/agents`.
- Se o curl funciona e o backend nao, nao ajuste o front primeiro. Corrija Feign, parser ou tratamento de erro no backend.
- Nenhum endpoint, log ou tela deve expor o token do GPTMaker.

## Fluxo real GPTMaker

1. Suba o backend com:
   - `GPTMAKER_MOCK_ENABLED=false`
   - `GPTMAKER_API_TOKEN=token_real`
   - `GPTMAKER_BASE_URL=https://api.gptmaker.ai`
2. Entre como `SUPER_ADMIN`.
3. Abra o dashboard.
   - `GET /gptmaker/diagnostics` deve retornar `CONNECTED`.
4. Abra uma franquia em `/franquias/[id]`.
5. Selecione um workspace real.
6. Selecione um agent real do workspace.
7. Salve a conexao GPTMaker.
8. Acesse `/agentes`.
   - O agente vinculado deve aparecer como `Conectado ao GPTMaker`.
9. Abra `/agentes/[id]/treinamentos`.
10. Gere o treinamento.
11. Envie para o GPTMaker.
12. Valide o status final:
   - `PUBLICADO_GPTMAKER` em sucesso
   - `PUBLICACAO_FALHOU` em erro

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
