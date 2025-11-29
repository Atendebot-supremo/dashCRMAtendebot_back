# 🤖 Prompt para Cursor AI - Implementação dashCRMAtendebot Backend

## 📋 Status: ✅ IMPLEMENTADO

Este projeto já foi implementado seguindo a arquitetura descrita. Abaixo está a documentação de referência.

---

## 🎯 ARQUITETURA IMPLEMENTADA

### Fluxo de Autenticação

```
1. Usuário digita TELEFONE no frontend
              │
              ▼
2. POST /api/auth/login { "phone": "31999999999" }
              │
              ▼
3. Backend busca usuário no Supabase (tabela users_dashcrmatendebot)
              │
              ▼
4. Backend obtém helena_token do usuário
              │
              ▼
5. Backend chama API Helena:
   POST https://api.helena.run/auth/v1/login/authenticate/external
   Authorization: Bearer <helena_token>
   Body: { "phoneNumber": "5531999999999" }
              │
              ▼
6. Helena retorna: accessToken, userId, tenantId
              │
              ▼
7. Backend gera JWT próprio com dados do usuário
              │
              ▼
8. Frontend recebe JWT e usa em todas as requisições
```

---

## 🏗️ ESTRUTURA DE PASTAS

```
src/
├── config/
│   ├── helena.ts           # Configuração API Helena (busca token do Supabase)
│   └── supabase.ts         # Cliente Supabase + funções de busca
├── features/
│   ├── auth/
│   │   ├── authRoutes.ts   # POST /api/auth/login
│   │   ├── authController.ts
│   │   ├── authService.ts  # Login via telefone + Helena API
│   │   └── types.ts
│   ├── crm/
│   │   ├── crmRoutes.ts
│   │   ├── crmController.ts
│   │   ├── crmService.ts
│   │   ├── helenaClient.ts # Cliente Axios para API Helena
│   │   └── types.ts
│   └── metrics/
│       ├── metricsRoutes.ts
│       ├── metricsController.ts
│       ├── metricsService.ts
│       └── types.ts
├── middleware/
│   └── auth.middleware.ts  # Valida JWT e anexa user ao request
├── types/
│   └── index.ts
├── utils/
│   ├── calculations.ts
│   └── cache.ts
└── server.ts
```

---

## 📦 DEPENDÊNCIAS

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "axios": "^1.x",
    "cors": "^2.x",
    "dotenv": "^17.x",
    "express": "^5.x",
    "express-rate-limit": "^8.x",
    "express-validator": "^7.x",
    "helmet": "^8.x",
    "jsonwebtoken": "^9.x",
    "node-cache": "^5.x",
    "swagger-jsdoc": "^6.x",
    "swagger-ui-express": "^5.x"
  }
}
```

---

## 🗄️ BANCO DE DADOS (Supabase)

### Tabela: users_dashcrmatendebot

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

## 🔐 AUTENTICAÇÃO

### Request de Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "phone": "31999999999"
}
```

### Response de Login

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "helena": {
      "accessToken": "eyJhbGciOi...",
      "userId": "uuid-helena",
      "tenantId": "tenant-id",
      "expiresIn": "2024-01-01T00:00:00Z",
      "refreshToken": "rf_xxx",
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

### Estrutura do JWT

```json
{
  "userId": "uuid-do-supabase",
  "name": "Nome do Cliente",
  "phone": "5531999999999",
  "helenaUserId": "uuid-helena",
  "tenantId": "tenant-id-helena",
  "role": "client"
}
```

---

## 🌐 VARIÁVEIS DE AMBIENTE (.env)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=dashCRM-jwt-secret-key-2024-segura

# Supabase
SUPABASE_URL=https://supabase.labfy.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Helena
HELENA_API_URL=https://api.helena.run

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Cache
CACHE_TTL=300000
```

---

## 📊 ENDPOINTS IMPLEMENTADOS

### Auth
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login via telefone |

### CRM
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/crm/panels | Lista painéis |
| GET | /api/crm/panels/:id | Detalhes de painel |
| GET | /api/crm/cards | Lista cards com filtros |
| GET | /api/crm/cards/:id | Detalhes de card |
| GET | /api/crm/users | Lista usuários |
| GET | /api/crm/channels | Lista canais |

### Metrics
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/metrics/funnel | Métricas do funil |
| GET | /api/metrics/revenue | Métricas de receita |
| GET | /api/metrics/conversion | Métricas de conversão |
| GET | /api/metrics/loss | Análise de perdas |
| GET | /api/metrics/temporal | Comparações temporais |
| GET | /api/metrics/seller-performance | Performance por vendedor |
| GET | /api/metrics/products | Análise de produtos |
| GET | /api/metrics/dashboard | Dashboard completo |

### Health
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /health | Status do servidor |
| GET | /ready | Pronto para receber requisições |
| GET | /live | Servidor está vivo |
| GET | /api/docs | Documentação Swagger |

---

## 🧪 TESTANDO

### 1. Inserir usuário no Supabase

```sql
INSERT INTO users_dashcrmatendebot (name, phone, helena_token, active)
VALUES ('Maxchip', '5531999999999', 'pn_seu_token_helena', true);
```

### 2. Fazer login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "31999999999"}'
```

### 3. Usar o token retornado

```bash
curl http://localhost:3000/api/crm/panels \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📚 REFERÊNCIAS

- [Helena API - Autenticação](https://helena.readme.io/reference/getting-started-with-your-api)
- [Helena API - Login Integrado](https://helena.readme.io/reference/login-integrado)
- [Supabase Documentation](https://supabase.com/docs)

---

**Versão:** 2.0.0  
**Data:** Novembro 2024  
**Status:** ✅ Implementado
