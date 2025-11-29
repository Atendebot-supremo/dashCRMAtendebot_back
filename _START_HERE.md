# 🚀 START HERE - Guia Completo dashCRMAtendebot

## 📚 Status: ✅ Backend Implementado

O backend foi implementado com as seguintes características:

- ✅ **Autenticação via Telefone** (integrado com API Helena)
- ✅ **Supabase** para armazenamento de usuários e tokens
- ✅ **14 Endpoints** funcionando (Auth, CRM, Metrics)
- ✅ **Swagger** documentado em `/api/docs`

---

## 📚 Documentação Disponível

### 1️⃣ **_START_HERE.md** (Este arquivo)
📍 **Você está aqui!** Índice e visão geral.

### 2️⃣ **README_API_BACKEND.md** ⭐ **PRINCIPAL**
📖 Documentação completa do backend:
- Arquitetura
- Configuração
- Endpoints
- Exemplos de uso

### 3️⃣ **CURSOR_PROMPT.md**
🤖 Referência técnica da implementação.

### 4️⃣ **supabase_setup.sql**
🗄️ SQL para criar a tabela no Supabase.

### 5️⃣ **API_DOCUMENTATION.md**
📖 Documentação técnica detalhada dos endpoints.

### 6️⃣ **MIGRATION_GUIDE.md**
🔄 Guia para migrar o frontend.

---

## 🎯 Configuração Rápida

### 1. Instalar Dependências

```bash
cd dashCRMAtendebot_back
npm install
```

### 2. Criar arquivo .env

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=dashCRM-jwt-secret-key-2024-segura

# Supabase
SUPABASE_URL=https://supabase.labfy.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui

# Helena
HELENA_API_URL=https://api.helena.run

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Configurar Supabase

Execute no SQL Editor do Supabase:

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

### 4. Inserir Usuário de Teste

```sql
INSERT INTO users_dashcrmatendebot (name, phone, helena_token, active)
VALUES (
  'Maxchip',
  '5531999999999',
  'pn_seu_token_helena_aqui',
  true
);
```

### 5. Rodar o Servidor

```bash
npm run dev
```

### 6. Testar

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "31999999999"}'

# Swagger
open http://localhost:3000/api/docs
```

---

## 🔐 Fluxo de Autenticação

```
┌─────────────────────────────────────────┐
│ 1. Usuário digita TELEFONE              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. POST /api/auth/login                 │
│    Body: { "phone": "31999999999" }     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Backend busca no Supabase            │
│    Tabela: users_dashcrmatendebot       │
│    Retorna: name, phone, helena_token   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Backend chama API Helena             │
│    POST /auth/v1/login/authenticate/    │
│         external                         │
│    Authorization: Bearer <helena_token> │
│    Body: { "phoneNumber": "55..." }     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Helena retorna tokens de acesso      │
│    accessToken, userId, tenantId, etc.  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Backend gera JWT próprio             │
│    Contém: userId, phone, helenaUserId  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Frontend recebe e salva o token      │
│    Usa em todas as requisições          │
│    Authorization: Bearer <jwt>          │
└─────────────────────────────────────────┘
```

---

## 📊 Endpoints Disponíveis

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login via telefone |

### CRM
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/crm/panels` | Lista painéis |
| GET | `/api/crm/panels/:id` | Detalhes do painel |
| GET | `/api/crm/cards` | Lista cards |
| GET | `/api/crm/cards/:id` | Detalhes do card |
| GET | `/api/crm/users` | Lista usuários |
| GET | `/api/crm/channels` | Lista canais |

### Métricas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/metrics/funnel` | Funil de vendas |
| GET | `/api/metrics/revenue` | Receita |
| GET | `/api/metrics/conversion` | Conversão |
| GET | `/api/metrics/loss` | Análise de perdas |
| GET | `/api/metrics/temporal` | Comparações temporais |
| GET | `/api/metrics/seller-performance` | Performance vendedores |
| GET | `/api/metrics/products` | Análise produtos |
| GET | `/api/metrics/dashboard` | Dashboard completo |

### Health
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do servidor |
| GET | `/ready` | Servidor pronto |
| GET | `/live` | Servidor vivo |
| GET | `/api/docs` | Swagger UI |

---

## 🗺️ Próximos Passos

### ✅ Concluído
- [x] Backend implementado
- [x] Autenticação via telefone
- [x] Integração com Supabase
- [x] Integração com API Helena
- [x] Endpoints CRM
- [x] Endpoints Métricas
- [x] Swagger documentação

### ⏳ Pendente
- [ ] Deploy no Railway
- [ ] Migrar Frontend
- [ ] Testes em produção

---

## 📞 Referências

- [Helena API - Autenticação](https://helena.readme.io/reference/getting-started-with-your-api)
- [Helena API - Login Integrado](https://helena.readme.io/reference/login-integrado)
- [Supabase Documentation](https://supabase.com/docs)

---

**Versão:** 2.0.0  
**Data:** Novembro 2024  
**Status:** ✅ Backend Implementado
