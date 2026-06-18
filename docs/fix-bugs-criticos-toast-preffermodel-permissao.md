# Fix Bugs Críticos — Toast Loop, prefferModel, Permissão

Data: 2026-06-18
Prioridade: CRÍTICA — aplicação quebrada

---

## 1. 🔴 Toast Infinite Loop — CAUSA RAIZ ENCONTRADA

**Arquivo:** `components/Toast.tsx:65-70`
**Erro:** `Maximum update depth exceeded` em `addToast`

**Causa:** `ToastProvider` cria objeto `value` novo em CADA render:
```tsx
// TOAST.TSX - LINHA 65-70 (PROBLEMA)
const value: ToastContextValue = {
  toast: addToast,
  success: (message: string) => addToast("success", message),
  error: (message: string) => addToast("error", message),
  info: (message: string) => addToast("info", message)
};
```

Mesmo que `addToast` seja estável (useCallback), o objeto `value` é recriado a cada render. Quando uma página usa `showError` em useEffect dependency array:

```tsx
// configuracao/page.tsx - LINHA 141 (CAUSA O LOOP)
}, [params?.id, showError]);
```

1. useEffect roda → chama `showError`
2. `showError` chama `addToast` → setState → re-render
3. Re-render cria NOVO objeto `value` → NOVA referência de `showError`
4. useEffect vê dependência mudou → roda de novo
5. INFINITE LOOP

**FIX — ToastProvider precisa de useMemo no value:**
```tsx
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    if (type !== "error") {
      setTimeout(() => removeToast(id), 5000);
    }
  }, [removeToast]);

  // FIX: Memoizar o value para não recriar referência a cada render
  const value = useMemo<ToastContextValue>(() => ({
    toast: addToast,
    success: (message: string) => addToast("success", message),
    error: (message: string) => addToast("error", message),
    info: (message: string) => addToast("info", message)
  }), [addToast]);

  // ... resto do componente
}
```

**ALÉM DISSO:** Error toasts nunca fecham (linha 60: `if (type !== "error")`). Errors devem ter auto-close também, ou ter botão de fechar que funciona.

**FIX — Error toasts devem fechar após 8 segundos:**
```tsx
const addToast = useCallback((type: ToastType, message: string) => {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, type, message }]);
  const duration = type === "error" ? 8000 : 5000;
  setTimeout(() => removeToast(id), duration);
}, [removeToast]);
```

---

## 2. 🔴 prefferModel — Campo e valores errados no frontend

**Arquivo:** `configuracoes/textos-padrao/page.tsx` (editor AGENT_SETTINGS)
**Erro:** `Campo 'prefferModel' e obrigatorio`

**Causa:** Frontend usa `updateField("model", v)` mas backend espera `"prefferModel"`. Valores também não batem.

**Contrato da API GPTMaker (agent settings):**
```json
{
  "prefferModel": "GPT_4_O",       // ← campo correto (typo do backend)
  "timezone": "America/Sao_Paulo",
  "enabledHumanTransfer": true,
  "enabledReminder": true,
  "splitMessages": false,
  "enabledEmoji": true,
  "limitSubjects": false,
  "signMessages": true,
  "messageGroupingTime": 5
}
```

**Valores aceitos para prefferModel (do GPTMaker):**
- `GPT_4_O`
- `GPT_4_O_MINI`
- `GPT_5`
- `CLAUDE_4_5_SONNET`
- `CLAUDE_3_5_SONNET`

**FIX — Editor AGENT_SETTINGS completo:**
```tsx
case "AGENT_SETTINGS":
  return (
    <div className="space-y-4">
      <SelectField
        label="Modelo"
        value={String(draft.prefferModel || "GPT_4_O")}
        onChange={(v) => updateField("prefferModel", v)}
        options={[
          { value: "GPT_4_O", label: "GPT-4o" },
          { value: "GPT_4_O_MINI", label: "GPT-4o Mini" },
          { value: "GPT_5", label: "GPT-5" },
          { value: "CLAUDE_4_5_SONNET", label: "Claude 4.5 Sonnet" },
          { value: "CLAUDE_3_5_SONNET", label: "Claude 3.5 Sonnet" }
        ]}
      />
      <SelectField
        label="Fuso horário"
        value={String(draft.timezone || "America/Sao_Paulo")}
        onChange={(v) => updateField("timezone", v)}
        options={[
          { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
          { value: "America/Manaus", label: "Manaus (AMT)" },
          { value: "America/Belem", label: "Belém (BRT)" },
          { value: "America/Fortaleza", label: "Fortaleza (BRT)" }
        ]}
      />
      <ToggleField label="Transferir para humano" description="Permitir transferência automática para atendente humano" checked={!!draft.enabledHumanTransfer} onChange={(v) => updateField("enabledHumanTransfer", v)} />
      <ToggleField label="Lembrete de retorno" description="Enviar lembrete quando cliente inativo" checked={!!draft.enabledReminder} onChange={(v) => updateField("enabledReminder", v)} />
      <ToggleField label="Separar mensagens longas" description="Dividir mensagens longas em partes" checked={!!draft.splitMessages} onChange={(v) => updateField("splitMessages", v)} />
      <ToggleField label="Usar emojis" description="Permitir uso de emojis nas respostas" checked={!!draft.enabledEmoji} onChange={(v) => updateField("enabledEmoji", v)} />
      <ToggleField label="Limitar assuntos" description="Responder apenas sobre escopo definido" checked={!!draft.limitSubjects} onChange={(v) => updateField("limitSubjects", v)} />
      <ToggleField label="Assinar mensagens" description="Adicionar nome do assistente no final" checked={!!draft.signMessages} onChange={(v) => updateField("signMessages", v)} />
      <Field label="Tempo de agrupamento (min)" type="number" value={String(draft.messageGroupingTime ?? 5)} onChange={(v) => updateField("messageGroupingTime", Number(v))} />
    </div>
  );
```

---

## 3. 🔴 Permissão — ADMIN_FRANQUIA não pode criar agente

**Arquivo:** `FranchiseService.java:431`, `AssistantStandardProfileService.java:82-83`
**Erro:** `Apenas SUPER_ADMIN pode acessar esta configuracao GPTMaker`

**Causa 1:** `provisionGptMakerAgent()` em `FranchiseService.java` chama `requireSuperAdmin()`.

**Causa 2:** `getFranchiseConfiguration()` em `AssistantStandardProfileService.java` chama `getActiveProfile()` que chama `requireSuperAdmin()`.

**FIX 1 — FranchiseService.java:**
```java
// LINHA 431 — REMOVER esta linha:
currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode provisionar agente GPTMaker.");

// Já tem requireAccessibleFranchise() que valida acesso
```

**FIX 2 — AssistantStandardProfileService.java:**
```java
// LINHA 82-83 — getActiveProfile() chama requireSuperAdmin
// getFranchiseConfiguration() chama getActiveProfile() indiretamente via ensureActiveProfile()

// FIX: getFranchiseConfiguration() NÃO deve chamar getActiveProfile()
// Deve chamar ensureActiveProfile() diretamente (sem auth check)
public FranchiseAssistantConfigurationResponse getFranchiseConfiguration(UUID franchiseId) {
    Franchise franchise = requireAccessibleFranchise(franchiseId);
    AssistantStandardProfile profile = ensureActiveProfile(); // SEM requireSuperAdmin
    // ... resto
}
```

---

## 4. 🔴 502 ao criar agente — GPTMaker API error

**Erro:** `Nao foi possivel criar o agente no GPTMaker`

**Causa:** O backend tenta criar agente no GPTMaker mas a API retorna erro. Pode ser:
1. Token inválido ou expirado
2. Workspace ID incorreto
3. Payload com campos obrigatórios faltando
4. Limite de agentes atingido

**Verificar:**
1. `GPTMAKER_API_TOKEN` configurado corretamente no `.env`
2. Workspace ID existe no GPTMaker
3. Payload enviado corresponde ao contrato da API

**Contrato da API GPTMaker para criar agente:**
```
POST /v2/workspace/{workspaceId}/agents
Body:
{
  "name": "string",
  "behavior": "string",        // ← OBRIGATÓRIO
  "communicationType": "FORMAL" | "NORMAL" | "RELAXED",
  "type": "SALE" | "SUPPORT" | "PERSONAL",
  "jobName": "string",
  "jobSite": "string",
  "jobDescription": "string"
}
```

**Possível fix:** Verificar se `behavior` está sendo enviado. O wizard pode estar enviando payload sem `behavior`.

---

## 5. 🟡 Configuração do agente — tudo desabilitado quando STANDARD

**Arquivo:** `configuracao/page.tsx`
**Problema:** Quando bloco está em modo STANDARD, campos devem estar desabilitados até clicar "Customizar".

**Atual:** A página já tem `BlockNotice` com botão "Customizar", mas os campos não estão sendo desabilitados.

**FIX:** Adicionar prop `disabled` em todos os campos quando `useStandardPersonality` é true:
```tsx
<OptionCards
  label="Tom de voz"
  value={communicationType}
  onChange={(v) => setCommunicationType(v as typeof communicationType)}
  options={communicationOptions}
  disabled={useStandardPersonality}  // ← ADICIONAR
/>
```

---

## 6. 🟡 Toast — Error nunca fecha

**Arquivo:** `Toast.tsx:60`
**Problema:** `if (type !== "error")` impede auto-close de errors.

**FIX:** Errors devem fechar após 8 segundos:
```tsx
const addToast = useCallback((type: ToastType, message: string) => {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, type, message }]);
  setTimeout(() => removeToast(id), type === "error" ? 8000 : 5000);
}, [removeToast]);
```

---

## 7. 🟡 IDLE_ACTIONS e TRANSFER_RULES — JSON bruto

**Arquivo:** `configuracoes/textos-padrao/page.tsx`
**Problema:** Esses blocos caem no `default` case do switch.

**FIX:** Adicionar cases:
```tsx
case "IDLE_ACTIONS":
case "TRANSFER_RULES":
  const items = Array.isArray(draft.items) ? draft.items : [];
  return (
    <div className="space-y-4">
      {items.map((item: Record<string, unknown>, i: number) => (
        <div key={i} className="card p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{String(item.name || item.title || `Item ${i+1}`)}</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{String(item.description || "")}</p>
          </div>
          <button type="button" onClick={() => { const next = [...items]; next.splice(i, 1); updateField("items", next); }} className="text-sm text-red-500">Remover</button>
        </div>
      ))}
      <button type="button" onClick={() => updateField("items", [...items, {}])} className="btn-secondary text-sm">+ Adicionar item</button>
    </div>
  );
```

---

## Checklist de Fixes

### CRÍTICO (aplicação quebrada)
- [ ] Fix ToastProvider — useMemo no value object
- [ ] Fix Toast — error auto-close após 8s
- [ ] Fix prefferModel — campo e valores corretos no editor
- [ ] Fix permissão — remover requireSuperAdmin de provisionGptMakerAgent
- [ ] Fix permissão — getFranchiseConfiguration não chamar getActiveProfile

### ALTO (funcionalidade quebrada)
- [ ] Fix 502 — verificar payload do agente (behavior obrigatório)
- [ ] Fix configuração — disabled quando STANDARD
- [ ] Fix IDLE_ACTIONS/TRANSFER_RULES — adicionar cases no switch

### MÉDIO (UX)
- [ ] Fix links de criação de agente
- [ ] Fix QR code — externalChannelId check
- [ ] Integrar Toast em páginas restantes

---

## Contrato da API GPTMaker — Referência

### Criar agente
```
POST /v2/workspace/{workspaceId}/agents
{
  "name": "string",
  "behavior": "string",          // OBRIGATÓRIO
  "communicationType": "FORMAL|NORMAL|RELAXED",
  "type": "SALE|SUPPORT|PERSONAL",
  "jobName": "string",
  "jobSite": "string",
  "jobDescription": "string"
}
```

### Atualizar configurações
```
PUT /v2/agent/{agentId}/settings
{
  "prefferModel": "GPT_4_O",    // OBRIGATÓRIO
  "timezone": "America/Sao_Paulo",
  "enabledHumanTransfer": true,
  "enabledReminder": true,
  "splitMessages": false,
  "enabledEmoji": true,
  "limitSubjects": false,
  "signMessages": true,
  "messageGroupingTime": 5
}
```

### Criar canal
```
POST /v2/workspace/{workspaceId}/create-channel
{
  "name": "string",              // OBRIGATÓRIO
  "type": "WHATSAPP|Z_API|CLOUD_API|..."
}
```

### QR Code
```
GET /v2/channel/{channelId}/qr-code
Response:
{ "value": "base64..." }        // quando desconectado
{ "connected": true }           // quando conectado
```
