# API de Login sem Senha (OTP) - Guia de Integração

## Visão Geral

O sistema de login sem senha funciona em **2 etapas**:

1. **Solicitar Código**: Usuário informa email OU telefone → Sistema gera código de 6 dígitos → Envia por email/SMS
2. **Verificar Código**: Usuário informa código → Sistema valida → Retorna token JWT

---

## Endpoints

### 1. Solicitar Código OTP

**POST** `/api/auth/request-login-code`

#### Request Body

```json
{
  "identifier": "usuario@exemplo.com",
  "identifierType": "email"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `identifier` | `string` | ✅ | Email ou telefone do usuário |
| `identifierType` | `"email"` \| `"phone"` | ✅ | Tipo do identificador |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Se o email estiver cadastrado, você receberá um código de verificação em alguns minutos.",
  "identifierType": "email"
}
```

> ⚠️ **Segurança**: Por segurança, sempre retorna sucesso mesmo se o usuário não existir.

#### Erros Possíveis

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `INVALID_INPUT` | Dados inválidos (email/telefone mal formatado) |
| 429 | `TOO_MANY_REQUESTS` | Muitas solicitações ou usuário bloqueado |

---

### 2. Verificar Código OTP e Fazer Login

**POST** `/api/auth/verify-login-code`

#### Request Body

```json
{
  "identifier": "usuario@exemplo.com",
  "identifierType": "email",
  "code": "123456"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `identifier` | `string` | ✅ | Email ou telefone do usuário |
| `identifierType` | `"email"` \| `"phone"` | ✅ | Tipo do identificador |
| `code` | `string` | ✅ | Código de 6 dígitos |

#### Response (200 OK - Sucesso)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "helena": {
      "userId": "helena-user-id",
      "accessToken": "helena-access-token",
      "tenantId": "tenant-id",
      "expiresIn": "8h",
      "refreshToken": "refresh-token",
      "urlRedirect": "https://..."
    },
    "user": {
      "id": "uuid-do-usuario",
      "name": "João Silva",
      "phone": "5531999999999",
      "email": "usuario@exemplo.com"
    }
  },
  "message": "Login realizado com sucesso"
}
```

#### Response (400 - Código Incorreto)

```json
{
  "success": false,
  "error": "Código inválido ou expirado",
  "attemptsRemaining": 3
}
```

#### Erros Possíveis

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `INVALID_INPUT` | Código inválido, expirado ou formato incorreto |
| 429 | `TOO_MANY_REQUESTS` | Usuário bloqueado por muitas tentativas |
| 502 | `BAD_GATEWAY` | Erro na comunicação com API Helena |

---

## Regras de Segurança

### Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `request-login-code` | 5 requisições por 5 minutos |
| `verify-login-code` | 10 requisições por 15 minutos |

### Bloqueio por Tentativas

- Após **5 tentativas incorretas** de código, o usuário é bloqueado por **15 minutos**
- O campo `attemptsRemaining` na resposta indica quantas tentativas restam

### Expiração do Código

- O código OTP expira em **5 minutos**
- Após expiração, o usuário precisa solicitar um novo código

---

## Exemplo de Integração (Frontend React)

### Service

```typescript
// src/services/authService.ts

const API_URL = 'https://seu-backend.com/api';

interface RequestLoginCodeResponse {
  success: boolean;
  message: string;
  identifierType: 'email' | 'phone';
}

interface VerifyLoginCodeResponse {
  success: boolean;
  data?: {
    token: string;
    helena: {
      accessToken: string;
      userId: string;
      tenantId: string;
    };
    user: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
  };
  error?: string;
  attemptsRemaining?: number;
}

// Etapa 1: Solicitar código
export const requestLoginCode = async (
  identifier: string,
  identifierType: 'email' | 'phone'
): Promise<RequestLoginCodeResponse> => {
  const response = await fetch(`${API_URL}/auth/request-login-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, identifierType })
  });
  return response.json();
};

// Etapa 2: Verificar código e fazer login
export const verifyLoginCode = async (
  identifier: string,
  identifierType: 'email' | 'phone',
  code: string
): Promise<VerifyLoginCodeResponse> => {
  const response = await fetch(`${API_URL}/auth/verify-login-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identifier, 
      identifierType, 
      code: code.replace(/\D/g, '') // Remover caracteres não numéricos
    })
  });
  return response.json();
};
```

### Componente de Login

```tsx
// src/components/LoginOTP.tsx
import { useState } from 'react';
import { requestLoginCode, verifyLoginCode } from '../services/authService';

export const LoginOTP = () => {
  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Etapa 1: Solicitar código
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await requestLoginCode(identifier, identifierType);
      
      if (result.success) {
        setStep('code');
      } else {
        setError('Erro ao solicitar código');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Verificar código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyLoginCode(identifier, identifierType, code);
      
      if (result.success && result.data) {
        // Salvar token e redirecionar
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Código inválido');
        setAttemptsRemaining(result.attemptsRemaining ?? null);
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'identifier') {
    return (
      <form onSubmit={handleRequestCode}>
        <h2>Login</h2>
        
        <div>
          <label>
            <input
              type="radio"
              value="email"
              checked={identifierType === 'email'}
              onChange={() => setIdentifierType('email')}
            />
            Email
          </label>
          <label>
            <input
              type="radio"
              value="phone"
              checked={identifierType === 'phone'}
              onChange={() => setIdentifierType('phone')}
            />
            Telefone
          </label>
        </div>

        <input
          type={identifierType === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={identifierType === 'email' ? 'seu@email.com' : '31999999999'}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Receber Código'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode}>
      <h2>Digite o código</h2>
      <p>Enviamos um código de 6 dígitos para {identifier}</p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        maxLength={6}
        required
      />

      {error && (
        <p style={{ color: 'red' }}>
          {error}
          {attemptsRemaining !== null && ` (${attemptsRemaining} tentativas restantes)`}
        </p>
      )}

      <button type="submit" disabled={loading || code.length !== 6}>
        {loading ? 'Verificando...' : 'Entrar'}
      </button>

      <button type="button" onClick={() => { setStep('identifier'); setCode(''); }}>
        Voltar
      </button>
    </form>
  );
};
```

---

## Webhook de Envio do Código OTP

O código OTP é enviado automaticamente para o webhook fixo:

```
https://webhook.labfy.co/webhook/9c45b8e2-75c6-42e6-90d8-954182243673
```

### Payload enviado ao Webhook

```json
{
  "email": "usuario@exemplo.com",
  "phone": "5531999999999",
  "userName": "João Silva",
  "userId": "uuid-do-usuario",
  "code": "123456",
  "expiresAt": "2024-01-15T10:05:00.000Z",
  "identifierType": "email",
  "type": "login_otp",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Campos do Payload

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | `string \| null` | Email do usuário (se houver) |
| `phone` | `string` | Telefone do usuário |
| `userName` | `string` | Nome do usuário |
| `userId` | `string` | ID único do usuário |
| `code` | `string` | Código OTP de 6 dígitos |
| `expiresAt` | `string` | Data/hora de expiração (ISO 8601) |
| `identifierType` | `"email" \| "phone"` | Tipo de identificador usado |
| `type` | `string` | Tipo de OTP (`login_otp`) |
| `timestamp` | `string` | Data/hora do envio (ISO 8601) |

> O n8n pode usar o campo `identifierType` para decidir se envia por email ou SMS.

---

## Migração do Banco de Dados

Execute o script SQL para adicionar os campos OTP:

```sql
-- Execute no Supabase SQL Editor
ALTER TABLE public.users_dashcrmatendebot
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6) NULL,
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_locked_until TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_dashcrm_otp_code 
ON public.users_dashcrmatendebot(otp_code) 
WHERE otp_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_dashcrm_otp_expiry 
ON public.users_dashcrmatendebot(otp_expiry) 
WHERE otp_expiry IS NOT NULL;
```

---

## Fluxo Resumido

```
┌─────────────────────────────────────────────────────────────────┐
│                      ETAPA 1: SOLICITAR CÓDIGO                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Usuário informa email OU telefone                           │
│  2. Frontend chama POST /api/auth/request-login-code            │
│  3. Backend gera código de 6 dígitos                            │
│  4. Código salvo no banco (expira em 5 min)                     │
│  5. Webhook envia código por email/SMS                          │
│  6. Resposta: "Código enviado" (sempre sucesso por segurança)   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ETAPA 2: VERIFICAR CÓDIGO                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Usuário digita código de 6 dígitos                          │
│  2. Frontend chama POST /api/auth/verify-login-code             │
│  3. Backend valida código (não expirado, corresponde)           │
│  4. Se válido: autentica na Helena + gera JWT                   │
│  5. Limpa código do banco                                       │
│  6. Resposta: token + dados do usuário                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testando a API

### Via cURL

```bash
# Etapa 1: Solicitar código
curl -X POST http://localhost:3000/api/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{"identifier": "seu@email.com", "identifierType": "email"}'

# Etapa 2: Verificar código
curl -X POST http://localhost:3000/api/auth/verify-login-code \
  -H "Content-Type: application/json" \
  -d '{"identifier": "seu@email.com", "identifierType": "email", "code": "123456"}'
```

### Via Swagger

Acesse: `http://localhost:3000/api/docs`

---

## Troubleshooting

### Código não está sendo enviado

1. Verifique os logs do servidor para ver se o webhook está sendo chamado
2. Verifique se o webhook `https://webhook.labfy.co/webhook/9c45b8e2-75c6-42e6-90d8-954182243673` está ativo
3. Confirme que o n8n está processando o payload corretamente

### "Muitas tentativas. Aguarde X minutos"

- Usuário foi bloqueado após 5 tentativas incorretas
- Aguarde 15 minutos ou limpe `otp_locked_until` no banco

### "Código inválido ou expirado"

- Código expirou (5 minutos)
- Código já foi usado
- Código digitado incorretamente

---

## Campos Adicionados ao Banco

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `otp_code` | `VARCHAR(6)` | Código OTP de 6 dígitos |
| `otp_expiry` | `TIMESTAMPTZ` | Data/hora de expiração |
| `otp_attempts` | `INTEGER` | Contador de tentativas |
| `otp_locked_until` | `TIMESTAMPTZ` | Bloqueio temporário |

