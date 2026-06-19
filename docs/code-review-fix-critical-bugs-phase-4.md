# Code Review - fix-critical-bugs-phase-4

## Findings

1. **High** - `STANDARD` de personalidade ainda pode reprovisionar valores customizados antigos
   - Arquivo: `apps/admin-web/app/franquias/[id]/agente/configuracao/page.tsx`
   - Linhas: 151-163, 165-189, 282-299
   - Problema: `refreshBlockMode("BEHAVIOR", ...)` troca apenas o modo do bloco no backend, mas `handleSaveProfile()` continua enviando `communicationType`, `selectedAvatar` e outros estados locais do componente. Esses estados nao sao reidratados a partir do bloco padrao quando o usuario volta para `STANDARD`. Na pratica, a UI mostra “usando padrao da matriz”, mas um clique em `Salvar perfil` pode reprovisionar o agente com valores customizados antigos.
   - Impacto: divergencia entre o estado exibido para a franquia e o estado real provisionado no agente.
   - Correcao sugerida: ao voltar para `STANDARD`, recarregar os campos locais a partir da configuracao resolvida; ou bloquear `Salvar perfil` enquanto o bloco estiver em `STANDARD`; ou fazer o backend ignorar overrides locais quando o bloco `BEHAVIOR` estiver em modo padrao.

2. **Medium** - fix de `behavior` troca contexto rico por `jobDescription` curto
   - Arquivo: `apps/api/src/main/java/br/com/vavive/gptmaker/service/FranchiseService.java`
   - Linhas: 441-457, 825-829
   - Problema: `resolveBehavior()` prioriza `request.jobDescription()` sempre que ele vier preenchido. Isso faz o campo `behavior` deixar de usar o contexto completo montado por `vaviveDefaultContextService.buildForFranchise(franchise)` e passar a usar apenas a descricao curta enviada pela UI.
   - Impacto: o bug 502 some, mas a qualidade do provisionamento pode cair bastante porque o prompt principal do agente perde contexto operacional da franquia.
   - Correcao sugerida: manter `behavior` baseado no contexto completo e, se existir `jobDescription`, anexar ou complementar esse contexto em vez de substitui-lo.

3. **Medium** - default local saiu de mock e passou a depender de integracao real
   - Arquivo: `apps/api/src/main/resources/application.yml`
   - Linhas: 32-35
   - Problema: `gptmaker.mock-enabled` mudou de `true` para `false` por default. Em ambientes locais sem `GPTMAKER_API_TOKEN`, a aplicacao agora tenta usar a API real por padrao.
   - Impacto: regressao de ambiente para desenvolvimento/manual QA; varias telas podem falhar mesmo com backend subindo normalmente.
   - Correcao sugerida: manter mock habilitado por default em dev, ou condicionar `mock-enabled` ao profile local, ou documentar/env-setar isso explicitamente antes de considerar a mudanca segura.

## Open Questions

- `Salvar perfil` deveria respeitar o bloco `BEHAVIOR` como fonte de verdade, ou essa tela ainda deve reprovisionar dados independentes da configuracao por blocos?
- O `jobDescription` da UI e realmente o melhor fallback semantico para `behavior`, ou a API deveria receber ambos com papeis diferentes?

## Summary

- review focado nas alteracoes de `Toast.tsx`, `configuracao/page.tsx`, `FranchiseService.java` e `application.yml`
- 3 issues encontradas: 1 high, 2 medium
