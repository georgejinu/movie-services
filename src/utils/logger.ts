import winston from 'winston'
import { format, createLogger, transports } from 'winston'
import { config } from '../config/config'

const { combine, timestamp, label, printf, colorize, errors, json, metadata } = format

// Logger interface
export interface LoggerInterface {
  debug: (message: string, meta?: unknown) => void
  info: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  error: (message: string, meta?: unknown) => void
}

// Custom format for console output
const consoleFormat = printf(({ level, message, label, timestamp, ...meta }: any) => {
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${config.nodeEnv}] [${label}] ${level}: ${message}${metaStr}`
})

// Create Winston logger instance
function createWinstonLogger(name: string): winston.Logger {
  const loggerTransports: winston.transport[] = [
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
  ]

  // Add file transport in production if LOG_FILE_PATH is set
  if (config.nodeEnv === 'production' && process.env.LOG_FILE_PATH) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.LOG_FILE_PATH,
        format: combine(json(), timestamp()),
      })
    )
  }

  // Add error file transport if LOG_ERROR_FILE_PATH is set
  if (process.env.LOG_ERROR_FILE_PATH) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.LOG_ERROR_FILE_PATH,
        level: 'error',
        format: combine(json(), timestamp()),
      })
    )
  }

  const winstonLogger = createLogger({
    level: config.logLevel,
    format: combine(
      errors({ stack: true }),
      label({ label: name }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: loggerTransports,
  })

  return winstonLogger
}

// Wrapper to match LoggerInterface
function createLoggerWrapper(winstonLogger: winston.Logger): LoggerInterface {
  return {
    debug: (message: string, meta?: unknown) => {
      winstonLogger.debug(message, meta as object)
    },
    info: (message: string, meta?: unknown) => {
      winstonLogger.info(message, meta as object)
    },
    warn: (message: string, meta?: unknown) => {
      winstonLogger.warn(message, meta as object)
    },
    error: (message: string, meta?: unknown) => {
      winstonLogger.error(message, meta as object)
    },
  }
}

// Cache for logger instances
const loggerCache = new Map<string, LoggerInterface>()

// Export logger factory function
export function logger(name: string): LoggerInterface {
  if (!loggerCache.has(name)) {
    const winstonLogger = createWinstonLogger(name)
    loggerCache.set(name, createLoggerWrapper(winstonLogger))
  }
  return loggerCache.get(name)!
}

// Export a default logger instance
export const defaultLogger = logger('app')
