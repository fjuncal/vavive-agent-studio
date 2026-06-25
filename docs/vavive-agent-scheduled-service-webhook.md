# Webhook de agendamento do Vavive Agent

Nome sugerido da intenção:
`Quando o cliente quiser agendar um serviço`

Campos sugeridos:
- `Nomecompleto`
- `CPFouCNPJ`
- `Endereco`
- `PontoDeReferencia`
- `Email`
- `Dataehorasdoservico`
- `Plano`
- `Tipodeservico`
- `Duracaodoatendimento`
- `Telefone`
- `CEP`
- `franchiseId` ou `agentExternalId`

URL do webhook:

```http
POST {API_BASE_URL}/api/webhooks/vavive-agent/scheduled-service
```

Header opcional:

```http
X-Vavive-Webhook-Secret: {segredo-configurado}
```

Exemplo de payload:

```json
{
  "Nomecompleto": "Maria Silva",
  "CPFouCNPJ": "12345678900",
  "Endereco": "Rua Exemplo, 100",
  "PontoDeReferencia": "Próximo ao mercado",
  "Email": "maria@email.com",
  "Dataehorasdoservico": "2026-06-24 14:00",
  "Plano": "Premium",
  "Tipodeservico": "Manutenção",
  "Duracaodoatendimento": "2h",
  "Telefone": "5511999991234",
  "CEP": "04000-000",
  "franchiseId": "00000000-0000-0000-0000-000000000000"
}
```

Exemplo de resposta:

```json
{
  "success": true,
  "message": "Perfeito! Seu pedido de agendamento foi registrado. A equipe da Vavive vai acompanhar e confirmar os detalhes em breve.",
  "scheduledRequestId": "11111111-1111-1111-1111-111111111111",
  "notifications": {
    "total": 3,
    "sent": 0,
    "failed": 0,
    "dryRun": 3,
    "provider": "dry-run"
  }
}
```

Observações:
- O payload aceita aliases de campos. O backend tenta resolver nomes alternativos automaticamente.
- Se a franquia não for identificada, o agendamento ainda é registrado, mas nenhuma notificação é disparada.
- Se `VAVIVE_WEBHOOKS_AGENT_SECRET` não estiver configurado, o webhook é aceito e o backend registra warning em log.
- Em telas e textos de franquia, a UI deve usar `Vavive Agent` ou `Vavive Agent Studio`, nunca `GPTMaker`.
