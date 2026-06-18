# Code Review - Productize GPTMaker Operations

Base revisada:

- [brainstorming-enterprise-gap.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/brainstorming-enterprise-gap.md)
- diff atual de backend, frontend e docs ligados ao change `productize-gptmaker-operations`

## Findings

### 1. High - sync de inbox/canais acontece dentro de transacao `readOnly`, entao persistencia pode nao ser gravada

- [ConversationService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ConversationService.java:69)
- [ConversationService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ConversationService.java:75)
- [ChannelService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ChannelService.java:43)
- [ChannelService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ChannelService.java:47)

`list()` nos dois services abre transacao `@Transactional(readOnly = true)` e, dentro dela, chama rotinas que fazem `save()`. Em Hibernate, `readOnly` costuma colocar flush mode manual. Resultado classico: UI enxerga retorno da chamada, mas `lastSyncedAt`, novos chats e snapshots de canal podem nao ir para banco no commit. Isso vira bug intermitente dificil de rastrear em producao.

Fix esperado:

- separar sync em metodo `@Transactional` normal
- deixar `list()` apenas ler
- ou remover `readOnly` quando a chamada realmente sincroniza e persiste estado

### 2. High - concluir venda nao e idempotente; clique repetido dispara handoff duplicado

- [ConversationService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ConversationService.java:258)
- [ConversationService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ConversationService.java:276)
- [ConversationService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/ConversationService.java:283)
- [page.tsx](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/admin-web/app/conversas/page.tsx:257)
- [page.tsx](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/admin-web/app/conversas/page.tsx:260)

`completeConversation()` nao verifica se conversa ja foi concluida nem se handoff comercial ja existe. Cada nova chamada com `VENDA_CONCLUIDA` cria outro `ConversationHandoffEvent` e chama novo envio de WhatsApp. Como botao continua disponivel na tela, operador pode duplicar venda e duplicar aviso ao franqueado com um segundo clique ou retry do browser.

Fix esperado:

- bloquear transicao se `operationalStatus` ja for `concluida` ou `venda_concluida`
- impor idempotencia por conversa + outcome
- desabilitar botoes de conclusao depois de sucesso

### 3. Medium - logs novos continuam expondo conteudo sensivel de atendimento e resumo comercial

- [WhatsappHandoffService.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/service/WhatsappHandoffService.java:26)
- [GptMakerClient.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/integration/gptmaker/GptMakerClient.java:172)
- [GptMakerClient.java](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/api/src/main/java/br/com/vavive/gptmaker/integration/gptmaker/GptMakerClient.java:236)

Agora fluxo comercial e inbox passam por logs com `summaryPreview` e `bodyPreview`. Esses previews podem conter nome de cliente, telefone, historico de conversa e detalhes comerciais. Em ambiente real isso aumenta risco LGPD e vaza dado operacional em agregadores de log.

Fix esperado:

- remover previews de payloads de conversa
- logar apenas ids internos, status, endpoint e timestamps
- se precisar debug, proteger via log level dedicado e redacao forte de PII

## Open Questions

- rollout real vai usar polling no `GET /conversations` ou webhooks/eventos GPTMaker? Hoje `SUPER_ADMIN` pode forcar sync de todas franquias em leitura simples, o que tende a escalar mal.
- qual sera regra oficial de reenvio de handoff comercial? hoje contrato ainda nao diferencia retry automatico de novo disparo manual.

## Resumo

Mudanca anda bem em funcionalidade, mas ainda tem 3 riscos de producao: persistencia dentro de `readOnly`, duplicidade de handoff e vazamento de PII em logs. Esses pontos merecem ajuste antes de rollout real.
