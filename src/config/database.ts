import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import { config } from './config'
import { logger } from '../utils/logger'

sqlite3.verbose()

const dbLogger = logger('database')

// Wrapper class to make sqlite3 callback-based API work with async/await
// Makes the code cleaner and easier to work with

export class Database {
  private db: sqlite3.Database | null = null

  constructor(private dbPath: string) {}

  async connect(): Promise<void> {
    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) {
      dbLogger.debug('Creating database directory', { path: dbDir })
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Promisify the connection to work with async/await
    dbLogger.debug('Connecting to database', { path: this.dbPath })
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          dbLogger.error('Failed to connect to database', { path: this.dbPath, error: err })
          reject(err)
        } else {
          dbLogger.info('Database connected successfully', { path: this.dbPath })
          resolve()
        }
      })
    })
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        dbLogger.debug('Database already closed', { path: this.dbPath })
        resolve()
        return
      }
      dbLogger.debug('Closing database connection', { path: this.dbPath })
      this.db.close((err) => {
        if (err) {
          dbLogger.error('Error closing database', { path: this.dbPath, error: err })
          reject(err)
        } else {
          this.db = null
          dbLogger.info('Database connection closed', { path: this.dbPath })
          resolve()
        }
      })
    })
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) {
      dbLogger.error('Database query attempted but not connected', { path: this.dbPath })
      throw new Error('Database not connected')
    }

    // Log the full SQL query with parameters
    const formattedSql = this.formatSqlQuery(sql, params)
    dbLogger.debug('Executing database query', {
      sql: formattedSql,
      originalSql: sql,
      params,
      path: this.dbPath,
    })

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          dbLogger.error('Database query failed', {
            sql: formattedSql,
            originalSql: sql,
            params,
            error: err,
            path: this.dbPath,
          })
          reject(err)
        } else {
          dbLogger.debug('Database query successful', {
            sql: formattedSql,
            originalSql: sql,
            rowCount: (rows as T[]).length,
            path: this.dbPath,
          })
          resolve(rows as T[])
        }
      })
    })
  }

  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (!this.db) {
      dbLogger.error('Database get attempted but not connected', { path: this.dbPath })
      throw new Error('Database not connected')
    }

    // Log the full SQL query with parameters
    const formattedSql = this.formatSqlQuery(sql, params)
    dbLogger.debug('Executing database get', {
      sql: formattedSql,
      originalSql: sql,
      params,
      path: this.dbPath,
    })

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          dbLogger.error('Database get failed', {
            sql: formattedSql,
            originalSql: sql,
            params,
            error: err,
            path: this.dbPath,
          })
          reject(err)
        } else {
          dbLogger.debug('Database get successful', {
            sql: formattedSql,
            originalSql: sql,
            found: !!row,
            path: this.dbPath,
          })
          resolve(row as T | undefined)
        }
      })
    })
  }

  async run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    if (!this.db) {
      dbLogger.error('Database run attempted but not connected', { path: this.dbPath })
      throw new Error('Database not connected')
    }

    // Capture dbPath for use in callback
    const dbPath = this.dbPath

    // Log the full SQL query with parameters
    const formattedSql = this.formatSqlQuery(sql, params)
    dbLogger.debug('Executing database run', {
      sql: formattedSql,
      originalSql: sql,
      params,
      path: dbPath,
    })

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function (err) {
        if (err) {
          dbLogger.error('Database run failed', {
            sql: formattedSql,
            originalSql: sql,
            params,
            error: err,
            path: dbPath,
          })
          reject(err)
        } else {
          dbLogger.debug('Database run successful', {
            sql: formattedSql,
            originalSql: sql,
            changes: this.changes,
            lastID: this.lastID,
            path: dbPath,
          })
          resolve(this)
        }
      })
    })
  }

  // Helper method to format SQL query with parameters for logging
  private formatSqlQuery(sql: string, params: unknown[]): string {
    if (params.length === 0) {
      return sql
    }

    // Replace ? placeholders with actual parameter values
    let formattedSql = sql
    let paramIndex = 0

    // Handle different parameter types
    const formatParam = (param: unknown): string => {
      if (param === null || param === undefined) {
        return 'NULL'
      }
      if (typeof param === 'string') {
        return `'${param.replace(/'/g, "''")}'`
      }
      if (typeof param === 'number' || typeof param === 'boolean') {
        return String(param)
      }
      if (Array.isArray(param)) {
        return `[${param.map(formatParam).join(', ')}]`
      }
      if (typeof param === 'object') {
        return JSON.stringify(param)
      }
      return String(param)
    }

    // Replace ? placeholders
    formattedSql = formattedSql.replace(/\?/g, () => {
      if (paramIndex < params.length) {
        const param = params[paramIndex++]
        return formatParam(param)
      }
      return '?'
    })

    return formattedSql
  }
}

export const moviesDb = new Database(path.resolve(process.cwd(), config.moviesDbPath))

export const ratingsDb = new Database(path.resolve(process.cwd(), config.ratingsDbPath))
