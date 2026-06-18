# Assistente Vavive - Fase 2 Design

Base:
- [fase-1.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/fase-1.md)
- [assistente-vavive-fase1-design.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/assistente-vavive-fase1-design.md)
- API oficial GPT Maker: https://developer.gptmaker.ai/api-reference/introduction
- Referência UX: https://app.gptmaker.ai/

## Understanding Summary

- Fase 2 ataca UX de criação e configuração de agente, fluxo de canal com QR code e setup de textos padrão do SUPER_ADMIN.
- UX atual é complexa: espalhada em múltiplas telas, usa JSON bruto, não é amigável.
- Objetivo: transição de MVP para aplicação real, com UX parecida com GPTMaker.
- Wizard de criação de agente com 5 passos amigáveis.
- Tela de configuração do agente existente com abas (tudo num lugar).
- Fluxo de canal WhatsApp com QR code via API oficial do GPTMaker.
- SUPER_ADMIN ganha interface amigável, preview e versionamento para textos padrão.
- Franquia herda padrões do SUPER_ADMIN mas pode customizar tudo.

## Escopo da Fase 2

### Entram na fase 2

- Wizard de criação de agente (5 passos)
- Tela de configuração do agente existente com abas
- Formulários amigáveis em todos os campos (sem JSON/textarea)
- Fluxo de canal com WhatsApp QR code via API oficial
- Setup de textos padrão do SUPER_ADMIN com interface amigável, preview e versionamento

### Ficam fora da fase 2

- Redesign completo do app (só fluxos de agente e canal)
- Mudança de arquitetura backend
- Novos provedores de WhatsApp (usar GPTMaker mesmo)
- Webhooks na UX principal
- Automação pós-venda por webhook/WhatsApp externo

## Assumptions

- API do GPTMaker é estável e suficiente para o fluxo de canal com QR code
- QR code do WhatsApp funciona via polling (não precisa WebSocket)
- SUPER_ADMIN continua com acesso total aos padrões
- Franquias existentes não perdem configuração na migração
- Sistema de blocos STANDARD/CUSTOM da fase 1 é mantido
- Backend já cobre parte dos endpoints necessários e será expandido usando API oficial

## Non-Functional Requirements

- performance: polling de QR code não pode sobrecarregar; intervalo mínimo de 3 segundos
- escala: assumir rede pequena/média, mas sem desenho que exploda linearmente
- segurança: nenhum payload técnico ou nome do provedor deve aparecer no front do franqueado
- confiabilidade: se QR code ou configuração externa falhar, UI mostra estado degradado e não quebra render
- manutenção: componentes reutilizáveis para formulários amigáveis

## Design Approach

Abordagem escolhida: `Refatoração Incremental`

Razões:
- baixo risco, entrega incremental
- não quebra nada existente
- pode ser feita em fases
- aproveita estrutura de páginas existente

Alternativas consideradas:
- redesign total: mais limpo, mas maior risco e mais trabalho
- component-first: mais reutilizável, mas demora mais para ter resultado visível

---

## Seção 1: Wizard de Criação de Agente

### Fluxo

**Rota:** `/franquias/[id]/agente` (página existente, conteúdo novo)

**Quando:** Botão "Criar Agente" no menu "Meu Assistente" (substitui "Configurar")

**Passo 1 — Nome + Avatar**
- Campo: nome do agente (texto livre)
- Seleção de avatar (galeria de opções ou upload)
- Preview do avatar em tempo real

**Passo 2 — Personalidade**
- Tom de voz: botões visuais (Formal / Normal / Relaxado) com exemplos
- Objetivo: seleção (Venda / Suporte / Atendimento geral)
- Comportamento: toggles amigáveis (usar emojis? assinar mensagens? limitar assuntos?)
- Se houver padrão do SUPER_ADMIN: mostra "Usando padrão da matriz" com botão "Customizar"
- Se customizar: campos pré-preenchidos com padrão, editável

**Passo 3 — Treinamentos**
- Lista de treinamentos existentes do padrão (se houver)
- Formulário para adicionar novo: título + conteúdo (textarea rico, não JSON)
- Pode pular e adicionar depois

**Passo 4 — Intenções**
- Lista de intenções do padrão (se houver)
- Formulário para adicionar nova: nome + descrição + instruções
- Pode pular e adicionar depois

**Passo 5 — Revisar e Criar**
- Resumo visual de todas as escolhas
- Botão "Criar Agente"
- Feedback: loading → sucesso → redireciona para tela do agente

### Comportamento de Herança

- Franquia começa com padrões do SUPER_ADMIN pré-preenchidos
- Pode usar o padrão OU customizar
- Mesmo usando padrão, pode editar depois
- Se customizar, copia valor resolvido atual para configuração local

---

## Seção 2: Tela de Configuração do Agente Existente

### Estrutura

**Rota:** `/franquias/[id]/agente` ou `/agentes/[id]`

**Layout:** Tela única com abas (tabs)

**Abas:**
- **Tab: Perfil** — nome, avatar, objetivo
- **Tab: Personalidade** — tom de voz, comportamento, limites
- **Tab: Treinamentos** — lista + criar/editar com formulário amigável
- **Tab: Intenções** — lista + criar/editar com formulário amigável
- **Tab: Configurações** — modelo, timezone, toggles

### Comportamento

- Cada aba com formulários amigáveis, sem JSON
- Estado padrão/customizado por seção (herdado da fase 1)
- Indicação visual: "Usando padrão da matriz" ou "Personalizado"
- Botão "Customizar" para seções em padrão
- Salvar por aba (não precisa salvar tudo de uma vez)

---

## Seção 3: Fluxo de Canal com WhatsApp QR Code

### Endpoints GPTMaker Confirmados

- `POST /v2/workspace/{workspaceId}/create-channel` — cria canal
- `GET /v2/channel/{channelId}/qr-code` — pega QR code
- `GET /v2/workspace/{workspaceId}/channels` — lista canais
- `PUT /v2/channel/{channelId}/edit` — edita canal

### Tipos de Canal Suportados

- Z_API
- WHATSAPP
- INSTAGRAM
- CLOUD_API
- TELEGRAM
- WIDGET
- MESSENGER
- MERCADO_LIVRE
- TWILIO_SMS

### Fluxo de Criação de Canal

1. Usuário clica "Novo Canal" na página `/canais`
2. Seleciona tipo de canal (WhatsApp, Telegram, etc.)
3. Preenche nome do canal
4. Backend cria canal via `POST /v2/workspace/{workspaceId}/create-channel`
5. Se for WhatsApp/Z-API/Cloud API:
   - Backend chama `GET /v2/channel/{channelId}/qr-code`
   - Frontend exibe QR code em modal
   - Polling a cada 3 segundos até `{ connected: true }`
   - Feedback: "Conectado!" → fecha modal
6. Se for Widget/Telegram/Messenger:
   - Instruções específicas para cada tipo
   - Links ou tokens para configurar

### Fluxo de Listagem de Canais

- Lista canais do workspace via `GET /v2/workspace/{workspaceId}/channels`
- Mostra: nome, tipo, status (conectado/desconectado), agente vinculado
- Ações: editar, remover, ver QR code (se desconectado), vincular agente

### Interface

- Cards visuais para cada canal (não tabela)
- Ícone por tipo de canal
- Badge de status (verde = conectado, vermelho = desconectado)
- Botão "Conectar" quando desconectado (abre modal com QR code)

---

## Seção 4: Setup de Textos Padrão do SUPER_ADMIN

### Rota

`/configuracoes/textos-padrao` (página existente, conteúdo novo)

### Melhorias

#### Interface Amigável
- Formulários estruturados por bloco (não textarea com JSON)
- Campos específicos para cada tipo de bloco:
  - Comportamento: toggles + selects
  - Descrição: textarea rico com preview
  - Treinamentos: lista + formulário de criação
  - Intenções: lista + formulário de criação

#### Preview
- Antes de salvar, mostra como o texto vai aparecer para a franquia
- Preview em tempo real enquanto edita
- Simula visualização do bloco na perspectiva do ADMIN_FRANQUIA

#### Versionamento
- Histórico de alterações por bloco
- Data, autor e resumo de cada mudança
- Botão "Reverter" para versão anterior
- Confirmação antes de reverter

### Comportamento

- Cada bloco é editado independentemente
- Salvar por bloco (não precisa salvar tudo de uma vez)
- Mudanças propagam automaticamente para franquias em modo STANDARD

---

## Modelo de Dados (Fase 1 Mantido)

### `AssistantStandardProfile`
- padrão global ativo da matriz
- nome, status, versão, timestamps

### `AssistantStandardBlock`
- um registro por bloco
- `blockType`: BEHAVIOR, ROLE, BASE_DESCRIPTION, TRAININGS, INTENTIONS, AGENT_SETTINGS, IDLE_ACTIONS, TRANSFER_RULES
- `payloadJson`, `version`

### `FranchiseAssistantBlockConfig`
- vinculado a franquia
- `blockType`, `mode`: STANDARD ou CUSTOM
- `standardVersionApplied`, `customPayloadJson`, `customizedAt`

### Novos campos considerados (para versionamento)
- `AssistantStandardBlockHistory` (opcional)
  - `blockId`, `version`, `payloadJson`, `changedAt`, `changedBy`

---

## Contratos de Produto

### Existentes (fase 1)
- `AssistantStandardProfileResponse`
- `FranchiseAssistantConfigurationResponse`
- `ResolvedAssistantBlockResponse`
- `UpdateFranchiseAssistantBlockModeRequest`
- `UpdateFranchiseAssistantBlockPayloadRequest`

### Novos (fase 2)
- `CreateAgentWizardRequest` (nome, avatar, personalidade, treinamentos[], intenções[])
- `CreateChannelRequest` (name, type)
- `ChannelQRCodeResponse` (value | connected)
- `AgentConfigTabsResponse` (perfil, personalidade, treinamentos, intenções, configurações)
- `StandardBlockHistoryResponse` (version, payloadJson, changedAt, changedBy)

---

## Integração Backend

### Endpoints GPTMaker a integrar (fase 2)

| Endpoint | Uso |
|---|---|
| `POST /v2/workspace/{id}/create-channel` | Criar canal |
| `GET /v2/channel/{id}/qr-code` | QR code para conexão |
| `GET /v2/workspace/{id}/channels` | Listar canais (já existe) |
| `PUT /v2/channel/{id}/edit` | Editar canal |

### Endpoints já integrados (fase 1)
- criação/atualização de agente
- treinamentos
- intenções
- configurações do agente
- ações de inatividade
- regras de transferência

---

## UX Geral

### Menu "Meu Assistente"
- Substituir "Configurar" por "Criar Agente" (quando não existe)
- Quando agente existe: "Meu Agente" → tela com abas

### Menu "Canais"
- Lista de canais com cards visuais
- Botão "Novo Canal"
- Fluxo de conexão com QR code

### Menu "Configurações" (SUPER_ADMIN)
- "Textos Padrão" com interface amigável
- Preview e versionamento por bloco

---

## Riscos

- QR code polling pode gerar muitas requisições; implementar backoff ou intervalo maior após timeout
- Migração de JSON bruto para formulários pode perder dados se não tratar campos desconhecidos
- Versionamento de textos pode aumentar complexidade do backend
- Tipos de canal do GPTMaker podem mudar; precisa de tratamento flexível

---

## Decision Log

- wizard de criação: 5 passos (Nome/Avatar, Personalidade, Treinamentos, Intenções, Revisar)
- canal fica no menu Canais, não no wizard do agente
- configuração do agente existente: tela única com abas
- abordagem: refatoração incremental (não redesign total)
- franquia herda padrões do SUPER_ADMIN mas pode customizar tudo
- QR code via polling (não WebSocket)
- SUPER_ADMIN ganha preview e versionamento para textos padrão
- formulários amigáveis em todos os campos (sem JSON/textarea)
- canal: cards visuais com badge de status (não tabela)
