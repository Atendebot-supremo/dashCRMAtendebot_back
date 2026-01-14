import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { createServer } from 'http'

// Log inicial para debug
console.log('[INIT] Iniciando servidor...')
console.log('[INIT] Variáveis de ambiente:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL ? 'configurado' : 'não configurado',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'configurado' : 'não configurado',
  JWT_SECRET: process.env.JWT_SECRET ? 'configurado' : 'não configurado',
  HELENA_API_URL: process.env.HELENA_API_URL
})

// Rotas
import authRoutes from './features/auth/authRoutes'
import crmRoutes from './features/crm/crmRoutes'
import metricsRoutes from './features/metrics/metricsRoutes'
import { createErrorResponse, ErrorCode } from './types'

const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

console.log('[INIT] Criando servidor HTTP...')
const httpServer = createServer(app)

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://dashcrmatendebotfront-desenvolvimento.up.railway.app',
      'https://dashcrmatendebotfront-production.up.railway.app',
      'https://homolog-dashboard.atende.bot',
      'https://dashboard.atende.bot'
    ]

// CORS deve ser o PRIMEIRO middleware para garantir que preflight funcione
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) {
        return callback(null, true)
      }
      
      // Verificar se a origin está na lista permitida
      if (allowedOrigins.includes(origin)) {
        console.log('[CORS] Origin permitida:', origin)
        return callback(null, true)
      }
      
      // Log para debug
      console.log('[CORS] Origin não permitida:', origin)
      console.log('[CORS] Origins permitidas:', allowedOrigins)
      
      callback(new Error('Não permitido por CORS'))
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    preflightContinue: false,
    maxAge: 86400 // 24 horas - cache do preflight
  })
)

// Middlewares globais
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false
  })
)

// Nota: O middleware cors já trata requisições OPTIONS (preflight) automaticamente
// Não precisamos de handler explícito, o cors já faz isso

// Rate limiting global
const globalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 200, // 200 requisições por 5 minutos
  message: 'Muitas requisições do mesmo IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para health checks e requisições OPTIONS (preflight)
    return req.path === '/health' || req.path === '/ready' || req.path === '/live' || req.method === 'OPTIONS'
  }
})

app.use(globalRateLimiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Swagger Configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'dashCRMAtendebot API',
      version: '1.0.0',
      description: 'API intermediária para dashboard CRM - Integração com plataforma Helena/flw.chat',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://seu-backend.railway.app',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via endpoint /api/auth/login'
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação'
      },
      {
        name: 'CRM',
        description: 'Endpoints para dados CRM (painéis, cards, usuários, canais)'
      },
      {
        name: 'Metrics',
        description: 'Endpoints para métricas e análises de vendas'
      }
    ]
  },
  apis: ['./src/features/**/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'dashCRMAtendebot API Documentation'
}))

// Health endpoints
app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  })
})

app.get('/ready', (_, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  })
})

app.get('/live', (_, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/metrics', metricsRoutes)

// 404 Handler
app.use((_, res) => {
  res.status(404).json(
    createErrorResponse('Rota não encontrada', ErrorCode.NOT_FOUND)
  )
})

// Error Handler Global
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Erro não tratado:', error)

  if (error.message === 'Não permitido por CORS') {
    return res.status(403).json(
      createErrorResponse('Origem não permitida', ErrorCode.FORBIDDEN)
    )
  }

  return res.status(500).json(
    createErrorResponse(
      NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
      ErrorCode.INTERNAL_SERVER_ERROR
    )
  )
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} recebido. Encerrando servidor...`)
  
  httpServer.close(() => {
    console.log('Servidor HTTP encerrado.')
    process.exit(0)
  })

  // Force close após 10 segundos
  setTimeout(() => {
    console.error('Forçando encerramento do servidor...')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
// Railway requer que escutemos em 0.0.0.0, não apenas na porta
const HOST = '0.0.0.0'

console.log('[INIT] Preparando para iniciar servidor na porta', PORT)

try {
  // Configurar handler de erro ANTES de chamar listen
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error('[SERVER] Erro no servidor HTTP:', error)
    if (error.syscall !== 'listen') {
      throw error
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT

    switch (error.code) {
      case 'EACCES':
        console.error(`[SERVER] ${bind} requires elevated privileges`)
        process.exit(1)
        break
      case 'EADDRINUSE':
        console.error(`[SERVER] ${bind} is already in use`)
        process.exit(1)
        break
      default:
        console.error(`[SERVER] Erro desconhecido: ${error.code}`)
        throw error
    }
  })

  httpServer.on('listening', () => {
    console.log('[SERVER] Servidor HTTP está escutando')
  })

  httpServer.listen(Number(PORT), HOST, () => {
    console.log('='.repeat(50))
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    console.log(`📚 Documentação: http://${HOST}:${PORT}/api/docs`)
    console.log(`🏥 Health: http://${HOST}:${PORT}/health`)
    console.log(`🌍 Ambiente: ${NODE_ENV}`)
    console.log(`🌐 Escutando em: ${HOST}:${PORT}`)
    console.log('='.repeat(50))
  })
} catch (error) {
  console.error('[FATAL] Erro ao iniciar servidor:', error)
  if (error instanceof Error) {
    console.error('[FATAL] Stack:', error.stack)
  }
  process.exit(1)
}

