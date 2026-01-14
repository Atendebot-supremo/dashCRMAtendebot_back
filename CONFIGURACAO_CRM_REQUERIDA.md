# 📋 Configuração Requerida do CRM - Guia para o Time

Este documento lista **TODOS os valores exatos** que precisam ser configurados no CRM (Helena/flw.chat) para que o dashboard funcione corretamente.

⚠️ **IMPORTANTE**: Os valores listados aqui são **case-sensitive** (sensíveis a maiúsculas/minúsculas) e devem ser configurados **EXATAMENTE** como especificado.

---

## 🎯 1. Fases de Etapas (stepPhase)

O sistema identifica cards como "fechados" ou "perdidos" baseado no campo `stepPhase` da etapa.

### ✅ Cards Fechados (Closed)

Para que um card seja identificado como **fechado**, a fase da etapa deve ser:

| Valor Exato | Onde é usado |
|-------------|--------------|
| `closed` | Identificação de negócios fechados |
| `fechado` | (alternativa via stepTitle) |
| `ganho` | (alternativa via stepTitle) |

**Código de referência:**
```typescript
// src/features/metrics/metricsService.ts:56-60
private isCardClosed(card: Card): boolean {
  const phase = card.stepPhase?.toLowerCase()
  const title = card.stepTitle?.toLowerCase() || ''
  return phase === 'closed' || title.includes('fechado') || title.includes('ganho')
}
```

### ❌ Cards Perdidos (Lost)

Para que um card seja identificado como **perdido**, a fase da etapa deve ser:

| Valor Exato | Onde é usado |
|-------------|--------------|
| `lost` | Identificação de negócios perdidos |
| `perdido` | (alternativa via stepTitle) |
| `perda` | (alternativa via stepTitle) |

**Código de referência:**
```typescript
// src/features/metrics/metricsService.ts:62-66
private isCardLost(card: Card): boolean {
  const phase = card.stepPhase?.toLowerCase()
  const title = card.stepTitle?.toLowerCase() || ''
  return phase === 'lost' || title.includes('perdido') || title.includes('perda')
}
```

### 📝 Recomendações de Configuração

**Opção 1 (Recomendada):** Usar `stepPhase` com valores exatos:
- Etapa de fechamento: `stepPhase = "closed"`
- Etapa de perda: `stepPhase = "lost"`

**Opção 2:** Se não for possível usar `stepPhase`, o sistema também verifica o `stepTitle`:
- Etapa de fechamento: título deve conter "fechado" ou "ganho"
- Etapa de perda: título deve conter "perdido" ou "perda"

---

## 📦 2. Campos Personalizados (customFields)

O sistema busca informações específicas nos campos personalizados dos cards. Os nomes dos campos devem ser **exatamente** como listado abaixo.

### 🛍️ Produtos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `productId` | string | Não | ID do produto (prioridade 1) |
| `product` | string | Não | ID ou nome do produto (prioridade 2) |
| `productName` | string | Não | Nome do produto (prioridade 1) |

**Ordem de busca:**
1. `customFields.productId`
2. `customFields.product`
3. `card.title` (fallback)

**Código de referência:**
```typescript
// src/features/metrics/metricsService.ts:476-484
const productId =
  (card.customFields?.productId as string) ||
  (card.customFields?.product as string) ||
  card.title ||
  'unknown'

const productName =
  (firstCard?.customFields?.productName as string) ||
  (firstCard?.customFields?.product as string) ||
  firstCard?.title ||
  productId
```

### 📉 Motivo de Perda

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lostReason` | string | Não | Motivo da perda do negócio |

**Ordem de busca:**
1. `metadata.lostReason` (prioridade 1)
2. `customFields.lostReason` (prioridade 2)
3. `'Não informado'` (fallback)

**Código de referência:**
```typescript
// src/features/metrics/metricsService.ts:263-268
const reasonMap = groupBy(
  lostCards,
  (card) =>
    (card.metadata?.lostReason as string) ||
    (card.customFields?.lostReason as string) ||
    'Não informado'
)
```

---

## 📊 3. Metadados (metadata)

O sistema busca informações nos metadados dos cards. Os nomes dos campos devem ser **exatamente** como listado abaixo.

### 📞 Canal de Origem

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `channelId` | string | Não | ID do canal de origem do lead |

**Valores esperados para `channelId`:**

| channelId | Nome Exibido | Descrição |
|-----------|--------------|-----------|
| `whatsapp` | WhatsApp | Leads do WhatsApp |
| `meta` | Meta | Leads do Facebook/Instagram |
| `google` | Google Ads | Leads do Google Ads |
| `instagram` | Instagram | Leads do Instagram |
| `telegram` | Telegram | Leads do Telegram |
| `website` | Website | Leads do site |
| `email` | E-mail | Leads por e-mail |

**Código de referência:**
```typescript
// src/features/metrics/metricsService.ts:173-200
const channelMap = groupBy(
  closedCards,
  (card) => (card.metadata?.channelId as string) || 'unknown'
)

const channelNames: Record<string, string> = {
  whatsapp: 'WhatsApp',
  meta: 'Meta',
  google: 'Google Ads',
  instagram: 'Instagram',
  telegram: 'Telegram',
  website: 'Website',
  email: 'E-mail'
}
```

### 📉 Motivo de Perda (via metadata)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lostReason` | string | Não | Motivo da perda (prioridade sobre customFields) |

---

## 🏷️ 4. Nomes de Etapas (stepTitle)

Embora o sistema seja flexível com nomes de etapas, existem palavras-chave que são verificadas:

### ✅ Para Cards Fechados

O sistema verifica se o `stepTitle` contém (case-insensitive):
- `"fechado"`
- `"ganho"`

### ❌ Para Cards Perdidos

O sistema verifica se o `stepTitle` contém (case-insensitive):
- `"perdido"`
- `"perda"`

**Nota:** Se o `stepPhase` estiver configurado corretamente (`closed` ou `lost`), o `stepTitle` não precisa conter essas palavras.

---

## 📋 5. Campos Padrão do Card

Estes campos são padrão da API Helena e não precisam de configuração especial, mas são importantes para o funcionamento:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `monetaryAmount` | number | Não | Valor monetário do card (usado em receita) |
| `responsibleUserId` | string | Não | ID do vendedor responsável |
| `createdAt` | string (ISO) | Não | Data de criação (usado em análises temporais) |
| `updatedAt` | string (ISO) | Não | Data de atualização (usado em cálculos de ciclo) |
| `stepId` | string | Não | ID da etapa (usado para agrupamento) |
| `stepTitle` | string | Não | Título da etapa (usado para exibição) |
| `stepPhase` | string | Não | Fase da etapa (usado para identificar fechados/perdidos) |

---

## ✅ 6. Checklist de Configuração por Cliente

Use este checklist ao configurar o CRM de cada cliente:

### Fases de Etapas
- [ ] Etapa de fechamento configurada com `stepPhase = "closed"` OU `stepTitle` contém "fechado" ou "ganho"
- [ ] Etapa de perda configurada com `stepPhase = "lost"` OU `stepTitle` contém "perdido" ou "perda"

### Campos Personalizados (se necessário)
- [ ] Campo `productId` ou `product` configurado (para análise de produtos)
- [ ] Campo `productName` configurado (para exibição do nome do produto)
- [ ] Campo `lostReason` configurado (para análise de perdas)

### Metadados (se necessário)
- [ ] Campo `channelId` configurado nos cards com valores: `whatsapp`, `meta`, `google`, `instagram`, `telegram`, `website`, `email`
- [ ] Campo `lostReason` configurado nos metadados (alternativa ao customFields)

### Campos Padrão
- [ ] Campo `monetaryAmount` preenchido nos cards (para cálculos de receita)
- [ ] Campo `responsibleUserId` preenchido nos cards (para análise por vendedor)
- [ ] Datas `createdAt` e `updatedAt` preenchidas (para análises temporais)

---

## 🔍 7. Exemplos de Configuração

### Exemplo 1: Etapa de Fechamento

**Configuração no CRM:**
```json
{
  "id": "step-fechado-123",
  "title": "Negócio Fechado",
  "phase": "closed"
}
```

✅ **Funciona porque:** `stepPhase = "closed"`

---

### Exemplo 2: Etapa de Perda

**Configuração no CRM:**
```json
{
  "id": "step-perdido-456",
  "title": "Negócio Perdido",
  "phase": "lost"
}
```

✅ **Funciona porque:** `stepPhase = "lost"`

---

### Exemplo 3: Card com Produto

**Configuração no Card:**
```json
{
  "id": "card-789",
  "title": "Lead João Silva",
  "customFields": {
    "productId": "plano-empresarial",
    "productName": "Plano Empresarial"
  },
  "metadata": {
    "channelId": "whatsapp"
  }
}
```

✅ **Funciona porque:** 
- `productId` e `productName` configurados
- `channelId` configurado com valor esperado

---

### Exemplo 4: Card com Motivo de Perda

**Configuração no Card:**
```json
{
  "id": "card-999",
  "title": "Lead Perdido",
  "stepPhase": "lost",
  "metadata": {
    "lostReason": "Preço alto"
  }
}
```

✅ **Funciona porque:**
- `stepPhase = "lost"` identifica como perdido
- `metadata.lostReason` preenchido para análise

---

## ⚠️ 8. Problemas Comuns e Soluções

### Problema: Cards não aparecem como fechados

**Causa:** `stepPhase` não está configurado como `"closed"` e o `stepTitle` não contém "fechado" ou "ganho"

**Solução:** 
1. Configurar `stepPhase = "closed"` na etapa de fechamento, OU
2. Garantir que o `stepTitle` contenha "fechado" ou "ganho"

---

### Problema: Análise de produtos não funciona

**Causa:** Campos `productId` ou `product` não estão configurados nos cards

**Solução:** 
1. Adicionar campo personalizado `productId` ou `product` nos cards
2. Adicionar campo `productName` para exibição do nome

---

### Problema: Análise por canal não funciona

**Causa:** Campo `metadata.channelId` não está configurado ou usa valores diferentes dos esperados

**Solução:** 
1. Configurar `metadata.channelId` nos cards
2. Usar valores exatos: `whatsapp`, `meta`, `google`, `instagram`, `telegram`, `website`, `email`

---

### Problema: Análise de perdas não mostra motivos

**Causa:** Campo `lostReason` não está configurado em `metadata` ou `customFields`

**Solução:** 
1. Adicionar campo `lostReason` em `metadata.lostReason` OU `customFields.lostReason`
2. Preencher com valores descritivos (ex: "Preço alto", "Optou por concorrente")

---

## 📞 9. Suporte

Se tiver dúvidas sobre a configuração, consulte:
- Código fonte: `src/features/metrics/metricsService.ts`
- Documentação da API: `/api/docs` (Swagger)
- Este documento: `CONFIGURACAO_CRM_REQUERIDA.md`

---

**Última atualização:** Novembro 2024  
**Versão:** 1.0.0


