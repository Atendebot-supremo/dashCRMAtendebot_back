# 📋 Resumo Rápido - Configuração CRM

## ⚡ Valores Exatos Obrigatórios

### 1️⃣ Fases de Etapas (stepPhase)

| Status | Valor Exato | Alternativa (stepTitle) |
|--------|-------------|-------------------------|
| ✅ **Fechado** | `closed` | deve conter "fechado" ou "ganho" |
| ❌ **Perdido** | `lost` | deve conter "perdido" ou "perda" |

---

### 2️⃣ Campos Personalizados (customFields)

| Campo | Obrigatório | Exemplo |
|-------|-------------|---------|
| `productId` | Não | `"plano-empresarial"` |
| `product` | Não | `"plano-empresarial"` (fallback) |
| `productName` | Não | `"Plano Empresarial"` |
| `lostReason` | Não | `"Preço alto"` |

---

### 3️⃣ Metadados (metadata)

| Campo | Valores Aceitos | Exemplo |
|-------|-----------------|---------|
| `channelId` | `whatsapp`, `meta`, `google`, `instagram`, `telegram`, `website`, `email` | `"whatsapp"` |
| `lostReason` | Qualquer string | `"Preço alto"` |

---

## ✅ Checklist Rápido

```
[ ] stepPhase = "closed" na etapa de fechamento
[ ] stepPhase = "lost" na etapa de perda
[ ] metadata.channelId configurado (se necessário)
[ ] customFields.productId configurado (se necessário)
[ ] metadata.lostReason ou customFields.lostReason (se necessário)
```

---

## 📖 Documentação Completa

Para detalhes completos, consulte: **`CONFIGURACAO_CRM_REQUERIDA.md`**


