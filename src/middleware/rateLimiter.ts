import rateLimit from 'express-rate-limit'
import { config } from '../config/config'
import { logger } from '../utils/logger'

const rateLimitLogger = logger('rateLimiter')

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    rateLimitLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    })
  },
  skip: (req) => {
    return req.path === '/health'
  },
})

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    rateLimitLogger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    })
  },
})
