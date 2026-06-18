# Brainstorming Enterprise Gap

Diagnostico objetivo do que ainda falta no Vavive Agent Studio para sair de MVP tecnico e operar como produto SaaS enterprise para franquias Vavive.

Base usada nesta analise:

- README atual do projeto
- estrutura real em `apps/admin-web` e `apps/api`
- servicos `FranchiseService`, `ConversationService`, `GptMakerService`
- telas principais do painel
- documentacao oficial GPTMaker: https://developer.gptmaker.ai/api-reference/introduction

## Fluxo de produto alvo

```text
Franquia
  -> Workspace GPTMaker
    -> Agente da franquia
      -> Configuracao e treinamento
        -> Conversas e atendimento
```

Regra central: agente nao e um recurso solto. O agente existe dentro da franquia e depende de workspace vinculada.

## O que ja existe no codigo

### Backend

- autenticacao JWT com perfis `SUPER_ADMIN` e `ADMIN_FRANQUIA`
- criacao conjunta de franquia + `ADMIN_FRANQUIA` em `POST /franchises/full`
- restricao de acesso por franquia em `FranchiseService` e `ConversationService`
- vinculo de workspace GPTMaker por franquia
- provisionamento de agente GPTMaker por franquia
- setup salvo por franquia
- geracao/publicacao de treinamento
- listagem de conversas locais e consulta de mensagens da interacao GPTMaker
- inicio de atendimento humano

### Frontend

- fluxo de nova franquia sem mencionar agente
- tela de franquia com secao de conexao, administrador e agente
- bloqueio visual de criacao de agente sem workspace
- `/agentes` centrado em franquias
- `/conversas` com teste do agente e lista de atendimentos
- `/setup-guiado` ja renomeado visualmente para `Configuracao do agente`

## O que ainda falta para virar produto enterprise

## 1. UX e linguagem ainda estao em nivel de MVP

O produto ja tem as rotas principais, mas ainda mistura linguagem operacional com linguagem tecnica ou generica.

Pontos visiveis:

- varias telas ainda usam `Integracao` onde o produto precisa comunicar `conexao da franquia` para `ADMIN_FRANQUIA`
- empty states ainda estao simples demais
- dashboard ainda parece painel tecnico de dados e nao central operacional da franquia/rede
- ha problemas de texto com acentuacao quebrada em varios arquivos do front-end
- o setup ainda mostra a etapa `Escolher franquia`, o que para `ADMIN_FRANQUIA` nao deveria existir como etapa do processo

Impacto: a base funcional existe, mas a experiencia ainda nao comunica produto maduro.

## 2. Conversas ainda estao em modo "teste assistido", nao em central de atendimento

Hoje a tela de conversas suporta:

- enviar mensagem de teste
- listar sessoes locais
- ver mensagens
- assumir atendimento humano

Mas ainda faltam partes importantes do fluxo enterprise:

- listar conversas reais do GPTMaker de forma sincronizada e consistente
- encerrar atendimento humano
- enviar mensagem manual na conversa assumida
- devolver para IA
- filtros por status, franquia, data e canal
- identificacao clara de fila, responsavel e SLA

Observacao importante: o backend ainda retorna `contextId`, `chatId` e `interactionId` no fluxo de teste. A UI principal ja esconde isso, mas o contrato ainda esta tecnico demais para uma camada de produto.

## 3. Canais ainda estao fake na pratica

A tela `/canais` hoje mostra um conjunto fixo:

- Webchat
- WhatsApp
- Telegram
- Facebook Messenger
- Instagram

Esse bloco e hardcoded no front-end. Isso conflita com a regra de nao exibir canais inventados.

Pelo GPTMaker oficial, existem endpoints de canais, incluindo:

- `GET Listar canais`
- `GET Listar canais do workspace`
- `POST Criar canal`
- `PUT Atualizar configuracoes do canal`

Logo, o caminho enterprise correto e:

1. implementar integracao real de canais no backend
2. exibir apenas canais retornados pela API
3. se nao houver suporte suficiente ou token/configuracao valida, mostrar empty state real

## 4. Integracao GPTMaker cobre apenas parte pequena da API oficial

Hoje o backend usa, de forma pratica:

- workspaces: listagem
- agentes: listagem e criacao
- conversa com agente
- mensagens da interacao
- iniciar atendimento humano
- criar treinamento
- criar intencao

Segundo a documentacao oficial do GPTMaker, ainda ha espaco claro para evolucao em:

- chats: listar, mensagens, assumir, encerrar, enviar mensagem, editar/remover
- canais: listar por workspace e sincronizar configuracoes
- agentes: atualizar agente, ativar/inativar, configuracoes, webhooks
- treinamentos: listar, atualizar e remover
- regras de transferencia
- acoes de inatividade
- contatos e atendimentos

Impacto: o sistema ja integra o nucleo de provisionamento, mas ainda nao opera o ciclo completo de atendimento e administracao.

## 5. A modelagem de franquia esta boa, mas ainda falta consolidar o "produto correto"

O fluxo principal descrito por voce ja aparece no codigo, mas ainda nao esta totalmente fechado:

- `ADMIN_FRANQUIA` ainda acessa telas em que a linguagem pode insinuar detalhes tecnicos da integracao
- `/franquias/[id]` ainda nao esta organizada nos blocos finais desejados: dados, administrador, conexao GPTMaker, agente, treinamentos, canais, conversas
- `/dashboard` ainda nao se ancora no status operacional da franquia

O backend ja impede muitos acessos indevidos, mas o front ainda precisa traduzir isso melhor em navegacao e hierarquia de informacao.

## 6. Setup e textos padrao ainda podem ficar mais naturais

Ja existe base importante:

- textos padrao ativos
- setup por franquia
- geracao de treinamento

O que falta:

- textos padrao entrarem de forma mais clara e rastreavel no setup
- mostrar diferenca entre texto global da matriz e personalizacao local da franquia
- passo final focado em "gerar treinamento" e nao apenas "publicar"
- revisar o progresso do setup para refletir melhor o fluxo real do negocio

## 7. Dashboard ainda mede mais "cadastro" do que operacao

O dashboard atual ainda privilegia:

- franquias ativas
- agentes configurados
- leads recentes
- quantidade de treinamentos

Para virar painel enterprise, precisa trazer mais contexto operacional:

- franquias bloqueadas por falta de workspace
- franquias sem agente
- franquias prontas para publicar treinamento
- conversas aguardando humano
- canais sincronizados
- ultimas acoes da rede

## 8. Ainda ha risco de termos tecnicos escaparem pela API

Na UI principal, boa parte disso ja foi suavizada. Mesmo assim, no contrato e nos nomes internos ainda existem campos como:

- `contextId`
- `chatId`
- `interactionId`
- `workspaceId`
- `externalReference`
- `errorCode`

Para produto enterprise, a regra deveria ser:

- API interna pode manter IDs tecnicos
- BFF/DTO de tela deve expor apenas linguagem de negocio
- UI nunca deve depender desses nomes

## 9. Seguranca de produto esta boa no dominio, mas ainda nao fechada na borda

Pontos positivos:

- `ADMIN_FRANQUIA` nao acessa outra franquia em `FranchiseService`
- `ADMIN_FRANQUIA` nao acessa conversa de outra franquia em `ConversationService`
- GPTMaker sensivel fica no backend

Lacunas:

- CORS esta fixo em `http://localhost:3000`, o que nao atende ambiente SaaS enterprise
- faltam testes mais visiveis para regras de autorizacao em conversas, canais e agente por franquia
- canais ainda nao existem no backend, entao a protecao de escopo ainda nao foi exercitada nessa frente

## 10. Ainda ha dependencias de estado local em vez de sincronizacao real

Exemplos:

- conversas sao persistidas localmente a partir do teste do agente
- treinamentos ficam salvos localmente mesmo quando a publicacao falha
- dashboard depende mais do banco local do que de leitura sincronizada de operacao GPTMaker

Isso e util para MVP, mas para operacao enterprise o produto precisa deixar claro:

- o que e dado local
- o que e dado sincronizado
- quando houve ultima sincronizacao valida

## Mapa de prioridades recomendado

## Fase 1: remover falsos positivos de produto

- trocar a tela `/canais` para dados reais ou empty state real
- revisar `/dashboard`, `/franquias`, `/franquias/[id]` e `/conversas` com linguagem de negocio
- retirar da camada de tela qualquer exposicao residual de contratos tecnicos
- corrigir texto quebrado por encoding

## Fase 2: fechar o fluxo principal da franquia

- consolidar `/franquias/[id]` nos blocos de negocio finais
- reforcar o bloqueio de agente sem workspace em todas as acoes
- tornar `/agentes` apenas um atalho por franquia, nunca um cadastro principal isolado
- simplificar o setup para `ADMIN_FRANQUIA`

## Fase 3: atendimento real

- sincronizar chats/conversas reais do GPTMaker
- assumir atendimento, enviar mensagem manual e devolver para IA
- organizar inbox por franquia/status/canal

## Fase 4: operacao enterprise

- canais reais por workspace
- telemetria e sincronizacao
- auditoria de alteracoes criticas
- analytics e pos-atendimento

## Decisao pratica para este projeto

Se o objetivo e transformar o Vavive Agent Studio em produto operacional, o proximo corte correto nao e "mais features GPTMaker" de forma solta.

O proximo corte correto e:

1. limpar UX e linguagem
2. remover dados inventados
3. fechar o fluxo franquia -> workspace -> agente -> configuracao -> conversa
4. depois expandir para canais e atendimento humano completo com base na API oficial GPTMaker

Esse caminho respeita o que o codigo ja tem, reduz retrabalho e aproxima o MVP da operacao real da rede.

