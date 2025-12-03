# 📋 Fluxo de Login - Explicação Completa

## 🔍 Como Funciona Atualmente

### **Fluxo com TELEFONE:**
```
1. Usuário envia: { "phone": "31999999999" }
   ↓
2. Backend busca no Supabase: SELECT * FROM users_dashcrmatendebot WHERE phone = '5531999999999'
   ↓
3. Backend pega o helena_token do registro encontrado
   ↓
4. Backend chama API Helena: POST /auth/v1/login/authenticate/external
   Body: { "phoneNumber": "5531999999999" }
   Header: Authorization: Bearer <helena_token>
   ↓
5. Helena retorna: accessToken, userId, tenantId, etc.
   ↓
6. Backend gera JWT próprio e retorna para o frontend
```

### **Fluxo com EMAIL (NOVO):**
```
1. Usuário envia: { "email": "[email protected]" }
   ↓
2. Backend busca no Supabase: SELECT * FROM users_dashcrmatendebot WHERE email = '[email protected]'
   ↓
3. Backend pega o helena_token do registro encontrado
   ↓
4. Backend chama API Helena: POST /auth/v1/login/authenticate/external
   Body: { "email": "[email protected]" }
   Header: Authorization: Bearer <helena_token>
   ↓
5. Helena retorna: accessToken, userId, tenantId, etc.
   ↓
6. Backend gera JWT próprio e retorna para o frontend
```

### **Fluxo com TELEFONE + EMAIL (NOVO):**
```
1. Usuário envia: { "phone": "31999999999", "email": "[email protected]" }
   ↓
2. Backend busca no Supabase (por telefone OU email, o que vier primeiro)
   ↓
3. Backend pega o helena_token do registro encontrado
   ↓
4. Backend chama API Helena: POST /auth/v1/login/authenticate/external
   Body: { 
     "phoneNumber": "5531999999999",
     "email": "[email protected]"
   }
   Header: Authorization: Bearer <helena_token>
   ↓
5. Helena retorna: accessToken, userId, tenantId, etc.
   ↓
6. Backend gera JWT próprio e retorna para o frontend
```

---

## ✅ O Que Precisa Fazer no Banco de Dados

### **Se a tabela JÁ EXISTE:**
Execute o script de migração:

```sql
-- Arquivo: supabase_migration_add_email.sql
ALTER TABLE users_dashcrmatendebot 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_dashcrm_email 
ON users_dashcrmatendebot(email) 
WHERE email IS NOT NULL;
```

### **Se a tabela NÃO EXISTE:**
Execute o script completo:

```sql
-- Arquivo: supabase_setup.sql
-- Já inclui a coluna email desde o início
```

---

## 📊 Estrutura da Tabela (Atualizada)

```sql
CREATE TABLE users_dashcrmatendebot (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,  -- Obrigatório
  email VARCHAR(255),                  -- NOVO: Opcional
  helena_token VARCHAR(255) NOT NULL,   -- Token para autenticar na Helena
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);
```

---

## 🎯 Resumo

### **SIM, você precisa adicionar a coluna `email` porque:**

1. ✅ Se o usuário enviar apenas `email`, o backend precisa buscar por email no Supabase
2. ✅ A função `getUserByEmail()` faz: `SELECT * WHERE email = '...'`
3. ✅ Sem a coluna, a busca vai falhar

### **O fluxo é o mesmo:**
- **Telefone**: Busca por telefone → pega `helena_token` → autentica na Helena
- **Email**: Busca por email → pega `helena_token` → autentica na Helena
- **Ambos**: Busca por qualquer um → pega `helena_token` → envia ambos para Helena

### **A coluna `email` é OPCIONAL:**
- Usuários podem ter apenas telefone
- Usuários podem ter apenas email
- Usuários podem ter ambos
- O importante é ter pelo menos um para fazer login

---

## 🚀 Próximos Passos

1. Execute a migração no Supabase: `supabase_migration_add_email.sql`
2. (Opcional) Atualize usuários existentes com seus emails:
   ```sql
   UPDATE users_dashcrmatendebot 
   SET email = '[email protected]' 
   WHERE phone = '5531999999999';
   ```
3. Teste o login com email:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "[email protected]"}'
   ```


