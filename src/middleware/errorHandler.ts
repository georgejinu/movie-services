import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

const errorLogger = logger('errorHandler')

export interface ApiError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  if (statusCode === 500) {
    errorLogger.error('Unhandled error', {
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
  } else {
    errorLogger.warn('Handled error', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
    })
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function notFoundHandler(req: Request, res: Response): void {
  errorLogger.warn('Route not found', {
    path: req.path,
    method: req.method,
    query: req.query,
  })
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  })
}
