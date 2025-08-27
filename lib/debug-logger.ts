// Debug logger for scraping operations
export class DebugLogger {
  private context: string
  private startTime: number
  private logs: LogEntry[] = []
  
  constructor(context: string) {
    this.context = context
    this.startTime = Date.now()
  }
  
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.startTime,
      context: this.context,
      level,
      message,
      data
    }
    
    this.logs.push(entry)
    
    // Console output with color coding
    const prefix = `[${this.context}] [${level.toUpperCase()}]`
    const color = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[90m'
    }[level]
    const reset = '\x1b[0m'
    
    console.log(`${color}${prefix}${reset} ${message}`, data || '')
    
    return entry
  }
  
  info(message: string, data?: any) {
    return this.log('info', message, data)
  }
  
  warn(message: string, data?: any) {
    return this.log('warn', message, data)
  }
  
  error(message: string, data?: any) {
    return this.log('error', message, data)
  }
  
  debug(message: string, data?: any) {
    return this.log('debug', message, data)
  }
  
  startTimer(label: string): () => void {
    const start = Date.now()
    this.debug(`Timer started: ${label}`)
    
    return () => {
      const duration = Date.now() - start
      this.debug(`Timer ended: ${label}`, { duration: `${duration}ms` })
      return duration
    }
  }
  
  getLogs(): LogEntry[] {
    return this.logs
  }
  
  getSummary(): LogSummary {
    const counts = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0
    }
    
    this.logs.forEach(log => {
      counts[log.level]++
    })
    
    return {
      context: this.context,
      totalDuration: Date.now() - this.startTime,
      logCounts: counts,
      hasErrors: counts.error > 0,
      logs: this.logs
    }
  }
  
  async saveToDatabase(scanRunId?: string) {
    try {
      // Save logs to database for analysis
      const summary = this.getSummary()
      
      if (typeof window === 'undefined') {
        // Server-side only
        const { prisma } = require('./prisma')
        
        await prisma.debugLog.create({
          data: {
            scanRunId,
            context: this.context,
            level: summary.hasErrors ? 'error' : 'info',
            message: `Scan ${this.context} completed`,
            data: JSON.stringify(summary),
            timestamp: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Failed to save debug logs:', error)
    }
  }
}

export interface LogEntry {
  timestamp: string
  elapsed: number
  context: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

export interface LogSummary {
  context: string
  totalDuration: number
  logCounts: {
    info: number
    warn: number
    error: number
    debug: number
  }
  hasErrors: boolean
  logs: LogEntry[]
}

// Global debug flag
export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || 
                         process.env.DEBUG_MODE === 'true' ||
                         process.env.NODE_ENV === 'development'