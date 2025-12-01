# ✅ Passos de Validação - dashCRMAtendebot Backend

## 🎯 Objetivo

Este documento lista todos os passos necessários para validar que o backend está funcionando corretamente antes de fazer deploy e integrar com o frontend.

---

## 📋 Checklist de Validação

### 1. ✅ Configuração Inicial

- [ ] Arquivo `.env` criado com todas as variáveis
- [ ] `SUPABASE_URL` configurado corretamente
- [ ] `SUPABASE_SERVICE_KEY` configurado corretamente
- [ ] `HELENA_API_URL` configurado (`https://api.helena.run`)
- [ ] `JWT_SECRET` definido (mínimo 32 caracteres)

### 2. ✅ Banco de Dados (Supabase)

- [ ] Tabela `users_dashcrmatendebot` criada
- [ ] Índice `idx_users_dashcrm_phone` criado
- [ ] Pelo menos 1 usuário inserido na tabela
- [ ] Telefone do usuário no formato correto (com DDI se necessário)
- [ ] `helena_token` válido e ativo

**SQL de Verificação:**
```sql
SELECT id, name, phone, active, created_at 
FROM users_dashcrmatendebot;
```

### 3. ✅ Servidor Rodando

- [ ] `npm run dev` executa sem erros
- [ ] Servidor inicia na porta 3000 (ou porta configurada)
- [ ] Nenhum erro no console sobre Supabase
- [ ] Nenhum erro no console sobre variáveis de ambiente

**Teste:**
```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2024-11-29T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### 4. ✅ Swagger Funcionando

- [ ] Acessar `http://localhost:3000/api/docs`
- [ ] Swagger UI carrega sem erros
- [ ] Todos os endpoints aparecem listados
- [ ] Documentação de cada endpoint visível

### 5. ✅ Autenticação (Login)

**Teste de Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"34988585271"}'
```

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "helena": {
      "accessToken": "eyJhbGciOi...",
      "userId": "uuid-helena",
      "tenantId": "tenant-id",
      "expiresIn": "2024-...",
      "refreshToken": "rf_xxx",
      "urlRedirect": "https://..."
    },
    "user": {
      "id": "uuid-supabase",
      "name": "AtendebotAtendimento",
      "phone": "5534988585271"
    }
  },
  "message": "Login realizado com sucesso"
}
```

**Cenários de Erro a Testar:**
- [ ] Telefone não encontrado → Retorna 401
- [ ] Telefone inválido → Retorna 400
- [ ] Token Helena inválido → Retorna 502
- [ ] Usuário inativo → Retorna 401

### 6. ✅ Endpoints CRM (Protegidos)

**Copiar o token do login anterior e usar:**

```bash
TOKEN="seu-token-jwt-aqui"
```

#### 6.1 Listar Painéis

```bash
curl http://localhost:3000/api/crm/panels \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 1
  },
  "message": "Painéis listados com sucesso"
}
```

#### 6.2 Listar Cards

```bash
curl "http://localhost:3000/api/crm/cards?panelId=PANEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 10,
    "totalPages": 1,
    "pageNumber": 1,
    "pageSize": 100
  }
}
```

#### 6.3 Listar Usuários

```bash
curl http://localhost:3000/api/crm/users \
  -H "Authorization: Bearer $TOKEN"
```

#### 6.4 Listar Canais

```bash
curl http://localhost:3000/api/crm/channels \
  -H "Authorization: Bearer $TOKEN"
```

**Cenários de Erro a Testar:**
- [ ] Requisição sem token → Retorna 401
- [ ] Token inválido → Retorna 401
- [ ] Token expirado → Retorna 401
- [ ] panelId inválido → Retorna 500 (erro da Helena)

### 7. ✅ Endpoints de Métricas

#### 7.1 Métricas do Funil

```bash
curl "http://localhost:3000/api/metrics/funnel?panelId=PANEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "stages": [...],
    "totalLeads": 100,
    "totalValue": 50000,
    "overallConversionRate": 15.5,
    "forecast": 9300
  }
}
```

#### 7.2 Métricas de Receita

```bash
curl "http://localhost:3000/api/metrics/revenue?panelId=PANEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### 7.3 Dashboard Completo

```bash
curl "http://localhost:3000/api/metrics/dashboard?panelId=PANEL_ID&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "summary": {...},
    "funnel": {...},
    "revenue": {...},
    "conversion": {...},
    "loss": {...},
    "sellers": {...}
  }
}
```

### 8. ✅ Validação de Performance

- [ ] Login responde em < 2 segundos
- [ ] Listagem de painéis responde em < 1 segundo
- [ ] Listagem de cards responde em < 2 segundos
- [ ] Dashboard completo responde em < 5 segundos

### 9. ✅ Validação de Segurança

- [ ] Tokens não aparecem em logs
- [ ] Erros não expõem informações sensíveis
- [ ] Rate limiting funcionando (testar muitas requisições)
- [ ] CORS configurado corretamente

**Teste de Rate Limiting:**
```bash
# Fazer 11 requisições de login rapidamente
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"34988585271"}'
  echo ""
done
```

**Esperado:** As primeiras 10 funcionam, a 11ª retorna 429 (Too Many Requests)

---

## 🚨 Problemas Comuns e Soluções

### Erro: "relation users_dashcrmatendebot does not exist"

**Solução:**
1. Verificar se está no banco correto do Supabase
2. Executar o SQL de criação da tabela
3. Verificar se o schema é `public`

### Erro: "Token Helena não encontrado"

**Solução:**
1. Verificar se o usuário tem `helena_token` preenchido
2. Verificar se o token está ativo na plataforma Helena
3. Verificar se o token tem o prefixo `pn_`

### Erro: "Usuário não encontrado na Helena"

**Solução:**
1. Verificar se o telefone está cadastrado na plataforma Helena
2. Verificar se o telefone está no formato correto (com DDI)
3. Verificar se o token Helena tem permissão para autenticar usuários

### Erro: CORS no frontend

**Solução:**
1. Adicionar URL do frontend em `CORS_ORIGINS` no `.env`
2. Reiniciar o servidor
3. Verificar se a URL está exatamente igual (com/sem trailing slash)

---

## 📊 Relatório de Validação

Após completar todos os testes, preencha:

| Item | Status | Observações |
|------|--------|-------------|
| Configuração Inicial | ⬜ | |
| Banco de Dados | ⬜ | |
| Servidor Rodando | ⬜ | |
| Swagger | ⬜ | |
| Autenticação | ⬜ | |
| Endpoints CRM | ⬜ | |
| Endpoints Métricas | ⬜ | |
| Performance | ⬜ | |
| Segurança | ⬜ | |

**Data da Validação:** _______________

**Validado por:** _______________

**Próximo Passo:** ⬜ Deploy no Railway | ⬜ Migrar Frontend

---

## 🎯 Próximos Passos Após Validação

1. **Deploy no Railway**
   - Seguir `DEPLOY_RAILWAY.md`
   - Configurar variáveis de ambiente
   - Testar em produção

2. **Migrar Frontend**
   - Seguir `MIGRATION_GUIDE.md`
   - Atualizar cliente HTTP
   - Criar página de login com telefone
   - Testar integração completa

3. **Testes End-to-End**
   - Login completo (frontend → backend → Helena)
   - Dashboard carregando dados reais
   - Filtros funcionando
   - Métricas calculadas corretamente

---

**Versão:** 2.0.0  
**Data:** Novembro 2024

