# 🚂 Deploy no Railway - dashCRMAtendebot Backend

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório Git (GitHub, GitLab, etc.)
3. Token da API Helena configurado

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
JWT_SECRET=seu-jwt-secret-super-seguro-para-producao
HELENA_API_URL=https://api.flw.chat
HELENA_TOKENS=[{"clientId":"maxchip","token":"pn_seu_token_aqui"}]
CLIENTS_CONFIG=[{"clientId":"maxchip","name":"MaxChip Telecom","email":"contato@maxchip.com","passwordHash":"$2b$10$hash_gerado_com_bcrypt"}]
CACHE_TTL=300000
```

#### Opcionais (mas recomendadas):

```env
CORS_ORIGINS=https://seu-frontend.railway.app,https://seu-dominio.com
```

### 4. Gerar Hash de Senha para Produção

Para gerar o hash bcrypt da senha do cliente:

```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('senha-do-cliente',10).then(h=>console.log(h));"
```

Substitua `'senha-do-cliente'` pela senha real que o cliente usará para fazer login.

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

# Teste de Login
curl -X POST https://seu-projeto.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contato@maxchip.com","password":"senha-do-cliente"}'
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
railway variables set JWT_SECRET=seu-secret
railway variables set HELENA_TOKENS='[{"clientId":"maxchip","token":"pn_..."}]'
# ... etc
```

---

## 📝 Checklist de Deploy

- [ ] Código commitado e pushado
- [ ] Projeto criado no Railway
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Hash bcrypt da senha gerado
- [ ] `JWT_SECRET` definido (senha forte)
- [ ] `HELENA_TOKENS` configurado (JSON válido)
- [ ] `CLIENTS_CONFIG` configurado (JSON válido)
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

**Erro:** `Token Helena não encontrado`
- **Solução:** Verifique se `HELENA_TOKENS` está no formato JSON válido
- **Solução:** Verifique se `clientId` corresponde ao cliente configurado

**Erro:** `JWT_SECRET is not defined`
- **Solução:** Adicione a variável `JWT_SECRET` no Railway

**Erro:** CORS error no frontend
- **Solução:** Adicione a URL do frontend em `CORS_ORIGINS`

---

## 🔒 Segurança

### Variáveis Sensíveis

Nunca commite no Git:
- ❌ `.env`
- ❌ `JWT_SECRET`
- ❌ `HELENA_TOKENS`
- ❌ `CLIENTS_CONFIG` (com senhas reais)

Use apenas variáveis de ambiente do Railway para produção.

### Recomendações

1. ✅ Use `JWT_SECRET` forte (mínimo 32 caracteres aleatórios)
2. ✅ Use senhas fortes para clientes
3. ✅ Configure `CORS_ORIGINS` apenas com URLs confiáveis
4. ✅ Habilite logs no Railway para monitoramento
5. ✅ Configure alertas para downtime

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

