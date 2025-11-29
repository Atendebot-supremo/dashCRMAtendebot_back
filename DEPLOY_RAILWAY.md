# 🚂 Deploy no Railway - dashCRMAtendebot Backend

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório Git (GitHub, GitLab, etc.)
3. Supabase configurado com a tabela `users_dashcrmatendebot`
4. Token da API Helena configurado no Supabase

---

## 🚀 Passo a Passo

### 1. Preparar Repositório

Certifique-se de que todos os arquivos estão commitados:

```bash
git add .
git commit -m "Preparar para deploy no Railway"
git push origin main
```

### 2. Criar Novo Projeto no Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"** (ou outro provedor Git)
4. Selecione o repositório `dashCRMAtendebot_back`
5. Aguarde o build inicial

### 3. Configurar Variáveis de Ambiente

No projeto Railway, vá em **Variables** e adicione:

#### Obrigatórias:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=seu-jwt-secret-super-seguro-para-producao-minimo-32-caracteres

# Supabase
SUPABASE_URL=https://supabase.labfy.co
SUPABASE_SERVICE_KEY=sua-service-key-do-supabase

# Helena
HELENA_API_URL=https://api.helena.run

# Cache
CACHE_TTL=300000
```

#### Opcionais (mas recomendadas):

```env
CORS_ORIGINS=https://seu-frontend.railway.app,https://seu-dominio.com
```

### 4. Configurar Supabase

Antes do deploy, certifique-se de que:

1. A tabela `users_dashcrmatendebot` foi criada no Supabase
2. Os usuários foram inseridos com seus tokens Helena

```sql
-- Exemplo de inserção
INSERT INTO users_dashcrmatendebot (name, phone, helena_token, active)
VALUES ('Maxchip', '5531999999999', 'pn_token_helena_aqui', true);
```

### 5. Configurar Build e Deploy

O Railway detectará automaticamente o `Dockerfile` e `railway.json`.

**Configuração no railway.json:**
- ✅ Builder: DOCKERFILE
- ✅ Start Command: `npm run start`
- ✅ Health Check: `/health`
- ✅ Timeout: 300s
- ✅ Restart Policy: ON_FAILURE (max 10 tentativas)

### 6. Aguardar Deploy

O Railway irá:
1. ✅ Buildar a imagem Docker
2. ✅ Compilar TypeScript (`npm run build`)
3. ✅ Iniciar o servidor (`npm run start`)
4. ✅ Verificar health check em `/health`

### 7. Verificar Deploy

Após o deploy, teste os endpoints:

```bash
# Health Check
curl https://seu-projeto.railway.app/health

# Swagger Docs
# Acesse: https://seu-projeto.railway.app/api/docs

# Teste de Login (via Telefone)
curl -X POST https://seu-projeto.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"31999999999"}'
```

---

## 🔧 Configuração de Variáveis de Ambiente no Railway

### Interface Web

1. No projeto Railway, clique em **Variables**
2. Clique em **"New Variable"**
3. Adicione cada variável uma por uma
4. Salve as alterações
5. O Railway fará redeploy automático

### Via CLI Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Adicionar variáveis
railway variables set JWT_SECRET=seu-secret-super-seguro
railway variables set SUPABASE_URL=https://supabase.labfy.co
railway variables set SUPABASE_SERVICE_KEY=sua-service-key
railway variables set HELENA_API_URL=https://api.helena.run
# ... etc
```

---

## 📝 Checklist de Deploy

- [ ] Código commitado e pushado
- [ ] Projeto criado no Railway
- [ ] Repositório conectado
- [ ] Tabela `users_dashcrmatendebot` criada no Supabase
- [ ] Usuários inseridos no Supabase com tokens Helena
- [ ] `JWT_SECRET` definido (senha forte, mínimo 32 caracteres)
- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_KEY` configurado
- [ ] `HELENA_API_URL` configurado
- [ ] `CORS_ORIGINS` configurado (se necessário)
- [ ] Build passou com sucesso
- [ ] Health check retorna 200 OK
- [ ] Swagger docs acessível em `/api/docs`
- [ ] Login testado e funcionando
- [ ] Endpoints protegidos testados

---

## 🔍 Troubleshooting

### Build Falha

**Erro:** `npm ci` falha
- **Solução:** Verifique se `package-lock.json` está commitado

**Erro:** `npm run build` falha
- **Solução:** Verifique erros de TypeScript localmente primeiro: `npm run build`

### Deploy Falha

**Erro:** Health check timeout
- **Solução:** Verifique se a porta está configurada corretamente (variável `PORT`)
- **Solução:** Verifique logs do Railway para erros de inicialização

**Erro:** Servidor não inicia
- **Solução:** Verifique se `dist/server.js` existe após o build
- **Solução:** Verifique variáveis de ambiente obrigatórias

### Runtime Errors

**Erro:** `SUPABASE_URL não configurada`
- **Solução:** Adicione a variável `SUPABASE_URL` no Railway

**Erro:** `Usuário não encontrado`
- **Solução:** Verifique se o telefone está cadastrado na tabela `users_dashcrmatendebot`

**Erro:** `JWT_SECRET is not defined`
- **Solução:** Adicione a variável `JWT_SECRET` no Railway

**Erro:** CORS error no frontend
- **Solução:** Adicione a URL do frontend em `CORS_ORIGINS`

**Erro:** `Erro na autenticação Helena`
- **Solução:** Verifique se o `helena_token` no Supabase está correto
- **Solução:** Verifique se o telefone está cadastrado na plataforma Helena

---

## 🔒 Segurança

### Variáveis Sensíveis

Nunca commite no Git:
- ❌ `.env`
- ❌ `JWT_SECRET`
- ❌ `SUPABASE_SERVICE_KEY`
- ❌ Tokens Helena

Use apenas variáveis de ambiente do Railway para produção.

### Recomendações

1. ✅ Use `JWT_SECRET` forte (mínimo 32 caracteres aleatórios)
2. ✅ Configure `CORS_ORIGINS` apenas com URLs confiáveis
3. ✅ Habilite logs no Railway para monitoramento
4. ✅ Configure alertas para downtime
5. ✅ Mantenha os tokens Helena atualizados no Supabase

---

## 📊 Monitoramento

### Logs no Railway

Acesse **Logs** no dashboard do Railway para:
- Ver erros em tempo real
- Verificar requisições recebidas
- Monitorar performance

### Health Checks

O Railway verifica automaticamente `/health` a cada:
- Início do deploy
- Periodicamente durante execução

### Métricas

Railway fornece métricas de:
- CPU usage
- Memory usage
- Network I/O
- Request count

---

## 🔄 Atualizações

Para atualizar o código em produção:

1. Faça alterações localmente
2. Commit e push:
   ```bash
   git add .
   git commit -m "Atualização: descrição das mudanças"
   git push origin main
   ```
3. Railway detecta o push e faz redeploy automático
4. Aguarde build e deploy completar
5. Verifique health check

---

## 🌐 URLs de Produção

Após deploy, anote a URL gerada pelo Railway:

```
https://seu-projeto.railway.app
```

**Endpoints principais:**
- Health: `https://seu-projeto.railway.app/health`
- Swagger: `https://seu-projeto.railway.app/api/docs`
- API: `https://seu-projeto.railway.app/api/...`

---

## 📞 Suporte

Para problemas:
1. Verifique logs no Railway
2. Teste localmente primeiro
3. Verifique variáveis de ambiente
4. Consulte documentação do Railway

---

**Boa sorte com o deploy! 🚀**
