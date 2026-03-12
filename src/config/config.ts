import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file in project root
// This will also read from system environment variables (which take precedence)
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

interface AppConfig {
  port: number
  nodeEnv: string
  moviesDbPath: string
  ratingsDbPath: string
  logLevel: string
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
}

// Helper function to get environment variables with optional defaults
// Reads from process.env which includes both .env file and system environment variables
// System environment variables take precedence over .env file values
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value || defaultValue || ''
}

export const config: AppConfig = {
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  moviesDbPath: getEnvVar('MOVIES_DB_PATH', './db/movies.db'),
  ratingsDbPath: getEnvVar('RATINGS_DB_PATH', './db/ratings.db'),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
}
