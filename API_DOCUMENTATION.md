# Documentação API - dashCRMAtendebot_back

## Visão Geral

API intermediária entre a plataforma Helena/flw.chat e o dashboard CRM frontend. Esta API serve para:

1. **Segurança**: Ocultar tokens de autenticação do frontend
2. **Transformação**: Agregar e transformar dados da API Helena para métricas do dashboard
3. **Performance**: Cache e otimização de requisições
4. **Flexibilidade**: Adicionar lógica de negócio sem modificar o frontend

---

## Arquitetura Seguindo Padrão "Barbeiro Inteligente"

```
src/
├── config/
│   ├── helena.ts           # Configuração da API Helena (URL, tokens por cliente)
│   └── supabase.ts         # Opcional: para cache/persistência
├── features/
│   ├── crm/
│   │   ├── crmRoutes.ts
│   │   ├── crmController.ts
│   │   ├── crmService.ts
│   │   ├── helenaClient.ts    # Client HTTP para API Helena
│   │   └── types.ts
│   ├── metrics/
│   │   ├── metricsRoutes.ts
│   │   ├── metricsController.ts
│   │   ├── metricsService.ts
│   │   └── types.ts
│   └── auth/
│       ├── authRoutes.ts
│       ├── authController.ts
│       ├── authService.ts
│       └── types.ts
├── middleware/
│   ├── auth.middleware.ts     # Validação JWT do cliente
│   └── clientContext.middleware.ts  # Carrega token Helena do cliente
├── types/
│   └── index.ts
├── utils/
│   ├── calculations.ts        # Funções de cálculo de métricas
│   └── cache.ts              # Gerenciamento de cache
└── server.ts
```

---

## Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT (autenticação dos clientes do dashboard)
JWT_SECRET=seu-jwt-secret-super-seguro

# API Helena/flw.chat
HELENA_API_URL=https://api.flw.chat

# Tokens por cliente (format: CLIENT_ID:TOKEN)
HELENA_TOKENS='[
  {"clientId": "maxchip", "token": "pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk"},
  {"clientId": "outro-cliente", "token": "pn_outro_token..."}
]'

# Opcional: Supabase para cache/persistência
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cache
CACHE_TTL=300000  # 5 minutos em ms
```

---

## Autenticação

### Fluxo de Autenticação

1. **Cliente faz login** → API retorna JWT com `clientId`
2. **Cliente faz requisições** → Envia `Authorization: Bearer <jwt>`
3. **API valida JWT** → Extrai `clientId`
4. **API busca token Helena** → Usa token específico do cliente
5. **API chama Helena** → Retorna dados transformados

### Estrutura do JWT

```typescript
{
  clientId: 'maxchip',
  name: 'MaxChip Telecom',
  email: 'contato@maxchip.com',
  role: 'client',
  iat: 1234567890,
  exp: 1234567890
}
```

---

## Endpoints da API

### 📊 1. Autenticação

#### POST `/api/auth/login`

Login do cliente para acessar o dashboard.

**Request:**
```json
{
  "email": "contato@maxchip.com",
  "password": "senha-segura"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "client": {
      "id": "maxchip",
      "name": "MaxChip Telecom",
      "email": "contato@maxchip.com"
    }
  },
  "message": "Login realizado com sucesso"
}
```

---

### 📋 2. Painéis (Panels)

#### GET `/api/crm/panels`

Lista todos os painéis CRM disponíveis.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "panel-uuid-123",
        "name": "Atendimento",
        "description": "Painel de atendimento ao cliente",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "totalItems": 1
  }
}
```

**Implementação:**
- Buscar da Helena API: `GET /crm/v1/panel`
- Usar token do cliente autenticado

---

#### GET `/api/crm/panels/:id`

Detalhes de um painel específico (inclui etapas/steps).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "panel-uuid-123",
    "name": "Atendimento",
    "description": "Painel de atendimento ao cliente",
    "steps": [
      {
        "id": "step-uuid-1",
        "title": "Novo Lead",
        "phase": "lead",
        "position": 0
      },
      {
        "id": "step-uuid-2",
        "title": "Em Negociação",
        "phase": "negotiation",
        "position": 1
      },
      {
        "id": "step-uuid-3",
        "title": "Fechado",
        "phase": "closed",
        "position": 2
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Implementação:**
- Buscar da Helena API: `GET /crm/v1/panel/:id`

---

### 🎴 3. Cards (Leads/Oportunidades)

#### GET `/api/crm/cards`

Lista cards com filtros.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial (ISO 8601)
- `endDate` (string, opcional): Data final (ISO 8601)
- `userId` (string, opcional): Filtrar por vendedor/responsável
- `channelId` (string, opcional): Filtrar por canal
- `stepId` (string, opcional): Filtrar por etapa
- `page` (number, opcional): Página (default: 1)
- `pageSize` (number, opcional): Itens por página (default: 100)

**Exemplo:**
```
GET /api/crm/cards?panelId=panel-uuid-123&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "card-uuid-1",
        "title": "Lead MaxChip - João Silva",
        "key": "CARD-001",
        "number": 1,
        "panelId": "panel-uuid-123",
        "panelTitle": "Atendimento",
        "stepId": "step-uuid-1",
        "stepTitle": "Novo Lead",
        "stepPhase": "lead",
        "position": 0,
        "description": "Interessado em plano empresarial",
        "monetaryAmount": 1500.00,
        "isOverdue": false,
        "dueDate": "2024-02-15T23:59:59Z",
        "archived": false,
        "createdAt": "2024-01-10T08:30:00Z",
        "updatedAt": "2024-01-12T14:20:00Z",
        "responsibleUserId": "user-uuid-1",
        "responsibleUser": {
          "id": "user-uuid-1",
          "name": "Vendedor 1",
          "email": "vendedor1@maxchip.com"
        },
        "contactIds": ["contact-uuid-1"],
        "contacts": [
          {
            "id": "contact-uuid-1",
            "name": "João Silva",
            "phone": "+5511999999999",
            "email": "joao@empresa.com"
          }
        ],
        "companyId": "maxchip",
        "tagIds": ["tag-1", "tag-2"],
        "sessionId": null,
        "customFields": {},
        "metadata": {}
      }
    ],
    "totalItems": 45,
    "totalPages": 1,
    "pageNumber": 1,
    "pageSize": 100
  }
}
```

**Implementação:**
- Buscar da Helena API: `GET /crm/v1/panel/card?panelId=...&startDate=...&endDate=...`
- Enriquecer dados se necessário (responsibleUser, contacts)

---

#### GET `/api/crm/cards/:id`

Detalhes de um card específico.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card-uuid-1",
    "title": "Lead MaxChip - João Silva",
    // ... todos os campos do card
    "history": [
      {
        "timestamp": "2024-01-10T08:30:00Z",
        "action": "created",
        "user": "Vendedor 1",
        "details": "Card criado"
      },
      {
        "timestamp": "2024-01-12T14:20:00Z",
        "action": "moved",
        "user": "Vendedor 1",
        "details": "Movido de 'Novo Lead' para 'Em Negociação'"
      }
    ]
  }
}
```

**Implementação:**
- Buscar da Helena API: `GET /crm/v1/panel/card/:id`

---

### 👥 4. Usuários/Vendedores

#### GET `/api/crm/users`

Lista usuários/vendedores.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user-uuid-1",
        "name": "Vendedor 1",
        "email": "vendedor1@maxchip.com",
        "role": "seller"
      },
      {
        "id": "user-uuid-2",
        "name": "Vendedor 2",
        "email": "vendedor2@maxchip.com",
        "role": "seller"
      }
    ],
    "totalItems": 2
  }
}
```

**Implementação:**
- **Opção 1**: Extrair de cards (responsibleUser)
- **Opção 2**: Se Helena tiver rota de usuários, consumir: `GET /core/public/v1/user`
- **Opção 3**: Manter tabela local com usuários do cliente

---

### 📞 5. Canais

#### GET `/api/crm/channels`

Lista canais de comunicação.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "meta",
        "name": "Meta (Facebook/Instagram)",
        "type": "meta"
      },
      {
        "id": "google",
        "name": "Google Ads",
        "type": "google"
      },
      {
        "id": "whatsapp",
        "name": "WhatsApp",
        "type": "whatsapp"
      }
    ],
    "totalItems": 3
  }
}
```

**Implementação:**
- **Opção 1**: Extrair de cards (campo channel)
- **Opção 2**: Se Helena tiver rota de canais, consumir
- **Opção 3**: Lista estática configurável por cliente

---

### 📊 6. Métricas do Funil

#### GET `/api/crm/metrics/funnel`

Métricas agregadas do funil de vendas.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `userId` (string, opcional): Filtrar por vendedor
- `channelId` (string, opcional): Filtrar por canal

**Response:**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "stage": "Novo Lead",
        "stageId": "step-uuid-1",
        "leads": 120,
        "value": 180000.00,
        "conversionRate": 100.0,
        "averageTime": 2.5
      },
      {
        "stage": "Em Negociação",
        "stageId": "step-uuid-2",
        "leads": 45,
        "value": 67500.00,
        "conversionRate": 37.5,
        "averageTime": 5.3
      },
      {
        "stage": "Fechado",
        "stageId": "step-uuid-3",
        "leads": 18,
        "value": 27000.00,
        "conversionRate": 40.0,
        "averageTime": 3.2
      }
    ],
    "totalLeads": 183,
    "totalValue": 274500.00,
    "overallConversionRate": 15.0,
    "forecast": 350000.00
  }
}
```

**Cálculos:**
- `leads`: Quantidade de cards na etapa
- `value`: Soma de `monetaryAmount` dos cards
- `conversionRate`: (leads da etapa atual / leads da etapa anterior) * 100
- `averageTime`: Média de dias que os cards ficam na etapa
- `forecast`: Projeção de receita (cards * valor médio * taxa de conversão)

**Implementação:**
- Buscar cards com filtros
- Agrupar por `stepId`/`stepTitle`
- Calcular métricas agregadas

---

### 💰 7. Métricas de Receita

#### GET `/api/crm/metrics/revenue`

Métricas de receita e ticket médio.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `userId` (string, opcional): Filtrar por vendedor
- `channelId` (string, opcional): Filtrar por canal

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 127500.00,
    "averageTicket": 7083.33,
    "closedDeals": 18,
    "revenueBySeller": [
      {
        "sellerId": "user-uuid-1",
        "sellerName": "Vendedor 1",
        "revenue": 85000.00,
        "deals": 12,
        "averageTicket": 7083.33
      },
      {
        "sellerId": "user-uuid-2",
        "sellerName": "Vendedor 2",
        "revenue": 42500.00,
        "deals": 6,
        "averageTicket": 7083.33
      }
    ],
    "revenueByChannel": [
      {
        "channelId": "whatsapp",
        "channelName": "WhatsApp",
        "revenue": 75000.00,
        "deals": 10
      },
      {
        "channelId": "meta",
        "channelName": "Meta",
        "revenue": 52500.00,
        "deals": 8
      }
    ]
  }
}
```

**Cálculos:**
- `totalRevenue`: Soma de `monetaryAmount` dos cards fechados
- `averageTicket`: totalRevenue / closedDeals
- Agrupar por `responsibleUserId` e canal

**Implementação:**
- Filtrar cards com status fechado
- Agrupar e somar valores

---

### 📈 8. Métricas de Conversão

#### GET `/api/crm/metrics/conversion`

Métricas de conversão e ciclo de vendas.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "overallConversionRate": 15.0,
    "averageSalesCycle": 12.5,
    "averageResponseTime": 45,
    "conversionByStage": [
      {
        "stage": "Novo Lead",
        "conversionRate": 37.5
      },
      {
        "stage": "Em Negociação",
        "conversionRate": 40.0
      }
    ]
  }
}
```

**Cálculos:**
- `overallConversionRate`: (cards fechados / total de cards) * 100
- `averageSalesCycle`: Média de dias entre `createdAt` e `updatedAt` para cards fechados
- `averageResponseTime`: Média de minutos para primeira resposta (se disponível)

---

### 📉 9. Análise de Perdas

#### GET `/api/crm/metrics/loss`

Análise de negócios perdidos.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLost": 32,
    "totalValueLost": 48000.00,
    "lossRate": 17.5,
    "lossByReason": [
      {
        "reason": "Preço alto",
        "count": 15,
        "value": 22500.00,
        "percentage": 46.9
      },
      {
        "reason": "Optou por concorrente",
        "count": 10,
        "value": 15000.00,
        "percentage": 31.2
      },
      {
        "reason": "Sem resposta",
        "count": 7,
        "value": 10500.00,
        "percentage": 21.9
      }
    ],
    "lossByStage": [
      {
        "stage": "Em Negociação",
        "count": 20,
        "value": 30000.00
      },
      {
        "stage": "Proposta Enviada",
        "count": 12,
        "value": 18000.00
      }
    ]
  }
}
```

**Implementação:**
- Filtrar cards com status "lost"/"perdido"
- Agrupar por `lostReason` e `stepId`

---

### 📅 10. Comparações Temporais

#### GET `/api/crm/metrics/temporal`

Comparação de métricas ao longo do tempo.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `period` (string): 'day', 'week', 'month', 'year' (default: 'month')
- `startDate` (string): Data inicial
- `endDate` (string): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "data": [
      {
        "period": "2024-01",
        "leads": 120,
        "value": 180000.00,
        "closedDeals": 15,
        "revenue": 22500.00,
        "conversionRate": 12.5
      },
      {
        "period": "2024-02",
        "leads": 135,
        "value": 202500.00,
        "closedDeals": 18,
        "revenue": 27000.00,
        "conversionRate": 13.3
      }
    ],
    "comparison": {
      "leadsGrowth": 12.5,
      "valueGrowth": 12.5,
      "revenueGrowth": 20.0
    }
  }
}
```

**Implementação:**
- Agrupar cards por período
- Calcular crescimento percentual

---

### 👨‍💼 11. Performance por Vendedor

#### GET `/api/crm/metrics/seller-performance`

Performance detalhada por vendedor.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [
      {
        "sellerId": "user-uuid-1",
        "sellerName": "Vendedor 1",
        "totalLeads": 75,
        "closedDeals": 12,
        "revenue": 85000.00,
        "conversionRate": 16.0,
        "averageTicket": 7083.33,
        "averageSalesCycle": 10.5,
        "activities": 245,
        "responseTime": 35
      },
      {
        "sellerId": "user-uuid-2",
        "sellerName": "Vendedor 2",
        "totalLeads": 45,
        "closedDeals": 6,
        "revenue": 42500.00,
        "conversionRate": 13.3,
        "averageTicket": 7083.33,
        "averageSalesCycle": 14.2,
        "activities": 156,
        "responseTime": 52
      }
    ],
    "ranking": [
      {
        "rank": 1,
        "sellerId": "user-uuid-1",
        "metric": "revenue",
        "value": 85000.00
      }
    ]
  }
}
```

---

### 🛍️ 12. Análise de Produto/Serviço

#### GET `/api/crm/metrics/products`

Performance por produto/serviço.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "plano-empresarial",
        "productName": "Plano Empresarial",
        "totalDeals": 25,
        "closedDeals": 10,
        "revenue": 50000.00,
        "averageTicket": 5000.00,
        "conversionRate": 40.0,
        "averageClosingTime": 8.5
      },
      {
        "productId": "plano-residencial",
        "productName": "Plano Residencial",
        "totalDeals": 95,
        "closedDeals": 8,
        "revenue": 4000.00,
        "averageTicket": 500.00,
        "conversionRate": 8.4,
        "averageClosingTime": 12.0
      }
    ]
  }
}
```

**Implementação:**
- Extrair produto de `customFields.product` ou `title`
- Agrupar e calcular métricas

---

### 📊 13. Dashboard Completo (Agregado)

#### GET `/api/crm/dashboard`

Todas as métricas agregadas em uma única chamada.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `panelId` (string, obrigatório): ID do painel
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `userId` (string, opcional): Filtrar por vendedor
- `channelId` (string, opcional): Filtrar por canal

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLeads": 183,
      "totalValue": 274500.00,
      "closedDeals": 18,
      "totalRevenue": 127500.00,
      "conversionRate": 15.0,
      "averageTicket": 7083.33
    },
    "funnel": {
      // ... dados do funil
    },
    "revenue": {
      // ... dados de receita
    },
    "conversion": {
      // ... dados de conversão
    },
    "loss": {
      // ... dados de perdas
    },
    "sellers": {
      // ... performance por vendedor
    }
  }
}
```

**Implementação:**
- Buscar cards uma vez
- Calcular todas as métricas no backend
- Retornar dados pré-processados

---

## Estrutura de Código Seguindo Padrão

### 1. Helena Client (`src/features/crm/helenaClient.ts`)

```typescript
import axios, { AxiosInstance } from 'axios'

interface HelenaConfig {
  baseURL: string
  token: string
}

class HelenaClient {
  private client: AxiosInstance

  constructor(config: HelenaConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    })
  }

  async getPanels() {
    const { data } = await this.client.get('/crm/v1/panel')
    return data
  }

  async getPanelById(panelId: string) {
    const { data } = await this.client.get(`/crm/v1/panel/${panelId}`)
    return data
  }

  async getCards(params: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const { data } = await this.client.get('/crm/v1/panel/card', { params })
    return data
  }

  async getCardById(cardId: string) {
    const { data } = await this.client.get(`/crm/v1/panel/card/${cardId}`)
    return data
  }

  async getContacts(params?: {
    startDate?: string
    endDate?: string
    channelId?: string
  }) {
    const { data } = await this.client.get('/core/public/v1/contact', { params })
    return data
  }
}

export default HelenaClient
```

---

### 2. CRM Service (`src/features/crm/crmService.ts`)

```typescript
import HelenaClient from './helenaClient'
import { getHelenaToken } from '../../config/helena'
import type { Card, Panel } from './types'

export class CrmService {
  private getClient(clientId: string): HelenaClient {
    const token = getHelenaToken(clientId)
    return new HelenaClient({
      baseURL: process.env.HELENA_API_URL!,
      token
    })
  }

  async getPanels(clientId: string) {
    const client = this.getClient(clientId)
    return await client.getPanels()
  }

  async getPanelById(clientId: string, panelId: string) {
    const client = this.getClient(clientId)
    return await client.getPanelById(panelId)
  }

  async getCards(clientId: string, filters: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const client = this.getClient(clientId)
    const response = await client.getCards(filters)
    
    // Enriquecer dados se necessário
    return response
  }

  async getCardById(clientId: string, cardId: string) {
    const client = this.getClient(clientId)
    return await client.getCardById(cardId)
  }
}
```

---

### 3. CRM Controller (`src/features/crm/crmController.ts`)

```typescript
import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { CrmService } from './crmService'
import { 
  createSuccessResponse, 
  createErrorResponse, 
  ErrorCode 
} from '../../types'
import type { AuthRequest } from '../../middleware/auth.middleware'

export default class CrmController {
  private service = new CrmService()

  /**
   * @swagger
   * /api/crm/panels:
   *   get:
   *     summary: Lista painéis CRM
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de painéis
   */
  getPanels = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(
          createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED)
        )
      }

      const panels = await this.service.getPanels(clientId)

      return res.status(200).json(
        createSuccessResponse(panels, 'Painéis listados com sucesso')
      )
    } catch (error) {
      console.error('Erro ao listar painéis:', error)
      return res.status(500).json(
        createErrorResponse(
          'Erro ao buscar painéis',
          ErrorCode.INTERNAL_SERVER_ERROR
        )
      )
    }
  }

  /**
   * @swagger
   * /api/crm/cards:
   *   get:
   *     summary: Lista cards com filtros
   *     tags: [CRM]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: panelId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Lista de cards
   */
  getCards = async (req: AuthRequest, res: Response) => {
    try {
      const clientId = req.context?.user?.id

      if (!clientId) {
        return res.status(401).json(
          createErrorResponse('Cliente não autenticado', ErrorCode.UNAUTHORIZED)
        )
      }

      const { panelId, startDate, endDate, userId, channelId } = req.query

      if (!panelId) {
        return res.status(400).json(
          createErrorResponse('panelId é obrigatório', ErrorCode.INVALID_INPUT)
        )
      }

      const cards = await this.service.getCards(clientId, {
        panelId: panelId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: userId as string,
        channelId: channelId as string
      })

      return res.status(200).json(
        createSuccessResponse(cards, 'Cards listados com sucesso')
      )
    } catch (error) {
      console.error('Erro ao listar cards:', error)
      return res.status(500).json(
        createErrorResponse(
          'Erro ao buscar cards',
          ErrorCode.INTERNAL_SERVER_ERROR
        )
      )
    }
  }
}
```

---

### 4. Metrics Service (`src/features/metrics/metricsService.ts`)

```typescript
import { CrmService } from '../crm/crmService'
import type { Card } from '../crm/types'
import type { 
  FunnelMetrics, 
  RevenueMetrics, 
  ConversionMetrics 
} from './types'

export class MetricsService {
  private crmService = new CrmService()

  async getFunnelMetrics(
    clientId: string, 
    filters: {
      panelId: string
      startDate?: string
      endDate?: string
      userId?: string
      channelId?: string
    }
  ): Promise<FunnelMetrics> {
    // Buscar cards
    const cardsResponse = await this.crmService.getCards(clientId, filters)
    const cards: Card[] = cardsResponse.items || []

    // Agrupar por etapa
    const stageMap = new Map<string, Card[]>()
    
    cards.forEach(card => {
      const stage = card.stepTitle || card.stepId || 'Sem etapa'
      const current = stageMap.get(stage) || []
      current.push(card)
      stageMap.set(stage, current)
    })

    // Calcular métricas por etapa
    const stages = Array.from(stageMap.entries()).map(([stage, stageCards]) => ({
      stage,
      stageId: stageCards[0]?.stepId,
      leads: stageCards.length,
      value: stageCards.reduce((sum, card) => sum + (card.monetaryAmount || 0), 0),
      conversionRate: 0, // Calcular depois
      averageTime: this.calculateAverageTime(stageCards)
    }))

    // Calcular taxa de conversão
    const totalLeads = cards.length
    stages.forEach((stage, index) => {
      if (index === 0) {
        stage.conversionRate = 100
      } else {
        const previousLeads = stages[index - 1].leads
        stage.conversionRate = previousLeads > 0 
          ? (stage.leads / previousLeads) * 100 
          : 0
      }
    })

    const totalValue = cards.reduce((sum, card) => sum + (card.monetaryAmount || 0), 0)
    const closedCards = cards.filter(card => 
      card.stepPhase === 'closed' || card.stepTitle?.toLowerCase().includes('fechado')
    )
    const overallConversionRate = totalLeads > 0 
      ? (closedCards.length / totalLeads) * 100 
      : 0

    return {
      stages,
      totalLeads,
      totalValue,
      overallConversionRate,
      forecast: totalValue * 1.2 // Exemplo: 20% a mais
    }
  }

  async getRevenueMetrics(
    clientId: string,
    filters: {
      panelId: string
      startDate?: string
      endDate?: string
      userId?: string
      channelId?: string
    }
  ): Promise<RevenueMetrics> {
    const cardsResponse = await this.crmService.getCards(clientId, filters)
    const cards: Card[] = cardsResponse.items || []

    // Filtrar cards fechados
    const closedCards = cards.filter(card => 
      card.stepPhase === 'closed' || card.stepTitle?.toLowerCase().includes('fechado')
    )

    const totalRevenue = closedCards.reduce(
      (sum, card) => sum + (card.monetaryAmount || 0), 
      0
    )
    const averageTicket = closedCards.length > 0 
      ? totalRevenue / closedCards.length 
      : 0

    // Agrupar por vendedor
    const revenueBySeller = this.groupBySeller(closedCards)
    
    // Agrupar por canal
    const revenueByChannel = this.groupByChannel(closedCards)

    return {
      totalRevenue,
      averageTicket,
      closedDeals: closedCards.length,
      revenueBySeller,
      revenueByChannel
    }
  }

  private calculateAverageTime(cards: Card[]): number {
    const times = cards
      .filter(card => card.createdAt && card.updatedAt)
      .map(card => {
        const created = new Date(card.createdAt!).getTime()
        const updated = new Date(card.updatedAt!).getTime()
        return (updated - created) / (1000 * 60 * 60 * 24) // dias
      })

    if (times.length === 0) return 0
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  private groupBySeller(cards: Card[]) {
    const grouped = new Map<string, { revenue: number; deals: number; name: string }>()

    cards.forEach(card => {
      const sellerId = card.responsibleUserId || 'unknown'
      const sellerName = card.responsibleUser?.name || 'Sem vendedor'
      const current = grouped.get(sellerId) || { revenue: 0, deals: 0, name: sellerName }
      
      current.revenue += card.monetaryAmount || 0
      current.deals += 1
      grouped.set(sellerId, current)
    })

    return Array.from(grouped.entries()).map(([sellerId, data]) => ({
      sellerId,
      sellerName: data.name,
      revenue: data.revenue,
      deals: data.deals,
      averageTicket: data.deals > 0 ? data.revenue / data.deals : 0
    }))
  }

  private groupByChannel(cards: Card[]) {
    // Implementação similar ao groupBySeller
    // ...
    return []
  }
}
```

---

### 5. Configuração Helena (`src/config/helena.ts`)

```typescript
import dotenv from 'dotenv'

dotenv.config()

interface HelenaToken {
  clientId: string
  token: string
}

const helenaTokens: HelenaToken[] = JSON.parse(
  process.env.HELENA_TOKENS || '[]'
)

export const getHelenaToken = (clientId: string): string => {
  const config = helenaTokens.find(t => t.clientId === clientId)
  
  if (!config) {
    throw new Error(`Token Helena não encontrado para cliente: ${clientId}`)
  }

  return config.token
}

export const helenaConfig = {
  baseURL: process.env.HELENA_API_URL || 'https://api.flw.chat'
}
```

---

### 6. Middleware de Contexto do Cliente (`src/middleware/clientContext.middleware.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

export const clientContextMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientId = req.context?.user?.id

    if (!clientId) {
      return res.status(401).json({
        success: false,
        error: 'Cliente não autenticado'
      })
    }

    // Aqui você pode buscar informações adicionais do cliente
    // do banco de dados se necessário

    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar contexto do cliente'
    })
  }
}
```

---

### 7. Rotas CRM (`src/features/crm/crmRoutes.ts`)

```typescript
import { Router } from 'express'
import { query } from 'express-validator'
import rateLimit from 'express-rate-limit'
import CrmController from './crmController'
import { authMiddleware } from '../../middleware/auth.middleware'
import { clientContextMiddleware } from '../../middleware/clientContext.middleware'

const router = Router()
const controller = new CrmController()

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60 // 60 requisições por minuto
})

// Middleware global
router.use(authMiddleware)
router.use(clientContextMiddleware)
router.use(limiter)

// Validações
const validateGetCards = [
  query('panelId').notEmpty().withMessage('panelId é obrigatório'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
]

// Rotas
router.get('/panels', controller.getPanels)
router.get('/panels/:id', controller.getPanelById)
router.get('/cards', validateGetCards, controller.getCards)
router.get('/cards/:id', controller.getCardById)

export default router
```

---

### 8. Rotas de Métricas (`src/features/metrics/metricsRoutes.ts`)

```typescript
import { Router } from 'express'
import { query } from 'express-validator'
import MetricsController from './metricsController'
import { authMiddleware } from '../../middleware/auth.middleware'
import { clientContextMiddleware } from '../../middleware/clientContext.middleware'

const router = Router()
const controller = new MetricsController()

// Middleware global
router.use(authMiddleware)
router.use(clientContextMiddleware)

// Validações
const validateMetrics = [
  query('panelId').notEmpty().withMessage('panelId é obrigatório'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
]

// Rotas
router.get('/funnel', validateMetrics, controller.getFunnelMetrics)
router.get('/revenue', validateMetrics, controller.getRevenueMetrics)
router.get('/conversion', validateMetrics, controller.getConversionMetrics)
router.get('/loss', validateMetrics, controller.getLossAnalysis)
router.get('/temporal', validateMetrics, controller.getTemporalComparison)
router.get('/seller-performance', validateMetrics, controller.getSellerPerformance)
router.get('/products', validateMetrics, controller.getProductAnalysis)

// Dashboard agregado
router.get('/dashboard', validateMetrics, controller.getDashboard)

export default router
```

---

### 9. Server Bootstrap (`src/server.ts`)

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { createServer } from 'http'

// Rotas
import authRoutes from './features/auth/authRoutes'
import crmRoutes from './features/crm/crmRoutes'
import metricsRoutes from './features/metrics/metricsRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const httpServer = createServer(app)

// Middlewares globais
app.use(helmet())
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://seu-dashboard.railway.app'
  ], 
  credentials: true 
}))

// Rate limiting global
app.use(rateLimit({ 
  windowMs: 5 * 60 * 1000, 
  max: 200 
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: { 
    openapi: '3.0.0', 
    info: { 
      title: 'dashCRMAtendebot API', 
      version: '1.0.0',
      description: 'API intermediária para dashboard CRM'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/features/**/*.ts']
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Rotas
app.use('/api/auth', authRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/metrics', metricsRoutes)

// Health endpoints
app.get('/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }))
app.get('/ready', (_, res) => res.json({ status: 'ready' }))
app.get('/live', (_, res) => res.json({ status: 'alive' }))

// 404
app.use((_, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📚 Documentação: http://localhost:${PORT}/api/docs`)
  console.log(`🏥 Health: http://localhost:${PORT}/health`)
})
```

---

## Otimizações e Boas Práticas

### 1. Cache

Implementar cache em memória ou Redis para:
- Painéis (TTL: 5 minutos)
- Cards (TTL: 2 minutos)
- Métricas agregadas (TTL: 1 minuto)

```typescript
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 }) // 5 minutos

export const getCached = <T>(key: string): T | undefined => {
  return cache.get<T>(key)
}

export const setCached = <T>(key: string, value: T, ttl?: number): boolean => {
  return cache.set(key, value, ttl)
}

export const deleteCached = (key: string): number => {
  return cache.del(key)
}
```

### 2. Paginação

```typescript
interface PaginationParams {
  page?: number
  pageSize?: number
}

const paginate = <T>(items: T[], params: PaginationParams) => {
  const page = params.page || 1
  const pageSize = params.pageSize || 100
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  return {
    items: items.slice(startIndex, endIndex),
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
    pageNumber: page,
    pageSize
  }
}
```

### 3. Logging

```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### 4. Validação de Dados

```typescript
import Joi from 'joi'

export const cardFiltersSchema = Joi.object({
  panelId: Joi.string().required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  userId: Joi.string().optional(),
  channelId: Joi.string().optional()
})
```

---

## Testes

### Exemplo de Teste de Integração

```typescript
import request from 'supertest'
import app from '../server'

describe('CRM API', () => {
  let authToken: string

  beforeAll(async () => {
    // Login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'contato@maxchip.com',
        password: 'senha-segura'
      })
    
    authToken = response.body.data.token
  })

  it('deve listar painéis', async () => {
    const response = await request(app)
      .get('/api/crm/panels')
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.items).toBeInstanceOf(Array)
  })

  it('deve listar cards com filtros', async () => {
    const response = await request(app)
      .get('/api/crm/cards')
      .query({ panelId: 'panel-uuid-123' })
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.items).toBeInstanceOf(Array)
  })

  it('deve calcular métricas do funil', async () => {
    const response = await request(app)
      .get('/api/metrics/funnel')
      .query({ panelId: 'panel-uuid-123' })
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data.stages).toBeInstanceOf(Array)
    expect(response.body.data.totalLeads).toBeGreaterThanOrEqual(0)
  })
})
```

---

## Deployment

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

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - HELENA_API_URL=${HELENA_API_URL}
      - HELENA_TOKENS=${HELENA_TOKENS}
    restart: unless-stopped
```

---

## Checklist de Implementação

- [ ] Configurar projeto base com TypeScript e Express
- [ ] Implementar autenticação JWT
- [ ] Criar Helena Client
- [ ] Implementar rotas de CRM (painéis, cards)
- [ ] Implementar rotas de métricas (funil, receita, conversão)
- [ ] Adicionar validação de entrada
- [ ] Implementar cache
- [ ] Configurar Swagger
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Configurar CI/CD
- [ ] Deploy em Railway/Heroku
- [ ] Atualizar frontend para usar nova API
- [ ] Monitoramento e logs
- [ ] Documentação final

---

## Próximos Passos

1. **Criar projeto backend** seguindo estrutura definida
2. **Implementar autenticação** com JWT
3. **Implementar rotas básicas** (painéis, cards)
4. **Implementar cálculo de métricas** no backend
5. **Atualizar frontend** para consumir nova API
6. **Testes e validação**
7. **Deploy**

---

## Contato e Suporte

Para dúvidas ou ajustes nesta documentação, entre em contato com a equipe de desenvolvimento.

**Versão:** 1.0.0  
**Data:** Novembro 2024  
**Projeto:** dashCRMAtendebot

