# Melhorias Wizard de Criacao de Agente e SUPER_ADMIN

## Data: 2026-06-19

## Problemas Identificados

1. **Texto padrao nao aparecia nos campos**: Quando o SUPER_ADMIN definia configuracoes padrao, o texto nao aparecia nos campos do formulario ao criar agente
2. **SUPER_ADMIN precisava de melhor UX**: A configuracao do agente padrao era feita em blocos separados sem preview

## Alteracoes Realizadas

### 1. Wizard de Criacao de Agente (`apps/admin-web/app/franquias/[id]/agente/novo/page.tsx`)

**StandardBanner melhorado:**
- Adicionado prop `preview` para mostrar conteudo real dos campos
- Botao "Ver conteudo" para expandir/colapsar o preview
- Mostra o texto real definido pelo SUPER_ADMIN

**Pre-preenchimento corrigido:**
- `productName` agora e pre-preenchido com `jobName` do ROLE block
- `behavior` agora e enviado no payload de provisionamento
- Todos os campos mostram o texto pre-preenchido quando em modo "default"

**Campos afetados:**
- **Perfil**: Comunicacao, Comportamento (behavior)
- **Trabalho**: Finalidade, Produto (jobName), Site, Descricao
- **Treinamentos**: Lista de treinamentos pre-definidos
- **Intencoes**: Lista de intencoes pre-definidas

### 2. SUPER_ADMIN - Preview do Agente Padrao (`apps/admin-web/components/AgentTemplatePreview.tsx`)

**Novo componente criado:**
- Mostra preview completo do agente padrao
- Exibe: Avatar, Nome, Comunicacao, Finalidade, Treinamentos, Intencoes, Configuracoes
- Atualiza em tempo real conforme o SUPER_ADMIN edita os blocos

### 3. SUPER_ADMIN - Pagina de Configuracao (`apps/admin-web/app/configuracoes/textos-padrao/page.tsx`)

**Layout melhorado:**
- Grid responsivo: Editor (esquerda) + Preview (direita)
- Botao para mostrar/ocultar preview
- Preview atualiza automaticamente ao salvar blocos

### 4. Backend - Campo `behavior` no ProvisionRequest

**`ProvisionFranchiseGptMakerAgentRequest.java`:**
- Adicionado campo `behavior` (opcional)
- Se fornecido, usa o behavior customizado em vez do gerado automaticamente

**`FranchiseService.java`:**
- Logica atualizada para usar `behavior` customizado se fornecido

## Fluxo Atualizado

### SUPER_ADMIN configura padrao:
1. Acessa `/configuracoes/textos-padrao`
2. Edita blocos: ROLE, BEHAVIOR, TRAININGS, INTENTIONS, AGENT_SETTINGS
3. Ve preview do agente em tempo real no painel direito
4. Salva cada bloco individualmente

### Franqueado cria agente:
1. Acessa `/franquias/{id}/agente/novo`
2. Ve banner "Configuracao definida pelo SUPER_ADMIN" com preview
3. Pode clicar "Ver conteudo" para ver o texto completo
4. Opcoes: "Usar padrao" | "Editar" | "Nao usar"
5. Campos mostram texto pre-preenchido
6. Ao criar, envia todos os dados para GPTMaker

## Campos Pre-preenchidos

| Campo | Fonte | Bloco |
|-------|-------|-------|
| Comunicacao | communicationType | ROLE |
| Comportamento | instruction | BEHAVIOR |
| Finalidade | type | ROLE |
| Produto | jobName | ROLE |
| Site | jobSite | ROLE |
| Descricao | description | ROLE |
| Treinamentos | items[] | TRAININGS |
| Intencoes | items[] | INTENTIONS |

## Arquivos Alterados

| Arquivo | Mudanca |
|---------|---------|
| `apps/admin-web/app/franquias/[id]/agente/novo/page.tsx` | StandardBanner com preview, pre-preenchimento corrigido |
| `apps/admin-web/components/AgentTemplatePreview.tsx` | Novo componente de preview |
| `apps/admin-web/app/configuracoes/textos-padrao/page.tsx` | Layout com preview |
| `apps/api/.../dto/ProvisionFranchiseGptMakerAgentRequest.java` | Campo behavior |
| `apps/api/.../service/FranchiseService.java` | Usa behavior customizado |
