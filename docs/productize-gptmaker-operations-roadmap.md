# Productize GPTMaker Operations Roadmap

Roadmap pratico para transformar Vavive Agent Studio de MVP tecnico em produto operacional real para franquias.

Base:

- [Brainstorming enterprise gap](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/docs/brainstorming-enterprise-gap.md)
- change OpenSpec `productize-gptmaker-operations`

## Objetivo

Fechar fluxo principal do produto:

```text
Franquia
  -> Workspace GPTMaker
    -> Agente
      -> Configuracao e treinamento
        -> Conversas reais
          -> Atendimento humano
            -> Conclusao de venda
              -> Handoff no WhatsApp do franqueado
```

## O que precisa entrar no produto

### 1. Painel e UX de produto

- dashboard operacional por perfil
- detalhes de franquia organizados por blocos de negocio
- linguagem sem termos tecnicos do GPTMaker
- empty states reais
- correcoes de acentuacao e textos quebrados

### 2. Integracao GPTMaker oficial mais completa

- sincronizacao real de chats
- sincronizacao real de mensagens
- assumir atendimento humano
- enviar mensagem manual
- devolver atendimento para IA
- listar canais reais por workspace

### 3. Workbench de treinamento

- contexto global da matriz
- personalizacao local da franquia
- exemplos de conversa
- historico de publicacao
- falhas de publicacao legiveis

### 4. Fluxo comercial

- concluir atendimento
- marcar venda concluida ou nao concluida
- gerar resumo comercial
- disparar mensagem para WhatsApp do franqueado
- registrar auditoria e retentativa

### 5. Base tecnica obrigatoria

- DTOs/BFFs orientados a negocio
- segregacao entre IDs internos e externos
- timestamps de sincronizacao
- testes de autorizacao por franquia
- remocao de defaults inseguros de token

## Fases recomendadas

## Fase 1. Contratos e UX real

- remover dados inventados
- revisar dashboard, franquias e conversas
- criar contratos de negocio para UI
- endurecer seguranca e configuracao

## Fase 2. Canais reais

- integrar endpoints oficiais de canais
- persistir status de sincronizacao
- substituir tela hardcoded

## Fase 3. Inbox operacional

- sincronizar conversas reais
- assumir humano, responder, devolver para IA
- filtros por status, canal, periodo e responsavel

## Fase 4. Treinamento do agente

- consolidar setup em workbench unico
- cadastrar exemplos de conversa
- publicar com trilha auditavel

## Fase 5. Pos-atendimento e venda

- encerrar atendimento com resultado comercial
- criar evento de handoff
- enviar WhatsApp ao franqueado
- registrar entrega, falha e retentativa

## Entregaveis OpenSpec

Artifacts gerados em:

- [proposal.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/proposal.md)
- [design.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/design.md)
- [tasks.md](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/tasks.md)

Specs:

- [franchise-operations-dashboard](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/franchise-operations-dashboard/spec.md)
- [gptmaker-live-inbox](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/gptmaker-live-inbox/spec.md)
- [agent-training-workbench](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/agent-training-workbench/spec.md)
- [channel-sync-management](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/channel-sync-management/spec.md)
- [sales-handoff-whatsapp](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/sales-handoff-whatsapp/spec.md)
- [business-facing-api-contracts](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/openspec/changes/productize-gptmaker-operations/specs/business-facing-api-contracts/spec.md)

## Riscos ja mapeados

- API GPTMaker talvez nao cubra 100% fluxo de encerramento/venda
- sincronizacao real pode aumentar latencia sem cache local
- WhatsApp precisa adaptador confiavel e auditavel
- rollout sem feature flags aumenta risco
- token GPTMaker hardcoded em config atual precisa sair
