# Guia de Migração - Frontend para Nova API

## Visão Geral

Este guia explica como migrar o frontend para consumir a nova API intermediária ao invés da API Helena diretamente.

---

## Mudanças Necessárias no Frontend

### 1. Variáveis de Ambiente

**ANTES** (.env.local):
```env
VITE_HELENA_API_URL=https://api.flw.chat
VITE_HELENA_API_TOKEN=pn_mh3AGdH9Exo8PsLsEQjRvg80IB66FEOieyPJlKaCxk
```

**DEPOIS** (.env.local):
```env
VITE_API_URL=http://localhost:3000
# OU em produção:
VITE_API_URL=https://sua-api.railway.app
```

**Railway (Variáveis de Build):**
- ❌ Remover: `VITE_HELENA_API_URL` e `VITE_HELENA_API_TOKEN`
- ✅ Adicionar: `VITE_API_URL=https://sua-api.railway.app`

---

### 2. Cliente HTTP

#### ANTES: `src/lib/api/helena-client.ts`

```typescript
const API_URL = import.meta.env.VITE_HELENA_API_URL
const API_TOKEN = import.meta.env.VITE_HELENA_API_TOKEN

const fetchWithAuth = async (endpoint: string) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  return response.json()
}
```

#### DEPOIS: `src/lib/api/client.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Token JWT do cliente (após login)
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Token não encontrado. Faça login novamente.')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado, redirecionar para login
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    throw new Error(`Erro na requisição: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Erro desconhecido')
  }

  return data.data // Retorna apenas o conteúdo de "data"
}

export const apiClient = {
  // Painéis
  async getPanels() {
    return fetchWithAuth('/api/crm/panels')
  },

  async getPanelById(panelId: string) {
    return fetchWithAuth(`/api/crm/panels/${panelId}`)
  },

  // Cards
  async getCards(filters: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return fetchWithAuth(`/api/crm/cards?${params.toString()}`)
  },

  async getCardById(cardId: string) {
    return fetchWithAuth(`/api/crm/cards/${cardId}`)
  },

  // Usuários
  async getUsers() {
    return fetchWithAuth('/api/crm/users')
  },

  // Canais
  async getChannels() {
    return fetchWithAuth('/api/crm/channels')
  },

  // Métricas
  async getFunnelMetrics(filters: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return fetchWithAuth(`/api/metrics/funnel?${params.toString()}`)
  },

  async getRevenueMetrics(filters: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return fetchWithAuth(`/api/metrics/revenue?${params.toString()}`)
  },

  async getConversionMetrics(filters: {
    panelId: string
    startDate?: string
    endDate?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return fetchWithAuth(`/api/metrics/conversion?${params.toString()}`)
  },

  async getDashboard(filters: {
    panelId: string
    startDate?: string
    endDate?: string
    userId?: string
    channelId?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    return fetchWithAuth(`/api/metrics/dashboard?${params.toString()}`)
  },

  // Autenticação
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Erro ao fazer login')
    }

    // Salvar token
    localStorage.setItem('authToken', data.data.token)
    
    return data.data
  },

  async logout() {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }
}
```

---

### 3. React Query Hooks

#### ANTES: `src/lib/api/queries.ts`

```typescript
export const usePanels = () => {
  return useQuery({
    queryKey: ['panels'],
    queryFn: async () => {
      const response = await helenaClient.getPanels()
      return response.items || []
    }
  })
}
```

#### DEPOIS: `src/lib/api/queries.ts`

```typescript
import { apiClient } from './client'

export const usePanels = () => {
  return useQuery({
    queryKey: ['panels'],
    queryFn: async () => {
      const response = await apiClient.getPanels()
      // A API já retorna response.items
      return response.items || []
    },
    staleTime: 5 * 60 * 1000
  })
}

export const useCards = (filters: {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
}, enabled = true) => {
  return useQuery({
    queryKey: ['cards', filters],
    queryFn: async () => {
      const response = await apiClient.getCards(filters)
      return response.items || []
    },
    enabled,
    staleTime: 2 * 60 * 1000
  })
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.getUsers()
      return response.items || []
    },
    staleTime: 10 * 60 * 1000
  })
}

export const useChannels = () => {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await apiClient.getChannels()
      return response.items || []
    },
    staleTime: 10 * 60 * 1000
  })
}

// Nova hook para métricas
export const useFunnelMetrics = (filters: {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
}, enabled = true) => {
  return useQuery({
    queryKey: ['metrics', 'funnel', filters],
    queryFn: () => apiClient.getFunnelMetrics(filters),
    enabled,
    staleTime: 1 * 60 * 1000 // 1 minuto
  })
}

export const useRevenueMetrics = (filters: {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
}, enabled = true) => {
  return useQuery({
    queryKey: ['metrics', 'revenue', filters],
    queryFn: () => apiClient.getRevenueMetrics(filters),
    enabled,
    staleTime: 1 * 60 * 1000
  })
}

export const useDashboard = (filters: {
  panelId: string
  startDate?: string
  endDate?: string
  userId?: string
  channelId?: string
}, enabled = true) => {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => apiClient.getDashboard(filters),
    enabled,
    staleTime: 1 * 60 * 1000
  })
}
```

---

### 4. Componente de Login

Criar novo componente: `src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api/client'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiClient.login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login - Dashboard CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
```

---

### 5. Protected Route

Criar: `src/components/auth/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('authToken')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
```

---

### 6. Atualizar Rotas

#### ANTES: `src/App.tsx`

```typescript
<Routes>
  <Route path="/" element={<DashboardPage />} />
</Routes>
```

#### DEPOIS: `src/App.tsx`

```typescript
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route 
    path="/" 
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    } 
  />
  <Route 
    path="/dashboard" 
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    } 
  />
</Routes>
```

---

### 7. Simplificar Cálculos (Backend faz agora)

#### ANTES: Frontend calculava métricas

```typescript
// src/lib/utils/calculations.ts
export const calculateFunnelMetrics = (cards: Card[]) => {
  // Muita lógica de cálculo aqui...
}
```

#### DEPOIS: Backend retorna métricas prontas

```typescript
// src/components/funil/FunilView.tsx
const { data: funnelMetrics } = useFunnelMetrics({
  panelId: filters.panelId,
  startDate: filters.startDate,
  endDate: filters.endDate,
  userId: filters.userId,
  channelId: filters.channelId
})

// Usar diretamente
<div>
  <h3>Total de Leads: {funnelMetrics?.totalLeads}</h3>
  <h3>Taxa de Conversão: {funnelMetrics?.overallConversionRate}%</h3>
</div>
```

---

### 8. Remover Código Desnecessário

Após migração, remover:

- ❌ `src/lib/api/helena-client.ts`
- ❌ `src/lib/utils/calculations.ts` (se todas as métricas vierem do backend)
- ❌ `src/lib/utils/stage-mapping.ts` (se backend retornar nomes corretos)
- ❌ `vite.config.ts` - Remover proxy:

```typescript
// ANTES
server: {
  proxy: {
    '/api': {
      target: 'https://api.flw.chat',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}

// DEPOIS (sem proxy)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Ordem de Implementação

### Fase 1: Backend (Sua Nova API)
1. ✅ Criar projeto backend seguindo `API_DOCUMENTATION.md`
2. ✅ Implementar autenticação
3. ✅ Implementar rotas de CRM
4. ✅ Implementar rotas de métricas
5. ✅ Testar com Postman/Insomnia
6. ✅ Deploy no Railway

### Fase 2: Frontend (Este Projeto)
1. ✅ Criar `src/lib/api/client.ts`
2. ✅ Criar `src/pages/LoginPage.tsx`
3. ✅ Criar `src/components/auth/ProtectedRoute.tsx`
4. ✅ Atualizar `src/lib/api/queries.ts`
5. ✅ Atualizar `src/App.tsx` com rotas protegidas
6. ✅ Atualizar variáveis de ambiente
7. ✅ Testar localmente
8. ✅ Remover código antigo
9. ✅ Deploy no Railway

---

## Testes

### Testar API Localmente

1. **Startar backend:**
```bash
cd dashCRMAtendebot_back
npm run dev
```

2. **Testar login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contato@maxchip.com","password":"senha-segura"}'
```

3. **Copiar token da resposta e testar painéis:**
```bash
curl http://localhost:3000/api/crm/panels \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

4. **Testar métricas:**
```bash
curl "http://localhost:3000/api/metrics/funnel?panelId=PANEL_ID" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## Vantagens da Nova Arquitetura

### ✅ Segurança
- Token Helena não exposto no frontend
- JWT para autenticação de clientes
- Rate limiting no backend

### ✅ Performance
- Cache no backend
- Métricas pré-calculadas
- Menos requisições do frontend

### ✅ Manutenibilidade
- Lógica de negócio no backend
- Frontend mais simples
- Fácil adicionar novos clientes

### ✅ Escalabilidade
- Backend pode servir múltiplos frontends
- Fácil adicionar novos endpoints
- Suporte a webhooks no futuro

---

## Troubleshooting

### Erro: "Token não encontrado"
- Fazer logout e login novamente
- Verificar localStorage no DevTools
- Verificar se login está salvando token

### Erro: 401 Unauthorized
- Verificar se token não expirou
- Verificar variáveis de ambiente do backend
- Verificar se `JWT_SECRET` está configurado

### Erro: CORS
- Verificar `cors` no backend
- Adicionar origem do frontend na lista de permitidos
- Verificar se `credentials: true`

### Métricas vazias
- Verificar se `panelId` está correto
- Verificar se existem cards no período filtrado
- Verificar logs do backend

---

## Checklist de Migração

### Backend
- [ ] Projeto criado e rodando
- [ ] Autenticação implementada
- [ ] Rotas CRM funcionando
- [ ] Rotas de métricas funcionando
- [ ] Testes passando
- [ ] Deploy realizado

### Frontend
- [ ] `client.ts` criado
- [ ] `queries.ts` atualizado
- [ ] `LoginPage` criado
- [ ] `ProtectedRoute` criado
- [ ] `App.tsx` atualizado
- [ ] Variáveis de ambiente atualizadas
- [ ] Código antigo removido
- [ ] Testes locais OK
- [ ] Deploy realizado

---

## Próximos Passos

1. **Criar backend** seguindo `API_DOCUMENTATION.md`
2. **Testar endpoints** com Postman
3. **Migrar frontend** seguindo este guia
4. **Testar integração**
5. **Deploy** de ambos
6. **Documentar** credenciais de produção

Qualquer dúvida, consulte a `API_DOCUMENTATION.md` completa!

