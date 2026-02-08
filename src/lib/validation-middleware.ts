/**
 * Validation middleware utilities for request processing
 * Provides additional security layers beyond schema validation
 */

/**
 * Checks if a string contains potential SQL injection patterns
 * Note: Prisma already protects against SQL injection, but this adds defense in depth
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\/\*|\*\/|;|'|"|\bOR\b|\bAND\b)\s*$/i,
    /[<>]script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validates that a sort parameter is safe and allowed
 */
export function validateSortParameter(
  sortId: string,
  allowedColumns: Set<string> | string[],
): boolean {
  const allowed = allowedColumns instanceof Set ? allowedColumns : new Set(allowedColumns);
  return allowed.has(sortId);
}

/**
 * Sanitizes and validates array parameters
 * Ensures arrays don't exceed reasonable limits to prevent DoS
 */
export function validateArrayParameter<T>(
  array: T[] | null | undefined,
  maxLength: number = 50,
): T[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }

  return array.slice(0, maxLength);
}

/**
 * Rate limiting token bucket for simple in-memory rate limiting
 * For production, use Redis-based rate limiting
 */
export class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.tokens = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed for the given key (e.g., user ID or IP)
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const token = this.tokens.get(key);

    if (!token || now > token.resetTime) {
      this.tokens.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (token.count < this.maxRequests) {
      token.count++;
      return true;
    }

    return false;
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, token] of this.tokens.entries()) {
      if (now > token.resetTime) {
        this.tokens.delete(key);
      }
    }
  }
}

/**
 * Validates pagination cursor to prevent manipulation
 */
export function validateCursor(cursor: string | null | undefined): string | null {
  if (!cursor) return null;

  // Ensure cursor is a valid base64 string
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    // Basic validation - adjust based on your cursor format
    if (decoded.length > 100 || containsSuspiciousPatterns(decoded)) {
      return null;
    }
    return cursor;
  } catch {
    return null;
  }
}

/**
 * Validates and sanitizes file upload parameters
 */
export function validateFileUploadParams(params: {
  filename?: string;
  mimetype?: string;
  size?: number;
}): { isValid: boolean; reason?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (params.filename && containsSuspiciousPatterns(params.filename)) {
    return { isValid: false, reason: 'Invalid filename' };
  }

  if (params.size && params.size > MAX_FILE_SIZE) {
    return { isValid: false, reason: 'File size exceeds limit' };
  }

  if (params.mimetype && !ALLOWED_MIMETYPES.includes(params.mimetype)) {
    return { isValid: false, reason: 'File type not allowed' };
  }

  return { isValid: true };
}
