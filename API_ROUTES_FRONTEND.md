# 📚 Documentação de Rotas da API - Frontend

## 🔐 Base URL
```
Desenvolvimento: http://localhost:3000
Produção: https://seu-backend.railway.app
```

---

## 🔑 Autenticação

### POST `/api/auth/login`
Realiza login do cliente via telefone ou email.

**Autenticação:** ❌ Não requerida

**Rate Limit:** 10 tentativas por 15 minutos

**Request Body:**
```json
{
  "phone": "31999999999",  // Opcional (string, 10-15 caracteres)
  "email": "[email protected]"  // Opcional (string, email válido)
}
```
**Nota:** Pelo menos um dos campos (`phone` ou `email`) deve ser enviado.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "helena": {
      "accessToken": "pn_SjAWbv2gy8fBGvhBK780UEkE0fyp7oTfWLIAnwzI1k",
      "userId": "0fcbe461-b9dc-4731-be3a-0619cac93a10",
      "tenantId": "986ca29e-a041-46c2-b533-e08cd504439c"
    },
    "user": {
      "id": "uuid-do-usuario",
      "name": "Nome do Usuário",
      "phone": "31999999999"
    }
  },
  "message": "Login realizado com sucesso"
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Dados inválidos",
  "code": "INVALID_INPUT",
  "details": [...]
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Telefone/email não encontrado ou inativo",
  "code": "UNAUTHORIZED"
}
```

**Exemplo de uso:**
```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '31999999999'
    // ou email: '[email protected]'
  })
})

const data = await response.json()
// Salvar data.data.token no localStorage/sessionStorage
```

---

## 📊 Rotas CRM

**Autenticação:** ✅ **Todas as rotas CRM requerem Bearer Token**

**Rate Limit:** 60 requisições por minuto

**Header obrigatório:**
```typescript
{
  'Authorization': `Bearer ${token}` // Token obtido do login
}
```

---

### 1. GET `/api/crm/panels`
Lista todos os painéis CRM do usuário autenticado.

**Query Parameters:** Nenhum

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "fa8c96c0-db47-42f4-9f83-d1e257ab4a11",
        "name": "Nome do Painel",
        "description": "Descrição do painel",
        "createdAt": "2025-12-03T16:27:34.767015Z",
        "updatedAt": "2025-12-03T17:03:50.343603Z",
        "steps": [
          {
            "id": "4645a498-48b7-4d27-84dd-74d90fed09f6",
            "title": "Nome do Step",
            "phase": "phase-name",
            "position": 1
          }
        ]
      }
    ],
    "totalItems": 1
  },
  "message": "Painéis listados com sucesso"
}
```

---

### 2. GET `/api/crm/panels/:id`
Obtém detalhes de um painel específico.

**Path Parameters:**
- `id` (string, obrigatório): ID do painel

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "fa8c96c0-db47-42f4-9f83-d1e257ab4a11",
    "name": "Nome do Painel",
    "description": "Descrição do painel",
    "createdAt": "2025-12-03T16:27:34.767015Z",
    "updatedAt": "2025-12-03T17:03:50.343603Z",
    "steps": [...]
  },
  "message": "Painel encontrado com sucesso"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Painel não encontrado",
  "code": "NOT_FOUND"
}
```

---

### 3. GET `/api/crm/cards`
Lista cards com filtros opcionais.

**Query Parameters:**
- `panelId` (string, **obrigatório**): ID do painel
- `startDate` (string, opcional): Data inicial (ISO 8601) - ex: `2025-12-01T00:00:00Z`
- `endDate` (string, opcional): Data final (ISO 8601) - ex: `2025-12-31T23:59:59Z`
- `userId` (string, opcional): Filtrar por ID do usuário responsável
- `channelId` (string, opcional): Filtrar por canal
- `stepId` (string, opcional): Filtrar por step do painel
- `page` (number, opcional): Número da página (padrão: 1)
- `pageSize` (number, opcional): Itens por página (padrão: 100, máximo: 1000)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "637cb0d0-75ee-4e7c-8574-15e299637de6",
        "title": "Título do Card",
        "key": "ATEN-62",
        "number": 62,
        "panelId": "fa8c96c0-db47-42f4-9f83-d1e257ab4a11",
        "panelTitle": null,
        "stepId": "4645a498-48b7-4d27-84dd-74d90fed09f6",
        "stepTitle": null,
        "stepPhase": null,
        "position": 1,
        "description": "Descrição do card",
        "monetaryAmount": null,
        "isOverdue": false,
        "dueDate": null,
        "archived": false,
        "createdAt": "2025-12-03T16:27:34.767015Z",
        "updatedAt": "2025-12-03T17:03:50.343603Z",
        "responsibleUserId": "0fcbe461-b9dc-4731-be3a-0619cac93a10",
        "responsibleUser": null,
        "contactIds": ["f811001b-3944-43ae-99ac-097bd1b5286b"],
        "contacts": [],
        "companyId": "986ca29e-a041-46c2-b533-e08cd504439c",
        "tagIds": ["f7ffdfd9-a7ee-46c3-89df-be72da0523dc"],
        "sessionId": null,
        "customFields": null,
        "metadata": null
      }
    ],
    "pagination": {
      "totalItems": 7,
      "totalPages": 1,
      "pageNumber": 1,
      "pageSize": 15
    }
  },
  "message": "Cards listados com sucesso"
}
```

**Exemplo de uso:**
```typescript
const params = new URLSearchParams({
  panelId: 'fa8c96c0-db47-42f4-9f83-d1e257ab4a11',
  page: '1',
  pageSize: '15'
})

const response = await fetch(`http://localhost:3000/api/crm/cards?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

### 4. GET `/api/crm/cards/:id`
Obtém detalhes de um card específico.

**Path Parameters:**
- `id` (string, obrigatório): ID do card

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "637cb0d0-75ee-4e7c-8574-15e299637de6",
    "title": "Título do Card",
    // ... todos os campos do card
  },
  "message": "Card encontrado com sucesso"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Card não encontrado",
  "code": "NOT_FOUND"
}
```

---

### 5. GET `/api/crm/agents`
Lista agentes/responsáveis de um painel específico.

**Query Parameters:**
- `panelId` (string, **obrigatório**): ID do painel

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f29f2d5e-6857-49f0-9543-83402ff2ec70",
        "createdAt": "2025-02-20T20:00:30.253097Z",
        "updatedAt": "2025-10-30T16:22:41.321897Z",
        "companyId": "986ca29e-a041-46c2-b533-e08cd504439c",
        "userId": "0fcbe461-b9dc-4731-be3a-0619cac93a10",
        "name": "Jhonatan",
        "shortName": "Jhon",
        "email": "jhonatandasilva2405@gmail.com",
        "phoneNumber": "+55|34991882622",
        "phoneNumberFormatted": "(34) 99188-2622",
        "profile": "ADMIN",
        "isOwner": true,
        "departments": [
          {
            "agentId": "00000000-0000-0000-0000-000000000000",
            "departmentId": "120505c5-eea6-4f0a-bb51-5073b9a5f2d1",
            "isAgent": true,
            "isSupervisor": true
          }
        ]
      }
    ],
    "totalItems": 1
  },
  "message": "Agentes listados com sucesso"
}
```

**Exemplo de uso:**
```typescript
const response = await fetch(
  `http://localhost:3000/api/crm/agents?panelId=fa8c96c0-db47-42f4-9f83-d1e257ab4a11`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
)
```

---

### 6. GET `/api/crm/agents/:id`
Obtém detalhes de um agente/atendente específico.

**Path Parameters:**
- `id` (string, obrigatório): ID do agente (userId)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "f29f2d5e-6857-49f0-9543-83402ff2ec70",
    "userId": "0fcbe461-b9dc-4731-be3a-0619cac93a10",
    "name": "Jhonatan",
    "shortName": "Jhon",
    "email": "jhonatandasilva2405@gmail.com",
    "phoneNumber": "+55|34991882622",
    "phoneNumberFormatted": "(34) 99188-2622",
    "profile": "ADMIN",
    "isOwner": true,
    "departments": [...]
  },
  "message": "Agente encontrado com sucesso"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Agente não encontrado",
  "code": "NOT_FOUND"
}
```

---

## 📝 Códigos de Erro Comuns

```typescript
enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',        // 400
  UNAUTHORIZED = 'UNAUTHORIZED',          // 401
  FORBIDDEN = 'FORBIDDEN',                // 403
  NOT_FOUND = 'NOT_FOUND',                // 404
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS', // 429
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR' // 500
}
```

---

## 🔧 Exemplo de Cliente HTTP (TypeScript/JavaScript)

```typescript
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro na requisição')
    }

    return response.json()
  }

  // Auth
  async login(phone?: string, email?: string) {
    const data = await this.request<{
      success: boolean
      data: {
        token: string
        helena: {
          accessToken: string
          userId: string
          tenantId: string
        }
        user: {
          id: string
          name: string
          phone: string
        }
      }
      message: string
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, email })
    })

    if (data.success && data.data.token) {
      this.setToken(data.data.token)
    }

    return data
  }

  // CRM - Panels
  async getPanels() {
    return this.request('/api/crm/panels')
  }

  async getPanelById(id: string) {
    return this.request(`/api/crm/panels/${id}`)
  }

  // CRM - Cards
  async getCards(params: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
    stepId?: string
    page?: number
    pageSize?: number
  }) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value))
      }
    })
    return this.request(`/api/crm/cards?${query}`)
  }

  async getCardById(id: string) {
    return this.request(`/api/crm/cards/${id}`)
  }

  // CRM - Agents
  async getAgents(panelId: string) {
    return this.request(`/api/crm/agents?panelId=${panelId}`)
  }

  async getAgentById(id: string) {
    return this.request(`/api/crm/agents/${id}`)
  }
}

// Uso
const api = new ApiClient('http://localhost:3000')

// Login
const loginData = await api.login('31999999999')
console.log('Token:', loginData.data.token)

// Buscar painéis
const panels = await api.getPanels()
console.log('Painéis:', panels.data.items)

// Buscar cards
const cards = await api.getCards({
  panelId: 'fa8c96c0-db47-42f4-9f83-d1e257ab4a11',
  page: 1,
  pageSize: 15
})
console.log('Cards:', cards.data.items)

// Buscar agentes
const agents = await api.getAgents('fa8c96c0-db47-42f4-9f83-d1e257ab4a11')
console.log('Agentes:', agents.data.items)
```

---

## 📌 Notas Importantes

1. **Token JWT**: Após o login, salve o token e inclua no header `Authorization: Bearer {token}` em todas as requisições CRM
2. **Rate Limits**: 
   - Login: 10 tentativas por 15 minutos
   - CRM: 60 requisições por minuto
3. **CORS**: Configure a origem permitida no backend se necessário
4. **ResponsibleUser**: Nos cards, o campo `responsibleUser` pode vir como `null`, mas o `responsibleUserId` sempre estará presente
5. **Paginação**: Use `page` e `pageSize` para paginar resultados grandes (máximo `pageSize: 1000`)

---

## 🚀 Documentação Interativa

Acesse a documentação Swagger completa em:
- **Desenvolvimento**: `http://localhost:3000/api/docs`
- **Produção**: `https://seu-backend.railway.app/api/docs`

