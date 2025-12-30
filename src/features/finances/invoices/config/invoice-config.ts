/**
 * Invoice Feature Configuration
 *
 * Centralized configuration for all invoice-related business rules and constants.
 * This file serves as the single source of truth for configurable values.
 */

export const INVOICE_CONFIG = {
  /**
   * Reminder Settings
   */
  REMINDER_THRESHOLD_DAYS: 7, // Send reminders when invoice is within this many days of due date
  REMINDER_URGENCY_HIGH_DAYS: 3, // Mark as high urgency when within this many days

  /**
   * Payment Settings
   */
  PAYMENT_TOLERANCE: 0.01, // Floating point tolerance for "fully paid" status (in currency units)

  /**
   * Invoice Defaults
   */
  DEFAULT_DUE_DAYS: 30, // Default number of days until invoice is due
  DEFAULT_CURRENCY: 'AUD',
  DEFAULT_GST_PERCENTAGE: 10,

  /**
   * Receipt Number Generation
   */
  RECEIPT_NUMBER_SEGMENTS: 3, // Number of segments in receipt number (e.g., 1234-5678-9012)
  RECEIPT_NUMBER_SEGMENT_LENGTH: 4, // Length of each segment

  /**
   * Retry Settings
   */
  INVOICE_NUMBER_MAX_RETRIES: 3, // Maximum attempts to generate unique invoice number

  /**
   * Status Urgency Thresholds (in days)
   */
  URGENCY_CRITICAL_DAYS: 0, // Overdue or due today
  URGENCY_HIGH_DAYS: 3, // Due within 3 days
  URGENCY_MEDIUM_DAYS: 7, // Due within 7 days
} as const;

/**
 * Type-safe access to configuration values
 */
export type InvoiceConfig = typeof INVOICE_CONFIG;
