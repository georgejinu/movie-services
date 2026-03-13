import express, { Request, Response, NextFunction } from 'express'
import swaggerUi from 'swagger-ui-express'
import { moviesDb, ratingsDb } from './config/database'
import { config } from './config/config'
import { swaggerSpec } from './config/swagger'
import { createMovieRoutes } from './routes/movieRoutes'
import { MovieService } from './services/movieService'
import { MovieController } from './controllers/movieController'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { requestLoggingMiddleware } from './middleware/requestLogger'
import { apiRateLimiter } from './middleware/rateLimiter'
import { logger } from './utils/logger'

const appLogger = logger('server')

const app = express()

// CORS middleware for Swagger UI
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLoggingMiddleware)

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter)

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (_req: Request, res: Response) => {
  appLogger.debug('Health check requested')
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root route for Railway health checks
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Movie Services API',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiDocs: '/api-docs',
      movies: '/api/movies'
    }
  })
})

// Helper function to get Swagger spec with dynamic server URL
const getSwaggerSpecWithUrl = (req: Request) => {
  const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http')
  const host = req.get('host') || `localhost:${config.port}`
  const serverUrl = `${protocol}://${host}`

  return {
    ...swaggerSpec,
    servers: [
      {
        url: serverUrl,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
  }
}

// Swagger JSON spec endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  const spec = getSwaggerSpecWithUrl(req)
  res.setHeader('Content-Type', 'application/json')
  res.send(spec)
})

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const spec = getSwaggerSpecWithUrl(req)
  swaggerUi.setup(spec, {
    customSiteTitle: 'Movie Services API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })(req, res, next)
})

// Initialize services with dependency injection
let movieService: MovieService
let movieController: MovieController

async function initializeServices(): Promise<void> {
  movieService = new MovieService(moviesDb, ratingsDb)
  movieController = new MovieController(movieService)
  app.use('/api/movies', createMovieRoutes(movieController))

  // Register error handlers AFTER routes
  app.use(notFoundHandler)
  app.use(errorHandler)
}

async function startServer(): Promise<void> {
  try {
    // Log startup information (also to console for Railway visibility)
    console.log(`Starting server on port ${config.port}...`)
    appLogger.info('Starting server...', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      moviesDbPath: config.moviesDbPath,
      ratingsDbPath: config.ratingsDbPath,
    })

    // Connect to both databases before starting the server
    console.log('Connecting to databases...')
    appLogger.info('Connecting to databases...')
    await moviesDb.connect()
    await ratingsDb.connect()
    console.log('Database connections established')
    appLogger.info('Database connections established', {
      moviesDb: config.moviesDbPath,
      ratingsDb: config.ratingsDbPath,
    })

    // Initialize services after database connections
    await initializeServices()

    const server = app.listen(config.port, '0.0.0.0', () => {
      const address = server.address()
      console.log(`Server started successfully on port ${config.port}`)
      console.log(`Server address: ${JSON.stringify(address)}`)
      appLogger.info('Server started successfully', {
        port: config.port,
        address: server.address(),
        environment: config.nodeEnv,
      })
    })

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('Server error:', error)
      appLogger.error('Server error', { error, port: config.port })
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`)
        appLogger.error(`Port ${config.port} is already in use`)
      }
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    appLogger.error('Failed to start server', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    // Give time for logs to flush before exiting
    setTimeout(() => process.exit(1), 1000)
  }
}

// Graceful shutdown handlers - close DB connections on termination
process.on('SIGINT', async () => {
  appLogger.info('Received SIGINT, shutting down gracefully...')
  await moviesDb.close()
  await ratingsDb.close()
  appLogger.info('Shutdown complete')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  appLogger.info('Received SIGTERM, shutting down gracefully...')
  await moviesDb.close()
  await ratingsDb.close()
  appLogger.info('Shutdown complete')
  process.exit(0)
})

startServer()
