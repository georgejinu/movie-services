import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

const validationLogger = logger('validation')

export interface ValidationSchema {
  query?: {
    [key: string]: (value: unknown) => boolean | string
  }
  params?: {
    [key: string]: (value: unknown) => boolean | string
  }
  body?: {
    [key: string]: (value: unknown) => boolean | string
  }
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = []

    // Validate query parameters
    if (schema.query) {
      for (const [key, validator] of Object.entries(schema.query)) {
        const value = req.query[key]
        const result = validator(value)
        if (result !== true) {
          errors.push(`Query parameter '${key}': ${result || 'Invalid value'}`)
        }
      }
    }

    // Validate route parameters
    if (schema.params) {
      for (const [key, validator] of Object.entries(schema.params)) {
        const value = req.params[key]
        const result = validator(value)
        if (result !== true) {
          errors.push(`Route parameter '${key}': ${result || 'Invalid value'}`)
        }
      }
    }

    // Validate request body
    if (schema.body) {
      for (const [key, validator] of Object.entries(schema.body)) {
        const value = (req.body as Record<string, unknown>)[key]
        const result = validator(value)
        if (result !== true) {
          errors.push(`Body parameter '${key}': ${result || 'Invalid value'}`)
        }
      }
    }

    if (errors.length > 0) {
      validationLogger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors,
      })
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      })
      return
    }

    next()
  }
}

// Common validators
export const validators = {
  page: (value: unknown): boolean | string => {
    if (value === undefined) return true
    const page = parseInt(String(value), 10)
    if (isNaN(page) || page < 1) {
      return 'Must be a positive integer'
    }
    return true
  },

  year: (value: unknown): boolean | string => {
    if (typeof value !== 'string') {
      return 'Must be a string'
    }
    const year = parseInt(value, 10)
    if (isNaN(year) || year < 1900 || year > 2100) {
      return 'Must be a valid year between 1900 and 2100'
    }
    return true
  },

  genre: (value: unknown): boolean | string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Must be a non-empty string'
    }
    return true
  },

  imdbId: (value: unknown): boolean | string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Must be a non-empty string'
    }
    if (!value.startsWith('tt')) {
      return 'Must start with "tt"'
    }
    return true
  },

  sortOrder: (value: unknown): boolean | string => {
    if (value === undefined) return true
    if (value !== 'asc' && value !== 'desc') {
      return 'Must be either "asc" or "desc"'
    }
    return true
  },
}
