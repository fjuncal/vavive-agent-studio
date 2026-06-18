# Assistente Vavive - Fase 1 Implementation Plan

Objetivo:

Entregar primeira fase coesa cobrindo estabilidade, marca, saldo operacional e modelo de padroes por bloco do `Assistente Vavive`.

## Fase A - Estabilizacao imediata

### Objetivo

Parar erros visiveis e eliminar dependencias front frageis.

### Itens

- corrigir `Cannot read properties of undefined (reading 'toLocaleString')` em [page.tsx](/C:/Users/lypy_/IdeaProjects/vavive-agent-studio/apps/admin-web/app/franquias/[id]/page.tsx)
- normalizar contrato de saldo no backend
- aplicar fallback numerico no front para `credits`, `used`, `remaining`
- substituir avatar externo por:
  - assets locais controlados
  - ou fallback visual robusto
- revisar textos com encoding quebrado

### Criterio de pronto

- nenhuma tela de franquia quebra por saldo ausente
- preview/avatar do agente sempre renderiza algo valido

## Fase B - Branding de produto

### Objetivo

Remover `GptMaker` da experiencia do franqueado.

### Itens

- revisar labels, headings, descricoes e badges
- trocar termos por linguagem `Assistente Vavive`
- esconder nomes tecnicos em telas de franquia, setup, agente, dashboard e conversas
- manter nomes tecnicos apenas em areas exclusivas da matriz quando realmente necessario

### Criterio de pronto

- franqueado nao enxerga nome do provedor nem termos tecnicos desnecessarios

## Fase C - Saldo operacional

### Objetivo

Tornar saldo visivel e util.

### Itens

- mostrar saldo no dashboard da franquia
- mostrar saldo por franquia na lista do `SUPER_ADMIN`
- criar endpoint agregado se necessario para evitar N+1 no front
- definir estados:
  - disponivel
  - indisponivel
  - sem workspace

### Criterio de pronto

- dashboard da franquia mostra saldo sem quebrar
- lista do `SUPER_ADMIN` mostra saldo por unidade com degradacao graciosa

## Fase D - Padrao global por bloco

### Objetivo

Criar estrutura de padrao global da matriz e heranca por franquia.

### Itens

- criar modelo:
  - `AssistantStandardProfile`
  - `AssistantStandardBlock`
  - `FranchiseAssistantBlockConfig`
- criar resolucao backend para `STANDARD` vs `CUSTOM`
- preparar blocos:
  - comportamento
  - tipo de trabalho
  - descricao/base
  - treinamentos
  - intencoes
  - configuracoes do agente
  - acoes de inatividade
  - regras de transferencia

### Criterio de pronto

- backend consegue entregar configuracao resolvida por bloco

## Fase E - UX da matriz

### Objetivo

Permitir `SUPER_ADMIN` configurar padroes globais do assistente.

### Itens

- nova tela ou expansao de `textos padrao`
- separar biblioteca por blocos
- permitir editar payload de cada bloco
- mostrar versao ativa do padrao

### Criterio de pronto

- matriz consegue definir padrao global sem editar dados de franquia

## Fase F - UX da franquia

### Objetivo

Permitir escolha por bloco entre herdar e customizar.

### Itens

- transformar `/setup-guiado` em workbench por blocos
- cada bloco mostra:
  - status `padrao` ou `personalizado`
  - acao `customizar bloco`
- ao customizar:
  - copiar payload atual
  - desbloquear edicao
- reorganizar `/franquias/[id]/agente` como revisao operacional

### Criterio de pronto

- franquia consegue escolher `usar padrao` ou `criar proprio` por bloco

## Fase G - Integracao operacional dos blocos

### Objetivo

Conectar blocos ao provedor oficial via backend.

### Itens

- mapear payload oficial de:
  - criar/atualizar agente
  - treinamentos
  - intencoes
  - configuracoes
  - inatividade
  - transferencia
- persistir estado local e retorno operacional
- exibir falhas legiveis

### Criterio de pronto

- configuracao escolhida na franquia ou matriz consegue refletir no assistente real

## Ordem recomendada

1. Fase A
2. Fase B
3. Fase C
4. Fase D
5. Fase E
6. Fase F
7. Fase G

## Riscos de implementacao

- payloads oficiais podem variar por endpoint e exigir DTOs novos
- saldo por franquia pode exigir agregacao para nao degradar lista do `SUPER_ADMIN`
- migracao de `DefaultAgentText` para modelo por bloco precisa preservar dados uteis existentes
- esconder branding sem BFF suficiente pode deixar front com many `if`s temporarios

## Entrega incremental recomendada

### Sprint 1

- Fase A
- Fase B
- Fase C

### Sprint 2

- Fase D
- Fase E

### Sprint 3

- Fase F
- Fase G
