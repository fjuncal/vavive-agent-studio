# Code Review - Assistente Vavive Fase 1

Data: 2026-06-18

Escopo revisado:
- change `assistente-vavive-fase-1`
- diff em `apps/api` e `apps/admin-web`

## Findings

### 1. High - lista de franquias faz chamada externa de saldo por item

Arquivos:
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/FranchiseService.java:102`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/FranchiseService.java:106`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/WorkspaceCreditsService.java:19`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/WorkspaceCreditsService.java:32`

Problema:
- fluxo de listagem do `SUPER_ADMIN` resolve saldo chamando `workspaceCreditsService.forFranchise(franchise)` para cada franquia
- cada chamada pode bater na API externa de saldo da workspace

Impacto:
- endpoint `/franchises` vira `N` chamadas externas por request
- lista pode ficar lenta, instavel e sensivel a rate limit
- uma degradacao do provedor afeta toda a tela administrativa

Correcao sugerida:
- trocar para endpoint agregado ou carregamento em lote
- se isso nao existir ainda no provedor, usar cache curto e fallback por estado degradado
- nao fazer chamada remota bloqueante por item na listagem principal

### 2. High - customizacao por bloco salva localmente, mas quase nada sincroniza no agente real

Arquivos:
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:153`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:174`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:320`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:325`

Problema:
- `updateFranchiseBlock(...)` chama `syncOperationalBlock(...)`
- `syncOperationalBlock(...)` hoje sincroniza so `AGENT_SETTINGS`
- blocos marcados na fase 1 como operacionais (`IDLE_ACTIONS`, `TRANSFER_RULES`) continuam apenas no banco local
- `TRAININGS` e `INTENTIONS` tambem aparecem no workbench, mas nao existe aplicacao remota quando a franquia customiza

Impacto:
- UI diz que bloco esta personalizado
- comportamento real do assistente continua diferente do que operador salvou
- gera falso senso de configuracao concluida

Correcao sugerida:
- limitar UI apenas ao que realmente sincroniza
- ou implementar sync real por bloco antes de manter task como concluida
- no minimo, retornar estado explicito `local-only` quando o bloco ainda nao aplica no provedor

### 3. Medium - edicao de padrao global aceita JSON arbitrario sem validacao de schema

Arquivos:
- `apps/admin-web/app/configuracoes/textos-padrao/page.tsx:21`
- `apps/admin-web/app/configuracoes/textos-padrao/page.tsx:33`
- `apps/admin-web/app/configuracoes/textos-padrao/page.tsx:52`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:92`
- `apps/api/src/main/java/br/com/vavive/gptmaker/service/AssistantStandardProfileService.java:153`

Problema:
- tela de padrao global edita payload em `textarea` cru
- backend aceita qualquer objeto JSON sintaticamente valido
- nao ha validacao por bloco para campos obrigatorios, enums ou estrutura esperada

Impacto:
- erro operacional simples pode quebrar comportamento efetivo do assistente
- falhas aparecem tarde, em runtime, e ficam dificeis de explicar ao `SUPER_ADMIN`

Correcao sugerida:
- validar schema por `blockType` no backend
- rejeitar payload incompleto ou inconsistente
- medio prazo: trocar `textarea` por formularios estruturados por bloco

### 4. High - token da integracao ainda esta hardcoded em configuracao versionada

Arquivo:
- `apps/api/src/main/resources/application.yml:34`

Problema:
- `GPTMAKER_API_TOKEN` continua com default hardcoded no `application.yml`

Impacto:
- vazamento de segredo
- risco operacional e de seguranca caso repositorio circule fora do ambiente controlado

Correcao sugerida:
- remover default imediatamente
- exigir secret via ambiente/cofre
- invalidar e rotacionar token atual

Observacao:
- este ponto aparece no diff atual, mas pode ser pre-existente ao change revisado

## Perguntas abertas

- saldo da lista de franquias vai virar endpoint agregado agora ou fica com cache curto como mitigacao temporaria?
- workbench deve esconder blocos ainda nao sincronizados no provedor ou mostrar badge claro de `somente local`?

## Risco residual

- build e testes anteriores passaram, mas isso nao cobre custo operacional da listagem com muitas franquias
- tambem nao cobre divergencia entre estado salvo localmente e estado aplicado no agente remoto
