# Especificacao Completa: Wizard de Criacao de Agente

## Visao Geral

O wizard de criacao de agente permite ao franqueado criar um assistente com configuracoes pre-definidas pelo SUPER_ADMIN. O SUPER_ADMIN pode pre-configurar todos os campos como padrao, e o franqueado pode aceitar, editar ou ignorar cada secao.

---

## 1. Estrutura do Wizard

### Passo 1: Perfil do Agente

**Campos:**
- Nome do agente (texto)
- Comunicacao: FORMAL | NORMAL | DESCONTRAIDA (opcoes)
- Comportamento (campo texto longo - como o agente deve se comportar)

**Padrao do SUPER_ADMIN:**
- O SUPER_ADMIN pode pre-definir o tipo de comunicacao padrao
- O SUPER_ADMIN pode pre-definir o texto de comportamento
- Franqueado pode aceitar, editar ou ignorar

---

### Passo 2: Trabalho

**Campos:**
- Finalidade:
  - **Suporte** - Use essa opcao sempre que o objetivo do seu agente for prestar suporte.
  - **Vendas** - Use sempre que quiser criar um agente no setor de vendas.
  - **Uso pessoal** - Escolha esta opcao caso seja um agente para uso pessoal.
- Vende o produto: (campo texto)
- Site Oficial (opcional): (campo URL)
- Descreva um pouco sobre sua franquia: (campo texto longo)

**Padrao do SUPER_ADMIN:**
- O SUPER_ADMIN pode pre-definir a finalidade padrao
- O SUPER_ADMIN pode pre-definir a descricao da franquia
- Franqueado pode aceitar, editar ou ignorar

---

### Passo 3: Treinamentos

**Sub-menus com opcoes de tipo de treinamento:**

#### 3.1 Texto
- Campo de texto com placeholder: "Escreva uma afirmacao e tecle enter para cadastrar"
- Cada afirmacao vira um item de treinamento
- Lista de afirmacoes cadastradas com opcao de remover

#### 3.2 Website
- Novo treinamento via website ou sitemap
- Campo para colar a URL
- Opcao de intervalo de atualizacao:
  - Em horas (ex: 1h, 4h, 8h, 12h)
  - Em dias (ex: 1 dia, 7 dias)
  - Em semanas (ex: 1 semana, 1 mes)
- Navegar em sub-paginas: Nao | Sim

#### 3.3 Video
- Novo Treinamento via video
- Campo para colar a URL do video

#### 3.4 Documento
- Opcao de fazer upload do documento
- Aceita PDF, DOC, DOCX, TXT

#### 3.5 Base de Conhecimento
- Opcao de conectar bases cadastradas no GPTMaker da workspace
- Lista de bases disponiveis com checkbox para selecionar

**Padrao do SUPER_ADMIN:**
- O SUPER_ADMIN pode pre-definir treinamentos de texto padrao
- O SUPER_ADMIN pode pre-definir URLs de websites padrao
- Franqueado pode aceitar, editar ou ignorar

---

### Passo 4: Intencoes

**Ao clicar em "Cadastrar Primeira Intencao", abre wizard de 3 etapas:**

#### Etapa 1: Detalhes Gerais
- Nome da intencao: (campo texto, max 255 chars)
- Quando usar essa intencao: (campo texto, max 512 chars)

#### Etapa 2: Configurar Acao

**Coletar dados do cliente (opcional):**
- Campo com exemplo: CPF
- Espacado: descricao (ex: "Utilizado para reconhecer o cliente")
- Tipo do campo: Texto | URL | Numero | Booleano | Data | Data e Hora
- Opcao de 3 pontos para remover o campo

**Acao que deve ser feita:**
- Tipo: Webhook | Instrucoes
- Metodo HTTP: GET | POST | PUT | DELETE | PATCH
- Campo para digitar a URL

**Headers (opcional):**
- Botao "+ Adicionar Header"
- Campo: Nome do Header
- Campo: Valor do Header

**Params (opcional):**
- Botao "+ Adicionar Param"
- Campo: Nome do Param
- Campo: Valor do Param

**Body (opcional):**
- Campo de texto para JSON body

#### Etapa 3: Dados de Saida

**Persistir variaveis no contato (opcional):**
- Botao "+" para adicionar variavel
- Ao clicar, aparece:
  - Salvar no campo: opcoes (numero do contato, telefone do contato, email do contato, nome do contato, etc.)
  - Valor: campo texto ou expressao

**Resposta do agente deve ser baseada em:**
- Opcoes:
  - Na interpretacao da resposta da API
  - Em uma instrucao customizada (campo texto)

**Padrao do SUPER_ADMIN:**
- O SUPER_ADMIN pode pre-definir intencoes padrao com todos os campos
- Franqueado pode aceitar, editar ou ignorar

---

### Passo 5: Configuracoes

**Mantido como esta no sistema atual:**
- Modelo de IA
- Timezone
- Transferencia humana
- Lembretes
- Dividir mensagens
- Usar emojis
- Assinar nome
- Limitar assuntos
- Busca inteligente
- Agrupamento de mensagens
- Limite de interacoes
- Acao no limite

---

## 2. Configuracao do SUPER_ADMIN

### Tela: `/configuracoes/textos-padrao`

O SUPER_ADMIN pode pre-configurar todos os campos acima como padrao global.

**Blocos de configuracao (AssistantStandardProfile):**

| Bloco | Descricao | Campos |
|-------|-----------|--------|
| BEHAVIOR | Comportamento | instruction, summary |
| ROLE | Perfil do agente | jobName, communicationType, type, jobSite, description |
| BASE_DESCRIPTION | Descricao base | text |
| TRAININGS | Treinamentos | items[] (type, text, website, video, documentUrl) |
| INTENTIONS | Intencoes | items[] (name, description, instructions, fields[], action, output) |
| AGENT_SETTINGS | Configuracoes | prefferModel, timezone, toggles |
| IDLE_ACTIONS | Acoes de inatividade | items[] (type, seconds, instructions) |
| TRANSFER_RULES | Regras de transferencia | items[] (type, instructions, returnOnFinish) |

---

## 3. Fluxo do Franqueado

### Ao criar agente:

1. **Perfil** - Ve os campos pre-preenchidos pelo SUPER_ADMIN
   - Pode aceitar (Usar Padrao)
   - Pode editar (Editar)
   - Pode ignorar (Nao Usar)

2. **Trabalho** - Ve os campos pre-preenchidos pelo SUPER_ADMIN
   - Pode aceitar (Usar Padrao)
   - Pode editar (Editar)
   - Pode ignorar (Nao Usar)

3. **Treinamentos** - Ve os treinamentos pre-definidos pelo SUPER_ADMIN
   - Pode aceitar (Usar Padrao)
   - Pode editar (Editar) - adicionar/remover treinamentos
   - Pode ignorar (Nao Usar)
   - Pode adicionar novos treinamentos (texto, website, video, documento)

4. **Intencoes** - Ve as intencoes pre-definidas pelo SUPER_ADMIN
   - Pode aceitar (Usar Padrao)
   - Pode editar (Editar) - adicionar/remover intencoes
   - Pode ignorar (Nao Usar)
   - Pode cadastrar novas intencoes

5. **Configuracoes** - Ve as configuracoes pre-definidas pelo SUPER_ADMIN
   - Pode editar conforme necessario

---

## 4. Implementacao Futura: Variaveis nos Textos Padrao

### Conceito

O SUPER_ADMIN pode usar variaveis nos textos padrao que serao substituidas automaticamente pelos dados da franquia.

### Sintaxe

```
{{variavel}}
```

### Variaveis Disponiveis

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `{{franquia_nome}}` | Nome da franquia | Matriz |
| `{{franquia_cidade}}` | Cidade da franquia | Rio de Janeiro |
| `{{franquia_estado}}` | Estado da franquia | RJ |
| `{{franquia_telefone}}` | Telefone da franquia | (21) 99999-9999 |
| `{{franquia_endereco}}` | Endereco da franquia | Rua X, 123 |
| `{{franquia_horario}}` | Horario de atendimento | Seg-Sex 8h-18h |
| `{{franquia_site}}` | Site da franquia | https://exemplo.com |
| `{{responsavel_nome}}` | Nome do responsavel | João Silva |
| `{{agente_nome}}` | Nome do agente | Assistente Matriz |

### Exemplo de Uso

**Texto padrao do SUPER_ADMIN:**
```
Bem-vindo a {{franquia_nome}}! 
Somos especializados em vendas e atendimento na regiao de {{franquia_cidade}}/{{franquia_estado}}.
Nosso horario de atendimento e {{franquia_horario}}.
Site: {{franquia_site}}
```

**Texto apos substituicao (para franquia Matriz no RJ):**
```
Bem-vindo a Matriz! 
Somos especializados em vendas e atendimento na regiao de Rio de Janeiro/RJ.
Nosso horario de atendimento e Seg-Sex 8h-18h.
Site: https://vavive.com.br
```

### Campos Onde Usar Variaveis

- Comportamento do agente (BEHAVIOR)
- Descricao da franquia (BASE_DESCRIPTION)
- Treinamentos de texto (TRAININGS)
- Instrucoes de intencoes (INTENTIONS)
- Mensagens de acoes de inatividade (IDLE_ACTIONS)
- Regras de transferencia (TRANSFER_RULES)

### Implementacao

1. **Backend:** Servico de substituicao de variaveis
   - Recebe texto com variaveis
   - Busca dados da franquia
   - Retorna texto com variaveis substituidas

2. **Frontend:** Preview em tempo real
   - Mostra texto com variaveis
   - Mostra preview com valores reais
   - Indica variaveis nao preenchidas

3. **Persistencia:**
   - Texto salvo com variaveis (nao substituido)
   - Substituicao feita no momento do uso
   - Permite atualizar dados da franquia sem alterar textos

---

## 5. Arquivos a Serem Alterados

### Backend

| Arquivo | Alteracao |
|---------|-----------|
| `AssistantStandardProfileService.java` | Adicionar campos de treinamento (website, video, documento) |
| `AssistantStandardProfileService.java` | Adicionar campos de intencao (fields, action, output) |
| `FranchiseService.java` | Servico de substituicao de variaveis |
| `GptMakerClient.java` | Integrar com API de bases de conhecimento |

### Frontend

| Arquivo | Alteracao |
|---------|-----------|
| `novo/page.tsx` | Reestruturar wizard com novos passos |
| `configuracao/page.tsx` | Atualizar abas de configuracao |
| `BlockEditor.tsx` | Adicionar campos de treinamento (website, video, documento) |
| `BlockEditor.tsx` | Adicionar campos de intencao (fields, action, output) |
| `api.ts` | Adicionar funcoes para novos endpoints |

### Novos Componentes

| Componente | Descricao |
|------------|-----------|
| `TrainingTypeSelector.tsx` | Seletor de tipo de treinamento (texto, website, video, documento, base) |
| `TrainingTextEditor.tsx` | Editor de treinamento por texto (afirmacoes) |
| `TrainingWebsiteEditor.tsx` | Editor de treinamento por website |
| `TrainingVideoEditor.tsx` | Editor de treinamento por video |
| `TrainingDocumentEditor.tsx` | Editor de treinamento por documento |
| `TrainingKnowledgeBase.tsx` | Conexao com bases de conhecimento |
| `IntentionWizard.tsx` | Wizard de 3 etapas para intencoes |
| `IntentionDataCollection.tsx` | Coleta de dados do cliente |
| `IntentionAction.tsx` | Configuracao de acao (webhook, instrucoes) |
| `IntentionOutput.tsx` | Dados de saida e variaveis |

---

## 6. Decision Log

| Decisao | Alternativas | Escolha |
|---------|-------------|---------|
| Variaveis nos textos | Template engine (Handlebars) / Variaveis simples | Variaveis simples `{{var}}` (mais intuitivo) |
| Treinamentos: tipos separados | Tudo em um form / Forms separados por tipo | Forms separados (melhor UX) |
| Intencoes: wizard vs form | Form unico / Wizard multi-passo | Wizard multi-passo (campos complexos) |
| Bases de conhecimento | API GPTMaker / Local | API GPTMaker (ja tem integracao) |
| Upload de documento | Local / S3 / GPTMaker | GPTMaker (ja tem suporte) |

---

## 7. Prioridade de Implementacao

### Fase 1: Correcoes (imediato)
- [ ] Corrigir wizard para mostrar campos quando nao tem padrao
- [ ] Corrigir treinamentos e intencoes no wizard

### Fase 2: Perfil e Trabalho (1-2 dias)
- [ ] Reestruturar passo 1: Perfil (nome, comunicacao, comportamento)
- [ ] Reestruturar passo 2: Trabalho (finalidade, produto, site, descricao)

### Fase 3: Treinamentos (2-3 dias)
- [ ] Implementar seletor de tipo de treinamento
- [ ] Implementar editor de texto (afirmacoes)
- [ ] Implementar editor de website (URL, intervalo, sub-paginas)
- [ ] Implementar editor de video (URL)
- [ ] Implementar editor de documento (upload)
- [ ] Implementar conexao com bases de conhecimento

### Fase 4: Intencoes (3-4 dias)
- [ ] Implementar wizard de 3 etapas
- [ ] Implementar coleta de dados do cliente
- [ ] Implementar configuracao de acao (webhook, headers, params, body)
- [ ] Implementar dados de saida (variaveis, resposta)

### Fase 5: Variaveis nos textos (1-2 dias)
- [ ] Implementar servico de substituicao de variaveis
- [ ] Implementar preview em tempo real
- [ ] Implementar indicacao de variaveis nao preenchidas

### Fase 6: SUPER_ADMIN (1 dia)
- [ ] Atualizar tela de padroes do SUPER_ADMIN
- [ ] Adicionar todos os campos novos
- [ ] Implementar pre-visualizacao

---

## 8. Notas Importantes

1. **Todos os campos devem ser opcionais** - O franqueado pode pular qualquer secao
2. **Padrao do SUPER_ADMIN e sugestao** - O franqueado pode aceitar, editar ou ignorar
3. **Variaveis sao futuras** - Primeiro implementar campos fixos, depois adicionar variaveis
4. **Integracao GPTMaker** - Todos os treinamentos e intencoes devem ser enviados para GPTMaker
5. **Persistencia local** - Alem de enviar para GPTMaker, salvar localmente para edicao
