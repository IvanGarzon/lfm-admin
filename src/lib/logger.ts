/**
 * Development-only Logger Utility
 *
 * Provides conditional logging that only runs in development mode.
 * In production, all log statements become no-ops to avoid performance overhead
 * and potential information leakage.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('User action', { userId: '123' });
 * logger.info('Operation completed');
 * logger.warn('Potential issue detected');
 * logger.error('Operation failed', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  context?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Debug-level logging for detailed diagnostics
   * Only logs in development mode
   */
  debug(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      this.log('debug', message, options);
    }
  }

  /**
   * Info-level logging for general information
   * Only logs in development mode
   */
  info(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      this.log('info', message, options);
    }
  }

  /**
   * Warning-level logging for potential issues
   * Only logs in development mode
   */
  warn(message: string, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      this.log('warn', message, options);
    }
  }

  /**
   * Error-level logging for errors
   * Logs in all environments but formats differently
   */
  error(message: string, error?: unknown, options?: LoggerOptions): void {
    if (this.isDevelopment) {
      console.error(
        `[ERROR]${options?.context ? ` [${options.context}]` : ''} ${message}`,
        error || '',
        options?.metadata || '',
      );
    } else {
      // In production, just log the error without sensitive data
      console.error(`[ERROR] ${message}`);
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  private log(level: LogLevel, message: string, options?: LoggerOptions): void {
    const prefix = `[${level.toUpperCase()}]`;
    const context = options?.context ? ` [${options.context}]` : '';
    const formattedMessage = `${prefix}${context} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, options?.metadata || '');
        break;
      case 'info':
        console.info(formattedMessage, options?.metadata || '');
        break;
      case 'warn':
        console.warn(formattedMessage, options?.metadata || '');
        break;
      case 'error':
        console.error(formattedMessage, options?.metadata || '');
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper function to create a contextual logger
 * Useful for adding consistent context to all logs within a component/function
 *
 * @example
 * const log = createLogger('InvoiceForm');
 * log.debug('Form initialized');
 * log.info('Form submitted', { invoiceId: '123' });
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, metadata?: Record<string, unknown>) =>
      logger.debug(message, { context, metadata }),
    info: (message: string, metadata?: Record<string, unknown>) =>
      logger.info(message, { context, metadata }),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logger.warn(message, { context, metadata }),
    error: (message: string, error?: unknown, metadata?: Record<string, unknown>) =>
      logger.error(message, error, { context, metadata }),
  };
}
