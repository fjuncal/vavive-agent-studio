# Assistente Vavive - Fase 1 Design

Base:

- [brainstorming-enterprise-gap.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/brainstorming-enterprise-gap.md)
- API oficial GPT Maker: https://developer.gptmaker.ai/api-reference/introduction

## Understanding Summary

- Fase 1 vai atacar estabilidade, marca, saldo operacional e nova camada de configuracao do `Assistente Vavive`.
- O franqueado nao deve ver `GptMaker`; integracao fica escondida atras da linguagem do produto.
- Precisamos corrigir erro real no front de creditos e revisar outros pontos quebrados antes de ampliar testes.
- `SUPER_ADMIN` passa a configurar padroes globais do assistente por bloco.
- A franquia escolhe por bloco entre `usar padrao da matriz` ou `configurar proprio`.
- Se escolher padrao, bloco comeca bloqueado e pode virar proprio por acao manual de `customizar`.
- Enquanto bloco continuar em padrao, mudanca da matriz propaga automaticamente.

## Escopo da Fase 1

### Entram na fase 1

- correcao de estabilidade do front
- remocao de `GptMaker` da experiencia do franqueado
- saldo no dashboard da franquia
- saldo por franquia na lista do `SUPER_ADMIN`
- padroes globais configurados pela matriz
- escolha por bloco entre padrao e customizacao
- blocos:
  - comportamento do agente
  - tipo de trabalho
  - descricao/base do agente
  - treinamentos
  - intencoes
  - configuracoes do agente
  - acoes de inatividade
  - regras de transferencia

### Ficam fora da fase 1

- webhooks na UX principal
- automacao pos-venda por webhook/WhatsApp externo

## Assumptions

- saldo de creditos da workspace deve aparecer no dashboard da franquia e na lista de franquias do `SUPER_ADMIN`
- avatares atuais externos nao sao confiaveis e devem ser substituidos por fonte controlada pela aplicacao ou fallback robusto
- backend ja cobre parte dos endpoints necessarios e sera expandido usando API oficial
- manutencao do padrao por bloco sera persistida como estado explicito: `STANDARD` vs `CUSTOM`
- `ADMIN_FRANQUIA` continua sem acesso a detalhes tecnicos da integracao
- rollout inicial pode aceitar polling e leitura on-demand, sem exigir webhooks nesta fase

## Non-Functional Requirements

- performance: dashboard e lista de franquias nao podem disparar cascata pesada de chamadas por item; saldo precisa agregacao, cache ou carregamento controlado
- escala: assumir rede pequena/media nesta fase, mas sem desenho que exploda linearmente sem controle
- seguranca: nenhum payload tecnico ou nome do provedor deve aparecer no front do franqueado
- confiabilidade: se saldo ou configuracao externa falhar, UI mostra estado degradado e nao quebra render
- manutencao: modelo por bloco deve aceitar novos blocos depois, especialmente `WEBHOOKS`

## Design Approach

Abordagem escolhida: `BFF de produto + presets por bloco`

Razoes:

- resolve branding na camada certa
- suporta heranca automatica da matriz
- reduz regra espalhada no front
- prepara crescimento futuro sem reescrever setup

Alternativas consideradas:

- estender apenas `FranchiseSetup`: mais rapido, mas vira modelo inchado e fragil
- catalogo separado sem BFF forte: separa conceito, mas empurra regra demais para o front

## Arquitetura Alvo

- `SUPER_ADMIN` administra `Padroes do Assistente Vavive`
- cada padrao e dividido por bloco funcional
- franquia ve so linguagem de negocio:
  - `usar padrao da matriz`
  - `customizar bloco`
- backend resolve valor efetivo de cada bloco antes de entregar ao front
- integracao externa continua encapsulada
- saldo vira dado operacional:
  - dashboard da franquia mostra saldo da unidade conectada
  - lista do `SUPER_ADMIN` mostra saldo por franquia
  - falha de saldo nao quebra render

## Modelo de Dados Proposto

### `AssistantStandardProfile`

- padrao global ativo da matriz
- nome
- status
- versao
- timestamps

### `AssistantStandardBlock`

- um registro por bloco
- `blockType`:
  - `BEHAVIOR`
  - `ROLE`
  - `BASE_DESCRIPTION`
  - `TRAININGS`
  - `INTENTIONS`
  - `AGENT_SETTINGS`
  - `IDLE_ACTIONS`
  - `TRANSFER_RULES`
- `payloadJson`
- `version`

### `FranchiseAssistantBlockConfig`

- vinculado a franquia
- `blockType`
- `mode`: `STANDARD` ou `CUSTOM`
- `standardVersionApplied`
- `customPayloadJson`
- `customizedAt`

## Regra de Resolucao

- se bloco da franquia estiver em `STANDARD`, backend le padrao global atual
- se matriz mudar padrao, franquia recebe automaticamente na proxima leitura
- se franquia clicar `customizar`, backend copia valor resolvido atual
- bloco vira `CUSTOM`
- depois disso, mudancas da matriz nao afetam mais aquele bloco

## Contratos de Produto Recomendados

- `AssistantStandardProfileResponse`
- `FranchiseAssistantConfigurationResponse`
- `ResolvedAssistantBlockResponse`
- `UpdateFranchiseAssistantBlockModeRequest`
- `UpdateFranchiseAssistantBlockPayloadRequest`

## UX da Fase 1

### Fluxo `SUPER_ADMIN`

- acessa `Padroes do Assistente Vavive`
- configura blocos globais
- revisa versao ativa
- define conteudo padrao e configuracao operacional

### Fluxo `ADMIN_FRANQUIA`

- acessa `Workbench do Assistente Vavive`
- ve cada bloco com estado:
  - `Usando padrao da matriz`
  - `Personalizado pela franquia`
- quando bloco esta em padrao:
  - conteudo aparece bloqueado
  - botao `Customizar bloco`
- ao customizar:
  - backend copia valor resolvido atual
  - bloco vira editavel
  - badge muda para `Personalizado`

### Reorganizacao de telas

- `/franquias/[id]`
  - remover termos tecnicos
  - saldo no resumo operacional
- `/setup-guiado`
  - virar de fato `Workbench do Assistente Vavive`
  - organizado por blocos
- `/franquias/[id]/agente`
  - virar revisao operacional do assistente
- `/franquias`
  - `SUPER_ADMIN` ve coluna de saldo por franquia
- `/dashboard`
  - franquia ve saldo, status de configuracao e operacao
- `textos padrao`
  - deixam de ser textos soltos
  - passam a alimentar blocos claros do padrao global

### Correcao imediata de UX

- proteger render do saldo com fallback numerico
- fallback de avatar local/icone quando imagem falhar
- remover badges e labels `PUBLICADO_GPTMAKER`, `ENVIADO_GPTMAKER` etc. da camada visual do franqueado

## Integracao Backend

Expandir camada atual para usar oficialmente:

- saldo de workspace
- criacao/atualizacao de agente
- treinamentos
- intencoes
- configuracoes do agente
- acoes de inatividade
- regras de transferencia

Webhooks ficam fora da fase 1, mas modelo ja deixa bloco preparado.

## Riscos

- endpoints de saldo podem devolver payload inconsistente; front precisa contrato normalizado
- lista de franquias com saldo por item pode ficar lenta; ideal endpoint agregado ou carregamento lazy por lote
- modelo atual mistura setup simples com configuracao avancada; migracao deve ser incremental
- branding precisa sair do front sem quebrar compatibilidade dos contratos atuais
- avatar externo e dependencia fragil; melhor trocar por assets locais controlados ou fallback robusto

## Decision Log

- nome de produto para franqueado: `Assistente Vavive`
- saldo na fase 1: dashboard da franquia + lista de franquias do `SUPER_ADMIN`
- padrao global deve ser configurado pela matriz
- franquia escolhe por bloco
- blocos entram bloqueados quando usam padrao
- franquia pode desbloquear manualmente via `customizar`
- mudancas da matriz propagam automaticamente enquanto bloco continuar em padrao
- webhooks ficam para fase posterior
- abordagem arquitetural escolhida: BFF de produto + presets por bloco
