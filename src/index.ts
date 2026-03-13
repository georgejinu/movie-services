import express, { Request, Response } from 'express'
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

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

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
    // Connect to both databases before starting the server
    appLogger.info('Connecting to databases...')
    await moviesDb.connect()
    await ratingsDb.connect()
    appLogger.info('Database connections established', {
      moviesDb: config.moviesDbPath,
      ratingsDb: config.ratingsDbPath,
    })

    // Initialize services after database connections
    await initializeServices()

    app.listen(config.port, '0.0.0.0', () => {
      appLogger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
      })
    })
  } catch (error) {
    appLogger.error('Failed to start server', { error })
    process.exit(1)
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
