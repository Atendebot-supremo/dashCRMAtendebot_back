# 📋 README - dashCRMAtendebot Backend API

## 🎯 Objetivo

Criar uma API intermediária entre a plataforma Helena/flw.chat e o dashboard CRM frontend para:

- ✅ **Segurança**: Ocultar tokens de autenticação do frontend
- ✅ **Performance**: Cache e otimização de requisições
- ✅ **Transformação**: Agregar e transformar dados em métricas
- ✅ **Flexibilidade**: Adicionar lógica de negócio sem modificar o frontend
- ✅ **Multi-tenancy**: Suportar múltiplos clientes com tokens diferentes

---

## 📚 Documentação Disponível

| Documento | Descrição | Para Quem |
|-----------|-----------|-----------|
| **API_DOCUMENTATION.md** | Documentação completa da API com todos os endpoints, estruturas de código, exemplos | Backend Developer |
| **MIGRATION_GUIDE.md** | Guia passo-a-passo para migrar o frontend | Frontend Developer |
| **DEPLOY_RAILWAY.md** | Guia completo de deploy no Railway com variáveis de ambiente e troubleshooting | DevOps / Deploy |
| **_START_HERE.md** | Índice geral e guia de início rápido de todos os documentos | Todos |
| **IMPLEMENTATION_CHECKLIST.md** | Checklist detalhado de todas as fases de implementação | Todos |
| **README_API_BACKEND.md** | Este arquivo - visão geral e início rápido | Project Manager |

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ JWT Auth
       │
┌──────▼──────────────────────┐
│   Backend API               │
│   (Node.js + Express)       │
│                             │
│  ┌─────────────────────┐   │
│  │  Auth Middleware    │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │  CRM Service        │   │
│  │  Metrics Service    │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │  Helena Client      │   │
│  │  (HTTP + Token)     │   │
│  └──────────┬──────────┘   │
└─────────────┼──────────────┘
              │
   ┌──────────▼──────────┐
   │  API Helena/flw.chat│
   │  (Externa)          │
   └─────────────────────┘
```

---

## 🚀 Início Rápido

### Passo 1: Criar Projeto Backend

```bash
mkdir dashCRMAtendebot_back
cd dashCRMAtendebot_back
npm init -y
```

### Passo 2: Instalar Dependências

```bash
# Principais
npm i express cors helmet express-rate-limit express-session jsonwebtoken swagger-jsdoc swagger-ui-express dotenv axios

# TypeScript
npm i -D typescript ts-node-dev @types/express @types/cors @types/helmet @types/express-rate-limit @types/express-session @types/jsonwebtoken @types/node @types/swagger-ui-express

# Inicializar TypeScript
npx tsc --init
```

### Passo 3: Criar Estrutura

```bash
mkdir -p src/{config,features/{auth,crm,metrics},middleware,types,utils}
mkdir public
```

### Passo 4: Configurar package.json

```json
{
  "scripts": {
    "dev": "ts-node-dev --transpile-only --exit-child src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Passo 5: Criar .env

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-super-seguro
HELENA_API_URL=https://api.flw.chat
HELENA_TOKENS='[{"clientId":"maxchip","token":"pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk"}]'
```

### Passo 6: Seguir API_DOCUMENTATION.md

Abra `API_DOCUMENTATION.md` e implemente:
1. Configuração Helena
2. Helena Client
3. CRM Service
4. Metrics Service
5. Controllers
6. Routes
7. Server Bootstrap

### Passo 7: Testar

```bash
npm run dev
```

Acesse:
- http://localhost:3000/health
- http://localhost:3000/api/docs (Swagger)

---

## 📊 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login do cliente

### CRM
- `GET /api/crm/panels` - Lista painéis
- `GET /api/crm/panels/:id` - Detalhes de painel
- `GET /api/crm/cards` - Lista cards com filtros
- `GET /api/crm/cards/:id` - Detalhes de card
- `GET /api/crm/users` - Lista usuários
- `GET /api/crm/channels` - Lista canais

### Métricas
- `GET /api/metrics/funnel` - Métricas do funil
- `GET /api/metrics/revenue` - Métricas de receita
- `GET /api/metrics/conversion` - Métricas de conversão
- `GET /api/metrics/loss` - Análise de perdas
- `GET /api/metrics/temporal` - Comparações temporais
- `GET /api/metrics/seller-performance` - Performance por vendedor
- `GET /api/metrics/products` - Análise de produtos
- `GET /api/metrics/dashboard` - Dashboard completo (all-in-one)

---

## 🔐 Autenticação

### Fluxo

1. Cliente faz login com email/senha
2. Backend valida e retorna JWT
3. Frontend salva JWT no localStorage
4. Todas as requisições incluem: `Authorization: Bearer <jwt>`
5. Backend extrai `clientId` do JWT
6. Backend usa token Helena específico do cliente
7. Backend chama API Helena e retorna dados

### Estrutura do JWT

```json
{
  "clientId": "maxchip",
  "name": "MaxChip Telecom",
  "email": "contato@maxchip.com",
  "role": "client",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 📦 Estrutura de Pastas

```
dashCRMAtendebot_back/
├── src/
│   ├── config/
│   │   ├── helena.ts              # Configuração API Helena
│   │   └── clients.ts             # Configuração de clientes
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authRoutes.ts
│   │   │   ├── authController.ts
│   │   │   ├── authService.ts
│   │   │   └── types.ts
│   │   ├── crm/
│   │   │   ├── crmRoutes.ts
│   │   │   ├── crmController.ts
│   │   │   ├── crmService.ts
│   │   │   ├── helenaClient.ts
│   │   │   └── types.ts
│   │   └── metrics/
│   │       ├── metricsRoutes.ts
│   │       ├── metricsController.ts
│   │       ├── metricsService.ts
│   │       └── types.ts
│   ├── middleware/
│   │   └── auth.middleware.ts     # Middleware JWT
│   ├── types/
│   │   └── index.ts               # Tipos globais
│   ├── utils/
│   │   ├── calculations.ts        # Funções de cálculo
│   │   └── cache.ts               # Cache in-memory
│   └── server.ts                  # Bootstrap do servidor
├── dist/                          # Build TypeScript (gerado)
├── .env                           # Variáveis de ambiente (não commitado)
├── .env.example                   # Exemplo de variáveis
├── .gitignore
├── .dockerignore                  # Arquivos ignorados no Docker
├── package.json
├── package-lock.json
├── tsconfig.json
├── Dockerfile                     # Docker para deploy
├── railway.json                   # Configuração Railway
├── DEPLOY_RAILWAY.md              # Guia de deploy
└── README.md
```

---

## 🧪 Testando a API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contato@maxchip.com","password":"senha-segura"}'
```

### 2. Copiar Token da Response

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Testar Painéis

```bash
curl http://localhost:3000/api/crm/panels \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Testar Cards

```bash
curl "http://localhost:3000/api/crm/cards?panelId=PANEL_ID" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 5. Testar Métricas

```bash
curl "http://localhost:3000/api/metrics/funnel?panelId=PANEL_ID" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6. Dashboard Completo

```bash
curl "http://localhost:3000/api/metrics/dashboard?panelId=PANEL_ID&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🎨 Frontend - Exemplo de Uso

```typescript
// Login
const handleLogin = async () => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  localStorage.setItem('authToken', data.data.token)
}

// Buscar Painéis
const fetchPanels = async () => {
  const token = localStorage.getItem('authToken')
  const response = await fetch('http://localhost:3000/api/crm/panels', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()
  return data.data.items
}

// Buscar Dashboard Completo
const fetchDashboard = async (filters) => {
  const token = localStorage.getItem('authToken')
  const params = new URLSearchParams(filters)
  const response = await fetch(
    `http://localhost:3000/api/metrics/dashboard?${params}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await response.json()
  return data.data
}
```

---

## 🚀 Deploy

### Status Atual

✅ **Backend completamente implementado**  
✅ **Dockerfile configurado**  
✅ **Railway.json configurado**  
✅ **Branch `dev` criada para desenvolvimento**  
✅ **Branch `main` pronta para produção**  

### Railway (Recomendado)

O projeto está pronto para deploy no Railway. Consulte o arquivo **DEPLOY_RAILWAY.md** para instruções completas.

**Resumo:**
1. **Criar novo projeto na Railway**
2. **Conectar repositório GitHub**
3. **Selecionar branch** (`main` para produção, `dev` para testes)
4. **Definir variáveis de ambiente** (ver `DEPLOY_RAILWAY.md`)
5. **Deploy automático via Dockerfile**

**Variáveis de Ambiente Obrigatórias:**
```
PORT=3000
NODE_ENV=production
JWT_SECRET=seu-jwt-secret-super-seguro
HELENA_API_URL=https://api.flw.chat
HELENA_TOKENS=[{"clientId":"maxchip","token":"pn_..."}]
CLIENTS_CONFIG=[{"clientId":"maxchip","name":"...","email":"...","passwordHash":"$2b$10$..."}]
CACHE_TTL=300000
```

### Estrutura de Branches

- **`main`**: Branch de produção (deploy automático)
- **`dev`**: Branch de desenvolvimento (testes e features)

**Fluxo recomendado:**
```bash
# Desenvolvimento
git checkout dev
# ... fazer alterações ...
git commit -m "feat: nova funcionalidade"
git push origin dev

# Quando pronto para produção
git checkout main
git merge dev
git push origin main  # Railway faz deploy automático
```

### Dockerfile

O Dockerfile está configurado e pronto:

```dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## ✅ Checklist de Implementação

### Configuração Inicial
- [x] Criar projeto Node.js + TypeScript
- [x] Instalar dependências
- [x] Criar estrutura de pastas
- [x] Configurar .env e .env.example

### Tipos e Utilitários
- [x] Tipos globais (APIResponse, ErrorCode, etc.)
- [x] Configuração Helena (getHelenaToken)
- [x] Utilitários de cache (node-cache)
- [x] Funções de cálculo (calculations.ts)

### Autenticação
- [x] Implementar login com JWT
- [x] Auth Service (validação e geração de token)
- [x] Auth Controller e Routes
- [x] Middleware de autenticação JWT
- [x] Configuração de clientes (clients.ts)

### CRM
- [x] Helena Client (Axios com interceptors)
- [x] CRM Service (getPanels, getCards, etc.)
- [x] CRM Controller (6 endpoints)
- [x] CRM Routes com validação
- [x] Rate limiting configurado

### Métricas
- [x] Types de métricas completos
- [x] Metrics Service (8 métodos de cálculo)
- [x] Metrics Controller (8 endpoints)
- [x] Metrics Routes com validação
- [x] Cálculos: funil, receita, conversão, perdas, temporal, vendedor, produtos, dashboard

### Server Bootstrap
- [x] Express server configurado
- [x] Middlewares globais (CORS, Helmet, Rate Limiting)
- [x] Swagger/OpenAPI documentação completa
- [x] Health endpoints (/health, /ready, /live)
- [x] Error handling global
- [x] Graceful shutdown

### Deploy e Infraestrutura
- [x] Dockerfile configurado
- [x] railway.json configurado
- [x] .dockerignore configurado
- [x] DEPLOY_RAILWAY.md criado
- [x] Branch `dev` criada para desenvolvimento
- [x] Branch `main` pronta para produção
- [x] Código enviado para repositório

### Documentação
- [x] README_API_BACKEND.md atualizado
- [x] API_DOCUMENTATION.md completo
- [x] MIGRATION_GUIDE.md completo
- [x] IMPLEMENTATION_CHECKLIST.md completo
- [x] DEPLOY_RAILWAY.md completo
- [x] _START_HERE.md com índice geral

### Status Final
✅ **Backend 100% implementado e funcional**  
✅ **14 endpoints completos e testados**  
✅ **Swagger documentação completa**  
✅ **Pronto para deploy no Railway**

---

## 📖 Leitura Recomendada

1. **API_DOCUMENTATION.md** (⭐ Mais importante)
   - Documentação completa de todos os endpoints
   - Estruturas de código prontas
   - Exemplos detalhados

2. **MIGRATION_GUIDE.md**
   - Como migrar o frontend
   - Código antes/depois
   - Checklist de migração

3. **QUICK_REFERENCE.md**
   - Referência rápida
   - Tabelas de endpoints
   - Exemplos curl
   - Hooks React Query

---

## 🤝 Suporte

Para implementação:
1. Siga **API_DOCUMENTATION.md** passo a passo
2. Use os exemplos de código fornecidos
3. Teste cada endpoint antes de prosseguir
4. Consulte **QUICK_REFERENCE.md** para dúvidas rápidas

---

## 🎯 Próximos Passos

### ✅ Fase 1: Backend (COMPLETO)
1. ✅ Ler esta documentação
2. ✅ Criar projeto seguindo `API_DOCUMENTATION.md`
3. ✅ Implementar todos os endpoints (14 endpoints)
4. ✅ Testar com Postman/Insomnia
5. ✅ Preparar deploy no Railway (Dockerfile, railway.json)

### 📋 Fase 2: Frontend (PRÓXIMO)
1. ⏳ Seguir `MIGRATION_GUIDE.md`
2. ⏳ Atualizar código do frontend para consumir nova API
3. ⏳ Implementar página de login
4. ⏳ Atualizar hooks React Query
5. ⏳ Testar integração end-to-end
6. ⏳ Deploy frontend no Railway

### 🚀 Fase 3: Deploy e Produção
1. ⏳ Configurar projeto no Railway (usar branch `main`)
2. ⏳ Configurar variáveis de ambiente no Railway
3. ⏳ Fazer deploy e testar endpoints em produção
4. ⏳ Configurar domínio customizado (opcional)
5. ⏳ Configurar monitoramento e logs
6. ⏳ Adicionar novos clientes conforme necessário

### 📝 Fase 4: Documentação e Manutenção
1. ✅ Documentação técnica completa
2. ✅ Guias de deploy atualizados
3. ⏳ Testes de integração automatizados (futuro)
4. ⏳ CI/CD pipeline (futuro)

---

## 📊 Estimativa de Tempo

| Fase | Tempo Estimado | Prioridade |
|------|---------------|-----------|
| Setup inicial | 1-2 horas | 🔴 Alta |
| Autenticação | 2-3 horas | 🔴 Alta |
| CRM Endpoints | 3-4 horas | 🔴 Alta |
| Métricas | 4-5 horas | 🟡 Média |
| Testes | 2-3 horas | 🟡 Média |
| Deploy | 1-2 horas | 🔴 Alta |
| **Total** | **13-19 horas** | |

---

## 🏆 Benefícios

### Antes (Frontend → API Helena)
- ❌ Token exposto no frontend
- ❌ Lógica de cálculo no frontend
- ❌ Múltiplas requisições por página
- ❌ Cache apenas no frontend
- ❌ Difícil adicionar novos clientes

### Depois (Frontend → API Intermediária → API Helena)
- ✅ Token seguro no backend
- ✅ Lógica centralizada no backend
- ✅ Uma requisição (dashboard completo)
- ✅ Cache no backend + frontend
- ✅ Multi-tenancy fácil

---

## 🔧 Stack Tecnológica

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Autenticação**: JWT (jsonwebtoken)
- **HTTP Client**: Axios
- **Documentação**: Swagger (swagger-ui-express)
- **Segurança**: Helmet, CORS, Rate Limiting
- **Logs**: Winston (opcional)
- **Cache**: Redis ou in-memory (node-cache)

### Frontend
- **Framework**: React 18+ com Vite
- **Linguagem**: TypeScript
- **State Management**: TanStack Query
- **Estilo**: TailwindCSS + Radix UI
- **Charts**: Tremor + Recharts

---

## 📞 Contato

Para dúvidas sobre a implementação:
- Consulte primeiro a **API_DOCUMENTATION.md**
- Use os exemplos de código fornecidos
- Teste incrementalmente cada funcionalidade

---

**Implementação completa! 🎉**

---

## 📊 Status do Projeto

**Versão:** 1.0.0  
**Status:** ✅ Implementação Completa  
**Data:** Novembro 2024  
**Última Atualização:** Novembro 2024  
**Projeto:** dashCRMAtendebot - Backend API

### Endpoints Implementados

- ✅ **1** endpoint de Autenticação
- ✅ **6** endpoints de CRM
- ✅ **8** endpoints de Métricas
- ✅ **3** endpoints de Health
- **Total: 18 endpoints funcionais**

### Branches

- **`main`**: Produção (deploy automático Railway)
- **`dev`**: Desenvolvimento (testes e features)

### Repositório

- **GitHub:** https://github.com/Atendebot-supremo/dashCRMAtendebot_back
- **Branch principal:** `main`
- **Branch desenvolvimento:** `dev`

---

**Pronto para produção! 🚀**

