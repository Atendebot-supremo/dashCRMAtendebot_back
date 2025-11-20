# 🤖 Prompt para Cursor AI - Implementação dashCRMAtendebot Backend

## 📋 Como Usar Este Prompt

1. **Criar novo projeto**: `mkdir dashCRMAtendebot_back && cd dashCRMAtendebot_back`
2. **Abrir no Cursor**: Abrir a pasta no Cursor
3. **Cole este prompt** na conversa do Cursor
4. **Siga as fases** uma a uma, marcando como concluído

---

## 🎯 PROMPT PARA O CURSOR

```
Olá! Preciso implementar uma API Node.js + TypeScript + Express seguindo uma arquitetura específica e documentação completa que já possuo.

📚 DOCUMENTAÇÃO DISPONÍVEL:
Tenho 3 documentos completos:
1. API_DOCUMENTATION.md - Especificação completa de todos os endpoints
2. MIGRATION_GUIDE.md - Guia de migração do frontend
3. QUICK_REFERENCE.md - Referência rápida

🎯 OBJETIVO:
Criar API intermediária entre a plataforma Helena/flw.chat e um dashboard CRM React.

🏗️ ARQUITETURA OBRIGATÓRIA (Padrão "Barbeiro Inteligente"):

src/
├── config/
│   └── helena.ts           # Configuração API Helena (URL, tokens por cliente)
├── features/
│   ├── auth/
│   │   ├── authRoutes.ts
│   │   ├── authController.ts
│   │   ├── authService.ts
│   │   └── types.ts
│   ├── crm/
│   │   ├── crmRoutes.ts
│   │   ├── crmController.ts
│   │   ├── crmService.ts
│   │   ├── helenaClient.ts
│   │   └── types.ts
│   └── metrics/
│       ├── metricsRoutes.ts
│       ├── metricsController.ts
│       ├── metricsService.ts
│       └── types.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── clientContext.middleware.ts
├── types/
│   └── index.ts
├── utils/
│   ├── calculations.ts
│   └── cache.ts
└── server.ts

📦 DEPENDÊNCIAS OBRIGATÓRIAS:
- express, cors, helmet, express-rate-limit
- jsonwebtoken, express-session
- swagger-jsdoc, swagger-ui-express
- axios (para chamar API Helena)
- dotenv
- TypeScript + @types

🔐 AUTENTICAÇÃO:
- Cliente faz login com email/senha
- Backend valida e retorna JWT
- JWT contém: { clientId, name, email, role }
- Todas as requisições protegidas: Authorization: Bearer <jwt>
- Backend extrai clientId do JWT
- Backend usa token Helena específico do cliente (armazenado em variáveis de ambiente)

🌐 API HELENA (Externa):
- Base URL: https://api.flw.chat
- Endpoints que precisamos consumir:
  * GET /crm/v1/panel (lista painéis)
  * GET /crm/v1/panel/:id (detalhes painel)
  * GET /crm/v1/panel/card?panelId=... (lista cards com filtros)
  * GET /crm/v1/panel/card/:id (detalhes card)
- Autenticação: Bearer token específico por cliente
- Cada cliente tem seu próprio token Helena

📊 ENDPOINTS QUE PRECISAMOS CRIAR:

AUTENTICAÇÃO:
- POST /api/auth/login (email, password) → { token, client }

CRM:
- GET /api/crm/panels → lista painéis
- GET /api/crm/panels/:id → detalhes painel (com steps)
- GET /api/crm/cards?panelId=...&startDate=...&endDate=...&userId=...&channelId=... → lista cards
- GET /api/crm/cards/:id → detalhes card
- GET /api/crm/users → lista usuários (extrair de cards ou stub)
- GET /api/crm/channels → lista canais (extrair de cards ou stub)

MÉTRICAS (calculadas no backend):
- GET /api/metrics/funnel?panelId=...&filters → métricas do funil
- GET /api/metrics/revenue?panelId=...&filters → métricas de receita
- GET /api/metrics/conversion?panelId=...&filters → métricas de conversão
- GET /api/metrics/loss?panelId=...&filters → análise de perdas
- GET /api/metrics/temporal?panelId=...&period=... → comparações temporais
- GET /api/metrics/seller-performance?panelId=...&filters → performance por vendedor
- GET /api/metrics/products?panelId=...&filters → análise de produtos
- GET /api/metrics/dashboard?panelId=...&filters → DASHBOARD COMPLETO (all-in-one)

HEALTH:
- GET /health → { status: 'OK', timestamp }
- GET /ready → { status: 'ready' }
- GET /live → { status: 'alive' }

📐 ESTRUTURA DE RESPONSE PADRÃO:

Sucesso:
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}

Erro:
{
  "success": false,
  "error": "Mensagem de erro",
  "code": "ERROR_CODE"
}

Paginação:
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 100,
    "totalPages": 10,
    "pageNumber": 1,
    "pageSize": 10
  }
}

🔢 CÁLCULOS DE MÉTRICAS (Backend):

1. FUNIL:
   - Agrupar cards por stepId/stepTitle
   - Contar leads por etapa
   - Somar valores (monetaryAmount) por etapa
   - Calcular taxa de conversão: (leads etapa atual / leads etapa anterior) * 100
   - Calcular tempo médio na etapa: média de (updatedAt - createdAt) em dias

2. RECEITA:
   - Filtrar cards fechados (stepPhase === 'closed')
   - Somar totalRevenue
   - Calcular averageTicket: totalRevenue / quantidade
   - Agrupar por responsibleUserId (vendedor)
   - Agrupar por canal

3. CONVERSÃO:
   - Taxa geral: (cards fechados / total cards) * 100
   - Ciclo de vendas: média de dias entre createdAt e updatedAt para fechados
   - Tempo de resposta: média de minutos para primeira resposta

4. PERDAS:
   - Filtrar cards perdidos (status === 'lost')
   - Agrupar por lostReason
   - Calcular valor perdido por motivo

🔧 CONVENÇÕES DE CÓDIGO:

1. Controllers:
   - Validar entrada com express-validator
   - Extrair clientId de req.context.user
   - Chamar service
   - Retornar createSuccessResponse() ou createErrorResponse()
   - Adicionar comentários JSDoc/Swagger

2. Services:
   - Receber clientId como primeiro parâmetro
   - Usar HelenaClient para chamar API externa
   - Processar e transformar dados
   - Retornar dados limpos

3. HelenaClient:
   - Classe com métodos para cada endpoint Helena
   - Usar Axios
   - Configurar timeout: 30s
   - Headers: Authorization Bearer, Content-Type application/json
   - Tratar erros HTTP

4. Middleware auth:
   - Extrair token do header Authorization
   - Validar JWT com JWT_SECRET
   - Anexar user em req.context = { user: { id, email, role, ... } }
   - Retornar 401 se inválido

5. Types:
   - Criar interfaces para todos os dados
   - Panel, Card, Contact, User, Channel
   - Métricas: FunnelMetrics, RevenueMetrics, etc.
   - ErrorCode enum
   - APIResponse<T> genérico

🌍 VARIÁVEIS DE AMBIENTE (.env):

PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro
HELENA_API_URL=https://api.flw.chat
HELENA_TOKENS='[{"clientId":"maxchip","token":"pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk"}]'
CACHE_TTL=300000

🔒 SEGURANÇA OBRIGATÓRIA:
- Helmet com CSP
- CORS com lista de origens permitidas
- Rate limiting global (200 req/5min)
- Rate limiting em rotas sensíveis (login: 10 req/1h)
- Validação de entrada com express-validator
- JWT com expiração (1h recomendado)

📚 SWAGGER:
- Configurar em /api/docs
- Definir bearerAuth security scheme
- Adicionar tags: Auth, CRM, Metrics
- Documentar todos os endpoints com JSDoc

🎯 IMPLEMENTAÇÃO EM FASES:

FASE 1 - SETUP:
1. npm init -y
2. Instalar todas as dependências
3. Configurar TypeScript
4. Criar estrutura de pastas
5. Criar .env e .env.example
6. Configurar scripts (dev, build, start)

FASE 2 - TIPOS E UTILITÁRIOS:
1. src/types/index.ts (APIResponse, ErrorCode, etc.)
2. src/config/helena.ts (getHelenaToken)
3. src/utils/calculations.ts (funções de cálculo)

FASE 3 - AUTENTICAÇÃO:
1. src/features/auth/types.ts
2. src/features/auth/authService.ts
3. src/features/auth/authController.ts
4. src/features/auth/authRoutes.ts
5. src/middleware/auth.middleware.ts

FASE 4 - CRM:
1. src/features/crm/types.ts
2. src/features/crm/helenaClient.ts (Axios client)
3. src/features/crm/crmService.ts
4. src/features/crm/crmController.ts
5. src/features/crm/crmRoutes.ts

FASE 5 - MÉTRICAS:
1. src/features/metrics/types.ts
2. src/features/metrics/metricsService.ts (cálculos)
3. src/features/metrics/metricsController.ts
4. src/features/metrics/metricsRoutes.ts

FASE 6 - SERVER:
1. src/server.ts (Express, middlewares, rotas, Swagger)
2. Health endpoints
3. Error handling global

FASE 7 - TESTES:
1. Testar com curl/Postman cada endpoint
2. Validar estruturas de response
3. Testar tratamento de erros

🚀 COMO IMPLEMENTAR:

Vamos implementar FASE POR FASE. Para cada fase:
1. Crie TODOS os arquivos necessários
2. Implemente COMPLETAMENTE (sem TODOs ou placeholders)
3. Siga EXATAMENTE as convenções descritas
4. Adicione comentários JSDoc/Swagger
5. Me avise quando terminar a fase

📝 REGRAS IMPORTANTES:

1. ✅ Código COMPLETO e FUNCIONAL (zero TODOs)
2. ✅ Seguir EXATAMENTE a estrutura de pastas descrita
3. ✅ Usar nomenclatura: PascalCase para classes, camelCase para variáveis/funções
4. ✅ Async/await para operações assíncronas
5. ✅ Try/catch em todos os métodos assíncronos
6. ✅ Logs informativos (console.log estruturado)
7. ✅ Validação de entrada em TODOS os endpoints
8. ✅ Headers CORS corretos
9. ✅ Rate limiting configurado
10. ✅ JWT com expiração

❌ NÃO FAZER:
- Não usar classes ES6 desnecessariamente (preferir funções)
- Não deixar TODOs ou comentários "implementar depois"
- Não usar any sem necessidade
- Não expor erros internos ao cliente
- Não fazer console.log de senhas/tokens

🎬 COMEÇAR AGORA:

Vamos começar pela FASE 1 - SETUP?

1. Confirme que entendeu toda a arquitetura
2. Me pergunte se tem alguma dúvida
3. Comece criando o package.json, tsconfig.json, e estrutura de pastas
4. Instale as dependências
5. Configure os scripts

Depois disso, vamos para FASE 2 e assim sucessivamente.

Pode começar? 🚀
```

---

## 📋 CHECKLIST PARA VOCÊ

Enquanto o Cursor implementa, use este checklist:

### Antes de Começar
- [ ] Criar pasta `dashCRMAtendebot_back`
- [ ] Abrir no Cursor
- [ ] Colar o prompt acima
- [ ] Ter o token Helena em mãos: `pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk`

### Durante a Implementação
- [ ] Acompanhar fase por fase
- [ ] Testar cada endpoint após implementação
- [ ] Verificar se não há TODOs no código
- [ ] Conferir se estrutura de pastas está correta

### Após Implementação
- [ ] Rodar `npm run dev` e verificar se sobe sem erros
- [ ] Testar `/health` no navegador
- [ ] Testar `/api/docs` (Swagger)
- [ ] Fazer login com curl
- [ ] Testar um endpoint CRM
- [ ] Testar um endpoint de métricas

### Para Testar
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contato@maxchip.com","password":"senha123"}'

# 2. Copiar token da resposta e testar painéis
curl http://localhost:3000/api/crm/panels \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 3. Testar métricas (substituir PANEL_ID)
curl "http://localhost:3000/api/metrics/funnel?panelId=PANEL_ID" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🎯 DICAS PARA CONVERSAR COM O CURSOR

### Se o Cursor deixar TODOs:
```
Por favor, implemente COMPLETAMENTE a função X. 
Não deixe TODOs ou placeholders. 
Preciso do código 100% funcional.
```

### Se o Cursor não seguir a estrutura:
```
O arquivo precisa estar em: src/features/crm/crmService.ts
Por favor, mova e ajuste os imports.
```

### Se o Cursor não adicionar Swagger:
```
Adicione comentários JSDoc/Swagger para este endpoint.
Exemplo:
/**
 * @swagger
 * /api/crm/panels:
 *   get:
 *     summary: Lista painéis
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
 */
```

### Se precisar de uma implementação específica:
```
Implemente o método calculateFunnelMetrics seguindo esta lógica:
1. Agrupar cards por stepId
2. Contar quantidade de cards por stage
3. Somar monetaryAmount por stage
4. Calcular taxa de conversão: (atual / anterior) * 100
5. Retornar array de { stage, leads, value, conversionRate }
```

### Para avançar para próxima fase:
```
Ótimo! Fase X concluída. 
Vamos para a FASE Y agora?
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Cannot find module"
**Solução:** 
```bash
npm install
# ou
npm ci
```

### Erro: "Port 3000 already in use"
**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro: "JWT_SECRET is not defined"
**Solução:** Verificar se `.env` existe e está configurado

### Swagger não aparece
**Solução:** Verificar se comentários JSDoc estão corretos e se `swagger-jsdoc` está configurado

---

## 📚 DOCUMENTOS DE REFERÊNCIA

Mantenha estes documentos abertos em outras abas:

1. **API_DOCUMENTATION.md** - Para consultar estruturas de código
2. **QUICK_REFERENCE.md** - Para consultar endpoints e exemplos
3. **IMPLEMENTATION_CHECKLIST.md** - Para marcar progresso

---

## ✅ VALIDAÇÃO FINAL

Após implementação completa, validar:

- [ ] Servidor sobe sem erros
- [ ] `/health` retorna 200
- [ ] `/api/docs` mostra Swagger
- [ ] Login funciona
- [ ] Painéis retornam dados
- [ ] Cards retornam dados
- [ ] Métricas calculam corretamente
- [ ] Todos os endpoints têm Swagger
- [ ] Estrutura de pastas correta
- [ ] Zero TODOs no código
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings

---

## 🎉 PRONTO!

Agora é só:
1. Abrir Cursor no projeto backend
2. Colar o prompt principal
3. Seguir fase por fase
4. Testar cada fase
5. Deploy no Railway

**Boa implementação! 🚀**

