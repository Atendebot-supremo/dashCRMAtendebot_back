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
| **README_API_BACKEND.md** | Este arquivo - visão geral e início rápido | Project Manager |
| **supabase_setup.sql** | SQL para criar tabela no Supabase | DBA |

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
   ┌──────────▼──────────┐    ┌─────────────────┐
   │  API Helena/flw.chat│    │    Supabase     │
   │  (Externa)          │    │  (PostgreSQL)   │
   └─────────────────────┘    └─────────────────┘
```

---

## 🚀 Início Rápido

### Passo 1: Clonar e Instalar

```bash
cd dashCRMAtendebot_back
npm install
```

### Passo 2: Configurar .env

Crie o arquivo `.env` na raiz do projeto:

```env
# =============================================
# CONFIGURAÇÃO DO SERVIDOR
# =============================================
PORT=3000
NODE_ENV=development

# =============================================
# SEGURANÇA - JWT
# =============================================
JWT_SECRET=dashCRM-jwt-secret-key-2024-segura

# =============================================
# SUPABASE
# =============================================
SUPABASE_URL=https://supabase.labfy.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui

# =============================================
# API HELENA
# =============================================
HELENA_API_URL=https://api.helena.run

# =============================================
# CORS - Origens permitidas
# =============================================
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# =============================================
# CACHE (opcional)
# =============================================
CACHE_TTL=300000
```

### Passo 3: Configurar Supabase

1. Acesse o Supabase Studio
2. Vá em SQL Editor
3. Execute o script `supabase_setup.sql`
4. Insira um usuário de teste:

```sql
INSERT INTO users_dashcrmatendebot (name, phone, helena_token, active)
VALUES (
  'Cliente Teste',
  '5531999999999',
  'pn_seu_token_helena_aqui',
  true
);
```

### Passo 4: Rodar

```bash
npm run dev
```

Acesse:
- http://localhost:3000/health
- http://localhost:3000/api/docs (Swagger)

---

## 📊 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login via telefone

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

### Fluxo de Login

```
1. Usuário digita TELEFONE no frontend
              │
              ▼
2. Backend busca usuário no Supabase pelo telefone
              │
              ▼
3. Backend obtém o helena_token do usuário
              │
              ▼
4. Backend chama API Helena:
   POST https://api.helena.run/auth/v1/login/authenticate/external
   Authorization: Bearer <helena_token>
   Body: { "phoneNumber": "5531999999999" }
              │
              ▼
5. Helena retorna: accessToken, userId, tenantId
              │
              ▼
6. Backend gera JWT próprio e retorna ao frontend
              │
              ▼
7. Frontend salva JWT e usa em todas as requisições
```

### Estrutura do JWT

```json
{
  "userId": "uuid-do-supabase",
  "name": "Nome do Cliente",
  "phone": "5531999999999",
  "helenaUserId": "uuid-helena",
  "tenantId": "tenant-id-helena",
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
│   │   ├── helena.ts           # Configuração API Helena
│   │   └── supabase.ts         # Cliente Supabase
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
│   │   └── auth.middleware.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   └── cache.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── Dockerfile
├── supabase_setup.sql
└── README.md
```

---

## 🧪 Testando a API

### 1. Login (via Telefone)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "31999999999"}'
```

### 2. Resposta do Login

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "helena": {
      "accessToken": "eyJhbGciOi...",
      "userId": "uuid-helena",
      "tenantId": "tenant-id",
      "expiresIn": "2024-01-01T00:00:00Z",
      "refreshToken": "rf_xxxxx",
      "urlRedirect": "https://..."
    },
    "user": {
      "id": "uuid-supabase",
      "name": "Nome do Cliente",
      "phone": "5531999999999"
    }
  },
  "message": "Login realizado com sucesso"
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

### 5. Dashboard Completo

```bash
curl "http://localhost:3000/api/metrics/dashboard?panelId=PANEL_ID&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🎨 Frontend - Exemplo de Uso

```typescript
// Login via Telefone
const handleLogin = async (phone: string) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  const data = await response.json()
  localStorage.setItem('authToken', data.data.token)
  return data.data
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

## 🗄️ Banco de Dados (Supabase)

### Tabela: users_dashcrmatendebot

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (auto-gerado) |
| name | VARCHAR(255) | Nome do cliente/empresa |
| phone | VARCHAR(20) | Telefone (único, usado no login) |
| helena_token | VARCHAR(255) | Token permanente da API Helena |
| created_at | TIMESTAMP | Data de criação |
| active | BOOLEAN | Se o usuário está ativo |

### SQL de Criação

```sql
CREATE TABLE users_dashcrmatendebot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  helena_token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_dashcrm_phone ON users_dashcrmatendebot(phone);
```

---

## 🚀 Deploy

### Railway

1. **Criar novo projeto na Railway**
2. **Conectar repositório GitHub**
3. **Definir variáveis de ambiente:**
   ```
   PORT=3000
   NODE_ENV=production
   JWT_SECRET=seu-jwt-secret-super-seguro
   SUPABASE_URL=https://supabase.labfy.co
   SUPABASE_SERVICE_KEY=sua-service-key
   HELENA_API_URL=https://api.helena.run
   CORS_ORIGINS=https://seu-frontend.com
   ```
4. **Deploy automático**

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

---

## 🔧 Stack Tecnológica

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Autenticação**: JWT (jsonwebtoken)
- **HTTP Client**: Axios
- **Banco de Dados**: Supabase (PostgreSQL)
- **Documentação**: Swagger (swagger-ui-express)
- **Segurança**: Helmet, CORS, Rate Limiting
- **Cache**: node-cache

### Integrações
- **Helena API**: https://api.helena.run
- **Supabase**: https://supabase.labfy.co

---

## 📞 Referências

- [Documentação Helena - Autenticação](https://helena.readme.io/reference/getting-started-with-your-api)
- [Documentação Helena - Login Integrado](https://helena.readme.io/reference/login-integrado)
- [Supabase Documentation](https://supabase.com/docs)

---

**Versão:** 2.0.0  
**Data:** Novembro 2024  
**Projeto:** dashCRMAtendebot - Backend API
