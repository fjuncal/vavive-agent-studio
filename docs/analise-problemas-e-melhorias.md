# Análise Completa — Problemas e Melhorias

Data: 2026-06-18
Projeto: Vavive Agent Studio

---

## Resumo de Issues Encontradas

| # | Issue | Severidade | Complexidade |
|---|---|---|---|
| 1 | Saldo zero para SUPER_ADMIN | 🔴 High | Média |
| 2 | Criar agente redireciona pra franquia | 🟡 Medium | Baixa |
| 3 | QR code do WhatsApp não funciona | 🟡 Medium | Média |
| 4 | Erro ao remover canal (JSON parse) | 🔴 High | Baixa |
| 5 | Erro React em canais (Element type) | 🟡 Medium | Baixa |
| 6 | Navegação "sem agente" no wizard | 🟡 Medium | Média |
| 7 | Falta toggle de customização | 🟡 Low | Baixa |
| 8 | Erro de permissão ao criar agente | 🔴 High | Média |
| 9 | JSON em blocos IDLE_ACTIONS/TRANSFER | 🟡 Medium | Baixa |
| 10 | Erro prefferModel obrigatório | 🔴 High | Baixa |
| 11 | Workbench com JSON bruto | 🟡 Medium | Média |
| 12 | Toast/notificações profissionais | 🟡 Medium | Média |
| 13 | Tratamento de erros na tela | 🟡 Medium | Média |

---

## 🔴 Issues Críticas

### 1. Saldo zero para SUPER_ADMIN na lista de franquias

**Arquivo:** `WorkspaceCreditsService.java:31-36`
**Causa:** `forFranchises()` usa `preferCache=true` para evitar N+1 chamadas. Na primeira carga sem cache, se a chamada ao GPTMaker falha, retorna `UNAVAILABLE` com zeros. Mas `forFranchise()` (individual, usado pelo ADMIN_FRANQUIA) usa `preferCache=false` e faz a chamada real.

**Fix:**
```java
// WorkspaceCreditsService.java - forFranchises()
// Quando cache está vazio, fazer chamada real mesmo com preferCache=true
private WorkspaceCredits resolveCredits(Franchise franchise, boolean preferCache) {
    if (franchise.getWorkspaceId() == null || franchise.getWorkspaceId().isBlank()) {
        return noWorkspace(franchise.getId());
    }
    // Se preferCache e cache existe, usar cache
    // Se preferCache mas cache vazio, fazer chamada real
    return fetchFromApi(franchise); // sempre tentar API
}
```

---

### 4. Erro ao remover canal — "Unexpected end of JSON input"

**Arquivo:** `FranchiseController.java:180-183`, `api.ts:530-534`
**Causa:** Backend retorna `void` (200 OK com body vazio). Frontend `apiFetch` tenta fazer `response.json()` em resposta 200 com body vazio.

**Fix (backend):**
```java
@DeleteMapping("/franchises/{id}/channels/{channelId}")
@ResponseStatus(HttpStatus.NO_CONTENT)  // ← Adicionar isso
public void deleteChannel(@PathVariable UUID id, @PathVariable UUID channelId) {
    channelService.deleteChannel(id, channelId);
}
```

**Fix (frontend) — fallback seguro:**
```ts
// api.ts - apiFetch
if (response.status === 204 || response.headers.get("content-length") === "0") {
  return undefined as T;
}
try {
  return await response.json() as T;
} catch {
  return undefined as T;
}
```

---

### 8. Erro de permissão ao criar agente — "Only SUPER_ADMIN"

**Arquivo:** `AssistantStandardProfileService.java:82-83`, `FranchiseService.java:431`
**Causa:** `getFranchiseConfiguration()` chama `ensureActiveProfile()` que chama `getActiveProfile()` que chama `requireSuperAdmin()`. Mas ADMIN_FRANQUIA precisa acessar a configuração da própria franquia.

**Duas causas:**
1. `getFranchiseConfiguration()` não deveria exigir SUPER_ADMIN
2. `provisionGptMakerAgent()` em `FranchiseService` também exige SUPER_ADMIN

**Fix 1 — getFranchiseConfiguration:**
```java
// AssistantStandardProfileService.java
// getFranchiseConfiguration() NÃO deve chamar getActiveProfile()
// Deve chamar ensureActiveProfile() diretamente (sem auth check)
public FranchiseAssistantConfigurationResponse getFranchiseConfiguration(UUID franchiseId) {
    Franchise franchise = requireAccessibleFranchise(franchiseId);
    // NÃO chamar getActiveProfile() aqui — chamar ensureActiveProfile()
    AssistantStandardProfile profile = ensureActiveProfile(); // sem requireSuperAdmin
    // ... resto do método
}
```

**Fix 2 — provisionGptMakerAgent:**
```java
// FranchiseService.java:431
// Remover requireSuperAdmin() — ADMIN_FRANQUIA pode criar agente da própria franquia
public FranchiseGptMakerConnectionResponse provisionGptMakerAgent(UUID franchiseId, ...) {
    Franchise franchise = requireAccessibleFranchise(franchiseId); // já valida acesso
    // NÃO chamar requireSuperAdmin()
    // ... resto do método
}
```

---

### 10. Erro "prefferModel obrigatório"

**Arquivo:** `configuracoes/textos-padrao/page.tsx:149`, `AssistantStandardProfileService.java:537-538`
**Causa:** Frontend escreve `updateField("model", v)` mas backend espera `"prefferModel"`. Além disso, valores do frontend (`"gpt-4o"`) não batem com valores do backend (`"GPT_4_O"`).

**Fix (frontend):**
```tsx
// configuracoes/textos-padrao/page.tsx - AGENT_SETTINGS case
<SelectField
  label="Modelo"
  value={String(payload.prefferModel || "GPT_4_O")}  // ← campo correto
  onChange={(v) => updateField("prefferModel", v)}    // ← campo correto
  options={[
    { value: "GPT_4_O", label: "GPT-4o" },
    { value: "GPT_4_O_MINI", label: "GPT-4o Mini" },
    { value: "GPT_5", label: "GPT-5" },
    { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" }
  ]}
/>
```

**Campos obrigatórios que faltam no editor AGENT_SETTINGS:**
- `prefferModel` (string)
- `timezone` (string)
- `enabledHumanTransfer` (boolean)
- `enabledReminder` (boolean)
- `splitMessages` (boolean)
- `enabledEmoji` (boolean)
- `limitSubjects` (boolean)
- `signMessages` (boolean)
- `messageGroupingTime` (number)

---

## 🟡 Issues Médias

### 2. Criar agente redireciona pra página da franquia

**Arquivo:** `agentes/page.tsx:58-63`
**Causa:** Link "Criar agente" na lista de agentes vai pra `/franquias/${franchise.id}` quando não tem agente, em vez de `/franquias/${franchise.id}/agente/novo`.

**Fix:**
```tsx
// agentes/page.tsx
<Link
  href={franchise.agentId
    ? `/franquias/${franchise.id}/agente/configuracao`
    : `/franquias/${franchise.id}/agente/novo`
  }
>
  {franchise.agentId ? "Abrir agente" : "Criar agente"}
</Link>
```

---

### 3. QR code do WhatsApp não funciona

**Arquivo:** `canais/page.tsx:122-125`, `ChannelService.java:82-86`
**Causa:** `qrChannel.id` é o UUID do snapshot local. Backend precisa do `externalChannelId` do GPTMaker. Se canal foi criado localmente (não syncado), `externalChannelId` é null.

**Fix:**
1. Verificar que canal foi syncado antes de mostrar botão "Conectar"
2. Mostrar erro específico se `externalChannelId` for null
3. Adicionar log detalhado no backend

```tsx
// canais/page.tsx — só mostrar "Conectar" se tiver externalChannelId
onConnect={channel.externalChannelId ? () => setQrChannel(channel) : undefined}
```

---

### 5. Erro React em canais — "Element type is invalid"

**Arquivo:** `canais/page.tsx:4-9`
**Causa:** Provavelmente import incorreto de componente. Verificar se `OptionCards` está sendo importado como named export mas exportado como default, ou vice-versa.

**Fix:** Verificar exports de todos os componentes importados:
```tsx
import { ChannelCard, type ChannelType } from "@/components/ChannelCard"; // OK
import { QRCodeModal } from "@/components/QRCodeModal"; // OK
import { ConfirmDialog } from "@/components/ConfirmDialog"; // OK
import { OptionCards, Field } from "@/components/FriendlyForm"; // Verificar
```

Se `FriendlyForm.tsx` não exporta `OptionCards` como named export, corrigir.

---

### 6. Navegação "sem agente" no wizard

**Arquivo:** `agente/novo/page.tsx`
**Causa:** Quando usuário está no wizard de criação e clica em links de sub-páginas (intenções, configurações), vai pra páginas que verificam se agente existe.

**Fix:** No wizard, links de intenções/trainings devem ser apenas âncoras internas (scroll), não navegação de rota. Ou desabilitar links durante criação.

---

### 9. JSON em blocos IDLE_ACTIONS e TRANSFER_RULES

**Arquivo:** `configuracoes/textos-padrao/page.tsx:171-188`
**Causa:** `FriendlyBlockEditor.renderForm()` não tem cases para `IDLE_ACTIONS` e `TRANSFER_RULES` — caem no `default` que mostra JSON bruto.

**Fix:** Adicionar cases:
```tsx
case "IDLE_ACTIONS":
case "TRANSFER_RULES":
  const items = Array.isArray(draft.items) ? draft.items : [];
  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div key={i} className="card p-4 flex justify-between">
          <div>
            <p className="font-medium">{item.name || item.title || `Item ${i+1}`}</p>
            <p className="text-sm text-secondary">{item.description || ""}</p>
          </div>
          <button onClick={() => {
            const next = [...items]; next.splice(i, 1);
            updateField("items", next);
          }}>Remover</button>
        </div>
      ))}
      <button onClick={() => updateField("items", [...items, {}])}>
        + Adicionar item
      </button>
    </div>
  );
```

---

### 11. Workbench com JSON bruto

**Arquivo:** `setup-guiado/page.tsx:91-96`
**Causa:** Página usa `<textarea>` com `JSON.stringify()` — é o design original do workbench.

**Fix:** Reutilizar `FriendlyBlockEditor` do `configuracoes/textos-padrao/page.tsx`. Extrair para componente compartilhado `components/BlockEditor.tsx`.

---

### 12. Toast/notificações profissionais

**Arquivo:** todas as páginas que usam `error`/`success` state
**Causa:** Mensagens de erro/sucesso são renderizadas como `<p>` inline. Não são toasts — desaparecem ao navegar.

**Fix:** Usar componente `Toast.tsx` existente (já existe no projeto!). Integrar:
```tsx
import { useToast } from "@/components/Toast";

const { showToast } = useToast();

// Em vez de setError/setSuccess:
showToast("Canal criado com sucesso!", "success");
showToast("Erro ao remover canal", "error");
```

---

### 13. Tratamento de erros na tela

**Fix geral:** Em todas as páginas, trocar:
```tsx
// DE:
{error && <p className="rounded-2xl bg-rose-50...">{error}</p>}
// PARA:
useEffect(() => { if (error) showToast(error, "error"); }, [error]);
```

---

## 📋 Checklist de Implementações

### Prioridade 1 — Corrigir bugs críticos
- [ ] Fix `apiFetch` para respostas vazias (200/204 sem body)
- [ ] Fix `@ResponseStatus(NO_CONTENT)` em endpoints void
- [ ] Fix permissão `getFranchiseConfiguration` — remover `requireSuperAdmin`
- [ ] Fix permissão `provisionGptMakerAgent` — permitir ADMIN_FRANQUIA
- [ ] Fix campo `prefferModel` no editor de AGENT_SETTINGS
- [ ] Fix `WorkspaceCreditsService` — batch loading com fallback real

### Prioridade 2 — Corrigir UX
- [ ] Fix links de criação de agente (ir pra `/agente/novo`)
- [ ] Fix QR code — verificar `externalChannelId` antes de conectar
- [ ] Fix imports em `canais/page.tsx`
- [ ] Adicionar cases `IDLE_ACTIONS`/`TRANSFER_RULES` no FriendlyBlockEditor
- [ ] Integrar Toast notifications em todas as páginas

### Prioridade 3 — Melhorias
- [ ] Extrair `FriendlyBlockEditor` como componente compartilhado
- [ ] Substituir JSON no workbench por FriendlyBlockEditor
- [ ] Adicionar toggle de customização em todas as tabs de configuração
- [ ] Melhorar navegação do wizard (desabilitar links externos)
- [ ] Adicionar loading states mais profissionais

---

## Arquivos que precisam de alteração

### Backend (Java)
| Arquivo | Alteração |
|---|---|
| `FranchiseController.java` | `@ResponseStatus(NO_CONTENT)` em delete/edit |
| `FranchiseService.java` | Remover `requireSuperAdmin` de `provisionGptMakerAgent` |
| `AssistantStandardProfileService.java` | Fix `getFranchiseConfiguration` auth |
| `WorkspaceCreditsService.java` | Fix batch loading |

### Frontend (TypeScript)
| Arquivo | Alteração |
|---|---|
| `lib/api.ts` | Handle empty responses em `apiFetch` |
| `app/agentes/page.tsx` | Fix links de criação |
| `app/canais/page.tsx` | Fix imports, QR code guard |
| `app/configuracoes/textos-padrao/page.tsx` | Fix AGENT_SETTINGS, add IDLE_ACTIONS/TRANSFER_RULES |
| `app/franquias/[id]/agente/configuracao/page.tsx` | Toggle customização |
| `app/setup-guiado/page.tsx` | Usar FriendlyBlockEditor |
| `components/Toast.tsx` | Integrar em todas as páginas |
