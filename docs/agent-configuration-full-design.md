# Design: Configuracao Completa do Agente - GPTMaker Integration

## 1. Contexto Atual

### O que existe hoje
- Tela basica de configuracao com tabs: Perfil, Personalidade, Treinamentos, Intencoes, Configuracoes
- Integracao parcial com GPTMaker API
- Treinamentos: apenas adicionar localmente (nao salva no GPTMaker)
- Intencoes: CRUD basico via API
- Configuracoes: apenas alguns campos (modelo, timezone, toggles)
- **Falta:** Acoes de inatividade, Webhooks, Regras de transferencia

### Problemas identificados
1. **Erro ao adicionar treinamento** — `getGptMakerTrainings` retorna formato diferente do esperado (GPTMaker retorna `{id, type, text}`, frontend espera `{title, content}`)
2. **Configuracoes incompletas** — faltam campos da API GPTMaker
3. **Sem edicao/remocao de treinamentos** — apenas adicionar
4. **Sem acoes de inatividade** — endpoint existe mas UI nao implementada
5. **Sem webhooks** — endpoint existe mas UI nao implementada
6. **Sem regras de transferencia** — endpoint existe mas UI nao implementada

---

## 2. GPTMaker API Reference

### Endpoints necessarios

| Recurso | GET | POST | PUT | DELETE |
|---------|-----|------|-----|--------|
| Settings | `/v2/agent/{id}/settings` | - | `/v2/agent/{id}/settings` | - |
| Trainings | `/v2/agent/{id}/trainings` | `/v2/agent/{id}/trainings` | `/v2/training/{id}` | `/v2/training/{id}` |
| Intentions | `/v2/agent/{id}/intentions` | `/v2/agent/{id}/intentions` | `/v2/intention/{id}` | `/v2/intention/{id}` |
| Idle Actions | `/v2/agent/{id}/idle-actions` | `/v2/agent/{id}/idle-actions` | `/v2/idle-action/{id}` | `/v2/idle-action/{id}` |
| Webhooks | `/v2/agent/{id}/webhooks` | - | `/v2/agent/{id}/webhooks` | - |
| Transfer Rules | `/v2/agent/{id}/transfer-rules` | `/v2/agent/{id}/transfer-rules` | `/v2/transfer-rule/{id}` | `/v2/transfer-rule/{id}` |

### Schemas principais

#### Settings (GET/PUT)
```json
{
  "prefferModel": "GPT_4_O",
  "timezone": "America/Sao_Paulo",
  "enabledHumanTransfer": true,
  "enabledReminder": false,
  "splitMessages": false,
  "enabledEmoji": false,
  "limitSubjects": false,
  "signMessages": false,
  "messageGroupingTime": "NO_GROUP",
  "maxDailyMessages": null,
  "maxDailyMessagesLimitAction": null,
  "knowledgeByFunction": false,
  "onLackKnowLedge": null
}
```

#### Training (GET response)
```json
{
  "id": "string",
  "type": "TEXT",
  "text": "conteudo do treinamento"
}
```

#### Training (POST - criar)
```json
{
  "type": "TEXT",
  "text": "conteudo"
}
```

#### Idle Action (GET response)
```json
{
  "actions": [
    {
      "id": "string",
      "type": "FINISH_INTERACTION",
      "instructions": null,
      "seconds": 600,
      "allowAllHours": true,
      "workingHours": null
    }
  ],
  "finishOn": { "seconds": 3600 }
}
```

#### Idle Action (POST - criar)
```json
{
  "type": "FINISH_INTERACTION",
  "seconds": 600,
  "instructions": null,
  "allowAllHours": true
}
```

#### Webhooks (GET/PUT)
```json
{
  "onNewMessage": "https://...",
  "onLackKnowLedge": null,
  "onTransfer": null,
  "onFirstInteraction": null,
  "onStartInteraction": null,
  "onFinishInteraction": null,
  "onCreateEvent": null,
  "onCancelEvent": null
}
```

#### Transfer Rule (GET response)
```json
{
  "id": "string",
  "createdAt": "string",
  "instructions": "Quando cliente pedir...",
  "returnOnFinish": true,
  "type": "AGENT",
  "agentId": "string",
  "userId": null
}
```

#### Transfer Rule (POST - criar)
```json
{
  "instructions": "Quando cliente pedir...",
  "returnOnFinish": true,
  "type": "AGENT",
  "agentId": "string"
}
```

#### Intention (GET response)
```json
{
  "id": "string",
  "description": "Emite segunda via",
  "instructions": "Quando cliente pedir segunda via",
  "details": null,
  "fields": [],
  "type": "WEBHOOK",
  "httpMethod": "POST",
  "url": "https://...",
  "headers": [],
  "params": [],
  "variables": [],
  "requestBody": "{}",
  "autoGenerateParams": false,
  "autoGenerateBody": false
}
```

---

## 3. Design da Interface

### Estrutura de Tabs (configuracao do agente)

```
┌─────────────────────────────────────────────────────────┐
│  Perfil | Personalidade | Treinamentos | Intencoes | Configuracoes │
└─────────────────────────────────────────────────────────┘
```

#### Tab: Configuracoes (sub-abas)

```
┌─────────────────────────────────────────────────────────┐
│  Conversa | Acoes de Inatividade | Webhooks | Regras de Transferencia │
└─────────────────────────────────────────────────────────┘
```

### 3.1 Tab: Conversa (Settings)

Campos conforme API GPTMaker:

| Campo | Tipo | Opcoes |
|-------|------|--------|
| Modelo | Select | GPT_5, GPT_4_O, CLAUDE_4_5_SONNET, etc. |
| Timezone | Select | America/Sao_Paulo, America/Manaus, etc. |
| Transferencia humana | Toggle | true/false |
| Resumo ao transferir | Toggle | true/false |
| Lembretes | Toggle | true/false |
| Dividir mensagens | Toggle | true/false |
| Usar emojis | Toggle | true/false |
| Assinar nome | Toggle | true/false |
| Restringir temas | Toggle | true/false |
| Busca inteligente | Toggle | true/false |
| Agrupamento | Select | NO_GROUP, FIVE_SEC, TEN_SEC, etc. |
| Limite interacoes | Select | null, 20, 50, 100, 200, 500, 1000 |
| Acao no limite | Select | TEMP_BLOCK_30S, TRANSFER, BLOCK, etc. |

### 3.2 Tab: Acoes de Inatividade

**Lista de acoes:**
```
┌─────────────────────────────────────────────────┐
│  Se nao responder em [10 minutos]               │
│  o agente deve [Finalizar atendimento]          │
│                          [Editar] [Inativar] [X] │
└─────────────────────────────────────────────────┘
```

**Modal de criacao/edicao:**
```
┌─────────────────────────────────────────────────┐
│  Acao de Inatividade                            │
│                                                 │
│  Tipo: [Finalizar atendimento ▼]               │
│  Tempo: [10] [minutos ▼]                       │
│  Instrucoes: [________________]                 │
│  Horario: [Qualquer horario] [Personalizado]    │
│                                                 │
│  [Cancelar] [Salvar]                            │
└─────────────────────────────────────────────────┘
```

### 3.3 Tab: Webhooks

**Lista de eventos:**
```
┌─────────────────────────────────────────────────┐
│  Nova mensagem → https://webhook.site/abc       │
│  Falta conhecimento → (nao configurado)         │
│  Transferencia → (nao configurado)              │
│  ...                                            │
│                          [Editar]               │
└─────────────────────────────────────────────────┘
```

**Modal de edicao:**
```
┌─────────────────────────────────────────────────┐
│  Webhook: Nova mensagem                         │
│                                                 │
│  URL: [https://________________]                │
│                                                 │
│  [Cancelar] [Salvar]                            │
└─────────────────────────────────────────────────┘
```

### 3.4 Tab: Regras de Transferencia

**Lista de regras:**
```
┌─────────────────────────────────────────────────┐
│  Transferir para: Agente X                      │
│  Instrucoes: Quando cliente pedir suporte...    │
│  Retornar ao finalizar: Sim                     │
│                          [Editar] [Remover]     │
└─────────────────────────────────────────────────┘
```

**Modal de criacao/edicao:**
```
┌─────────────────────────────────────────────────┐
│  Regra de Transferencia                         │
│                                                 │
│  Transferir para: [Agente ▼] [Todos agentes]   │
│  Instrucoes: [________________]                 │
│  Retornar ao finalizar: [Toggle]                │
│  Notificar: [Toggle]                            │
│                                                 │
│  [Cancelar] [Salvar]                            │
└─────────────────────────────────────────────────┘
```

### 3.5 Tab: Treinamentos (correcao)

**Problema atual:** GPTMaker retorna `{id, type, text}`, frontend espera `{title, content}`.

**Correcao:** Mapear campos corretamente:
- `title` ← exibir `type` ou trecho do `text`
- `content` ← `text`
- `id` ← `id`

**Lista de treinamentos:**
```
┌─────────────────────────────────────────────────┐
│  [TEXT] Treinamento 1                           │
│  Conteudo do treinamento...                     │
│                          [Editar] [Remover]     │
│                                                 │
│  [WEBSITE] Treinamento 2                        │
│  https://exemplo.com                            │
│                          [Editar] [Remover]     │
└─────────────────────────────────────────────────┘

[+ Adicionar treinamento]
  Tipo: [Texto ▼] [Website] [Video] [Documento]
```

### 3.6 Tab: Intencoes (melhorias)

**Lista de intencoes:**
```
┌─────────────────────────────────────────────────┐
│  Emite segunda via boleto                       │
│  Quando cliente pedir segunda via               │
│  Tipo: WEBHOOK | Metodo: POST                   │
│                          [Editar] [Remover]     │
└─────────────────────────────────────────────────┘

[+ Nova intenção]
```

**Wizard de criacao (3 passos):**
1. **Dados gerais:** Nome, descricao, quando usar
2. **Configurar acao:** Tipo (WEBHOOK), HTTP method, URL, headers, params
3. **Dados de saida:** Campos de saida, variaveis

---

## 4. Alteracoes Backend

### 4.1 GptMakerFeignClient.java

Adicionar endpoints faltantes:

```java
// Idle Actions
@GetMapping("/v2/agent/{agentId}/idle-actions")
ResponseEntity<String> listIdleActions(@PathVariable String agentId);

@PostMapping("/v2/agent/{agentId}/idle-actions")
ResponseEntity<String> createIdleAction(@PathVariable String agentId, @RequestBody Object action);

@PutMapping("/v2/idle-action/{actionId}")
ResponseEntity<String> updateIdleAction(@PathVariable String actionId, @RequestBody Object action);

@DeleteMapping("/v2/idle-action/{actionId}")
ResponseEntity<String> deleteIdleAction(@PathVariable String actionId);

// Webhooks (ja existe GET/PUT)
// Transfer Rules (ja existe GET/POST)
@PutMapping("/v2/transfer-rule/{ruleId}")
ResponseEntity<String> updateTransferRule(@PathVariable String ruleId, @RequestBody Object rule);

@DeleteMapping("/v2/transfer-rule/{ruleId}")
ResponseEntity<String> deleteTransferRule(@PathVariable String ruleId);

// Training update/delete (ja existe DELETE)
@PutMapping("/v2/training/{trainingId}")
ResponseEntity<String> updateTraining(@PathVariable String trainingId, @RequestBody Object training);

// Intention update/delete
@PutMapping("/v2/intention/{intentionId}")
ResponseEntity<String> updateIntention(@PathVariable String intentionId, @RequestBody Object intention);

@DeleteMapping("/v2/intention/{intentionId}")
ResponseEntity<String> deleteIntention(@PathVariable String intentionId);
```

### 4.2 GptMakerClient.java

Adicionar metodos para cada novo endpoint, seguindo padrao existente.

### 4.3 FranchiseController.java

Adicionar endpoints REST para cada recurso:

```
GET    /franchises/{id}/gptmaker/trainings
POST   /franchises/{id}/gptmaker/trainings
PUT    /franchises/{id}/gptmaker/trainings/{trainingId}
DELETE /franchises/{id}/gptmaker/trainings/{trainingId}

GET    /franchises/{id}/gptmaker/idle-actions
POST   /franchises/{id}/gptmaker/idle-actions
PUT    /franchises/{id}/gptmaker/idle-actions/{actionId}
DELETE /franchises/{id}/gptmaker/idle-actions/{actionId}

GET    /franchises/{id}/gptmaker/webhooks
PUT    /franchises/{id}/gptmaker/webhooks

GET    /franchises/{id}/gptmaker/transfer-rules
POST   /franchises/{id}/gptmaker/transfer-rules
PUT    /franchises/{id}/gptmaker/transfer-rules/{ruleId}
DELETE /franchises/{id}/gptmaker/transfer-rules/{ruleId}

GET    /franchises/{id}/gptmaker/intentions
POST   /franchises/{id}/gptmaker/intentions
PUT    /franchises/{id}/gptmaker/intentions/{intentionId}
DELETE /franchises/{id}/gptmaker/intentions/{intentionId}
```

### 4.4 FranchiseService.java

Adicionar metodos de servico para cada recurso, seguindo padrao de `listIntentions`, `listTrainings`, etc.

---

## 5. Alteracoes Frontend

### 5.1 api.ts

Adicionar funcoes para cada novo endpoint:

```typescript
// Trainings
export function getGptMakerTrainings(franchiseId: string)
export function createGptMakerTraining(franchiseId: string, payload: TrainingPayload)
export function updateGptMakerTraining(franchiseId: string, trainingId: string, payload: TrainingPayload)
export function deleteGptMakerTraining(franchiseId: string, trainingId: string)

// Idle Actions
export function getIdleActions(franchiseId: string)
export function createIdleAction(franchiseId: string, payload: IdleActionPayload)
export function updateIdleAction(franchiseId: string, actionId: string, payload: IdleActionPayload)
export function deleteIdleAction(franchiseId: string, actionId: string)

// Webhooks
export function getAgentWebhooks(franchiseId: string)
export function updateAgentWebhooks(franchiseId: string, webhooks: WebhooksPayload)

// Transfer Rules
export function getTransferRules(franchiseId: string)
export function createTransferRule(franchiseId: string, payload: TransferRulePayload)
export function updateTransferRule(franchiseId: string, ruleId: string, payload: TransferRulePayload)
export function deleteTransferRule(franchiseId: string, ruleId: string)

// Intentions (melhorar)
export function getGptMakerIntentions(franchiseId: string)
export function createGptMakerIntention(franchiseId: string, payload: IntentionPayload)
export function updateGptMakerIntention(franchiseId: string, intentionId: string, payload: IntentionPayload)
export function deleteGptMakerIntention(franchiseId: string, intentionId: string)
```

### 5.2 configuracao/page.tsx

Reestruturar a tab "Configuracoes" com sub-abas:

```tsx
const settingsTabs: TabItem[] = [
  { id: "conversation", label: "Conversa", content: <ConversationSettings /> },
  { id: "idle-actions", label: "Acoes de Inatividade", content: <IdleActionsSettings /> },
  { id: "webhooks", label: "Webhooks", content: <WebhooksSettings /> },
  { id: "transfer-rules", label: "Regras de Transferencia", content: <TransferRulesSettings /> },
];
```

### 5.3 Novos componentes

1. **ConversationSettings.tsx** — Formulario de settings com todos os campos da API
2. **IdleActionsSettings.tsx** — Lista + modal de criacao/edicao de acoes de inatividade
3. **WebhooksSettings.tsx** — Lista de eventos com URLs configuraveis
4. **TransferRulesSettings.tsx** — Lista + modal de criacao/edicao de regras
5. **TrainingList.tsx** — Lista de treinamentos com edicao/remocao
6. **IntentionWizard.tsx** — Wizard de 3 passos para criar intencoes

---

## 6. Fluxo de Dados

```
Frontend → api.ts → FranchiseController → FranchiseService → GptMakerClient → GptMakerFeignClient → GPTMaker API
```

Cada operacao:
1. Frontend chama funcao em `api.ts`
2. `api.ts` faz HTTP request para backend
3. Backend valida permissao (SUPER_ADMIN ou ADMIN_FRANQUIA da propria franquia)
4. Backend chama `GptMakerClient` que faz request para GPTMaker API
5. Response volta no mesmo caminho

---

## 7. Super Admin - Padroes Pre-configuraveis

O SUPER_ADMIN pode pre-configurar padroes que as franquias herdam:

### Padroes existentes (AssistantStandardProfile)
- BEHAVIOR — Comportamento
- ROLE — Tipo de trabalho
- BASE_DESCRIPTION — Descricao base
- TRAININGS — Treinamentos
- INTENTIONS — Intencoes
- AGENT_SETTINGS — Configuracoes
- IDLE_ACTIONS — Acoes de inatividade
- TRANSFER_RULES — Regras de transferencia

### Como funciona
1. SUPER_ADMIN configura padroes em `/configuracoes/textos-padrao`
2. Franquias herdam padroes automaticamente
3. Franquias podem customizar individualmente
4. Mudancas no padrao podem ser propagadas

---

## 8. Plano de Implementacao

### Fase 1: Corrigir bugs (imediato) ✅
- [x] Corrigir mapeamento de treinamentos (title/content vs type/text)
- [x] Corrigir erro ao adicionar treinamento
- [x] Garantir que settings envia todos os campos obrigatorios

### Fase 2: Configuracoes completas (1-2 dias) ✅
- [x] Implementar todos os campos de settings conforme API
- [x] Sub-abas na tab Configuracoes
- [x] Componente ConversationSettings

### Fase 3: Treinamentos CRUD (1 dia) ✅
- [x] Listar treinamentos do GPTMaker
- [x] Criar treinamento (texto)
- [x] Remover treinamento
- [ ] Editar treinamento
- [ ] Criar treinamento (website, video, documento)

### Fase 4: Intencoes melhoradas (1 dia) ⏳
- [x] Listar intencoes
- [x] Criar intencao
- [x] Remover intencao
- [ ] Wizard de 3 passos
- [ ] Editar intencao
- [ ] Campos de saida

### Fase 5: Acoes de inatividade (1 dia) ✅
- [x] Listar acoes
- [x] Criar acao
- [x] Editar acao
- [x] Remover acao

### Fase 6: Webhooks (0.5 dia) ✅
- [x] Listar eventos
- [x] Configurar URL por evento
- [x] Salvar webhooks

### Fase 7: Regras de transferencia (1 dia) ✅
- [x] Listar regras
- [x] Criar regra
- [x] Editar regra
- [x] Remover regra

### Fase 8: Super Admin padroes (0.5 dia) ⏳
- [ ] Padroes para acoes de inatividade
- [ ] Padroes para webhooks
- [ ] Padroes para regras de transferencia

---

## 9. Arquivos Implementados

### Backend
- `GptMakerFeignClient.java` — Endpoints para idle-actions, transfer-rules, training, intention CRUD
- `GptMakerClient.java` — Metodos para todos os endpoints GPTMaker
- `FranchiseController.java` — REST endpoints para todos os recursos
- `FranchiseService.java` — Logica de negocio para todos os recursos

### Frontend
- `api.ts` — Funcoes para todos os endpoints
- `ConversationSettings.tsx` — Formulario completo de settings
- `IdleActionsSettings.tsx` — CRUD de acoes de inatividade
- `WebhooksSettings.tsx` — Configuracao de webhooks por evento
- `TransferRulesSettings.tsx` — CRUD de regras de transferencia
- `configuracao/page.tsx` — Pagina principal com sub-abas

---

## 10. Decision Log

| Decisao | Alternativas | Escolha |
|---------|-------------|---------|
| Sub-abas em Configuracoes | Tudo em uma pagina / Paginas separadas | Sub-abas (menos navegacao) |
| Treinamentos: mapear campos | Adaptar frontend / Adaptar backend | Adaptar frontend (menos mudanca) |
| Intencoes: wizard vs form | Form unico / Wizard multi-passo | Wizard (melhor UX para campos complexos) |
| Acoes de inatividade: UI | Lista simples / Cards com preview | Cards com preview (melhor visualizacao) |
