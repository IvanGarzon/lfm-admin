/**
 * Quote Helper Utilities
 *
 * Collection of utility functions for quote management including:
 * - Status labels and transitions validation
 * - Permission checks based on quote status
 * - PDF generation and content hashing
 * - Expiration date calculations and urgency levels
 * - Quote validity and attention flags
 *
 * @module quote-helpers
 */

import crypto from 'crypto';
import { isAfter, differenceInDays, startOfToday } from 'date-fns';
import { QuoteStatus } from '@/prisma/client';
import { generatePdfBuffer } from '@/lib/pdf';
import type { QuoteListItem, QuoteWithDetails } from '@/features/finances/quotes/types';

/**
 * Get human-readable label for a quote status
 *
 * Converts enum status values to lowercase, user-friendly labels.
 *
 * @param status - The quote status enum value
 * @returns Lowercase string label for display
 *
 * @example
 * ```ts
 * getQuoteStatusLabel(QuoteStatus.ON_HOLD); // Returns: "on hold"
 * getQuoteStatusLabel(QuoteStatus.ACCEPTED); // Returns: "accepted"
 * ```
 */
export function getQuoteStatusLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    DRAFT: 'draft',
    SENT: 'sent',
    ON_HOLD: 'on hold',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    CONVERTED: 'converted',
  };

  return labels[status];
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Valid status transitions for quotes
 *
 * Defines allowed state transitions to maintain quote workflow integrity.
 * Each key represents the current status, and the array contains valid next statuses.
 *
 * Workflow:
 * - DRAFT → SENT (to customer), REJECTED, EXPIRED, or CANCELLED
 * - SENT → ON_HOLD, ACCEPTED, REJECTED, EXPIRED, or CANCELLED
 * - ON_HOLD → ACCEPTED or CANCELLED
 * - ACCEPTED → CONVERTED (to invoice) or CANCELLED
 * - REJECTED → CANCELLED (can create new version)
 * - EXPIRED → CANCELLED (can create new version)
 * - CANCELLED → Terminal state (no transitions)
 * - CONVERTED → Terminal state (no transitions)
 *
 * @example
 * ```ts
 * const allowedStatuses = VALID_QUOTE_STATUS_TRANSITIONS[QuoteStatus.SENT];
 * // Returns: [ON_HOLD, ACCEPTED, REJECTED, EXPIRED, CANCELLED]
 * ```
 */
export const VALID_QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [
    QuoteStatus.SENT,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.SENT]: [
    QuoteStatus.ON_HOLD,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.ON_HOLD]: [QuoteStatus.ACCEPTED, QuoteStatus.CANCELLED],
  [QuoteStatus.ACCEPTED]: [QuoteStatus.CONVERTED, QuoteStatus.CANCELLED],
  [QuoteStatus.REJECTED]: [QuoteStatus.CANCELLED], // Can create version from rejected
  [QuoteStatus.EXPIRED]: [QuoteStatus.CANCELLED], // Can create version from expired
  [QuoteStatus.CANCELLED]: [], // Terminal state
  [QuoteStatus.CONVERTED]: [], // Terminal state
};

/**
 * Check if a status transition is valid according to workflow rules
 *
 * @param fromStatus - Current quote status
 * @param toStatus - Desired next status
 * @returns True if transition is allowed, false otherwise
 *
 * @example
 * ```ts
 * canTransitionQuoteStatus(QuoteStatus.SENT, QuoteStatus.ACCEPTED);
 * // Returns: true
 *
 * canTransitionQuoteStatus(QuoteStatus.CONVERTED, QuoteStatus.SENT);
 * // Returns: false (CONVERTED is terminal)
 * ```
 */
export function canTransitionQuoteStatus(fromStatus: QuoteStatus, toStatus: QuoteStatus): boolean {
  // If statuses are the same, no transition needed
  if (fromStatus === toStatus) {
    return true;
  }

  const allowedTransitions = VALID_QUOTE_STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Get all valid next statuses for a given current status
 *
 * @param currentStatus - The current quote status
 * @returns Array of allowed next statuses
 *
 * @example
 * ```ts
 * const nextStatuses = getValidNextStatuses(QuoteStatus.SENT);
 * // Returns: [QuoteStatus.ON_HOLD, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED, QuoteStatus.CANCELLED]
 * ```
 */
export function getValidNextStatuses(currentStatus: QuoteStatus): QuoteStatus[] {
  return VALID_QUOTE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 *
 * Terminal statuses: CANCELLED, CONVERTED
 *
 * @param status - The quote status to check
 * @returns True if the status is terminal
 *
 * @example
 * ```ts
 * isTerminalQuoteStatus(QuoteStatus.CONVERTED); // Returns: true
 * isTerminalQuoteStatus(QuoteStatus.CANCELLED); // Returns: true
 * isTerminalQuoteStatus(QuoteStatus.SENT);      // Returns: false
 * ```
 */
export function isTerminalQuoteStatus(status: QuoteStatus): boolean {
  return VALID_QUOTE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid
 *
 * Use this in mutation handlers to ensure data integrity.
 * Provides specific error messages for terminal states vs invalid transitions.
 *
 * @param fromStatus - Current quote status
 * @param toStatus - Desired next status
 * @throws Error if transition is invalid, with specific message about why
 *
 * @example
 * ```ts
 * try {
 *   validateQuoteStatusTransition(currentStatus, newStatus);
 *   // Safe to proceed with status update
 * } catch (error) {
 *   // Handle invalid transition
 *   console.error(error.message);
 * }
 * ```
 */
export function validateQuoteStatusTransition(
  fromStatus: QuoteStatus,
  toStatus: QuoteStatus,
): void {
  if (!canTransitionQuoteStatus(fromStatus, toStatus)) {
    if (isTerminalQuoteStatus(fromStatus)) {
      throw new Error(
        `Cannot change status from ${fromStatus} as it is a terminal state. Current status: ${fromStatus}, Attempted status: ${toStatus}`,
      );
    }

    throw new Error(
      `Invalid status transition from ${fromStatus} to ${toStatus}. Valid transitions: ${VALID_QUOTE_STATUS_TRANSITIONS[fromStatus].join(', ')}`,
    );
  }
}

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Quote permissions based on current status
 *
 * Defines which actions are allowed for each quote status.
 * Used to control UI elements (buttons, menu items) and validate mutations.
 */
export interface QuotePermissions {
  /** Can mark quote as accepted (SENT, ON_HOLD only) */
  canAccept: boolean;
  /** Can mark quote as rejected (SENT only) */
  canReject: boolean;
  /** Can send quote to customer for first time (DRAFT only) */
  canSend: boolean;
  /** Can resend quote or send follow-up (SENT, ACCEPTED, EXPIRED, ON_HOLD) */
  canSendQuote: boolean;
  /** Can put quote on hold (SENT only) */
  canPutOnHold: boolean;
  /** Can convert quote to invoice (ACCEPTED only) */
  canConvert: boolean;
  /** Can cancel quote (DRAFT, SENT, ON_HOLD, ACCEPTED, REJECTED) */
  canCancel: boolean;
  /** Can delete quote (DRAFT, REJECTED, EXPIRED, CANCELLED) */
  canDelete: boolean;
  /** Can create new version (SENT, ON_HOLD, ACCEPTED, REJECTED, EXPIRED) */
  canCreateVersion: boolean;
  /** Can edit quote details (DRAFT only) */
  canEdit: boolean;
}

/**
 * Get permissions for a quote based on its status
 *
 * Returns a permission object indicating which actions are allowed.
 * If status is null/undefined, all permissions are false.
 *
 * @param status - The current quote status (or null/undefined)
 * @returns QuotePermissions object with boolean flags for each action
 *
 * @example
 * ```ts
 * const permissions = getQuotePermissions(QuoteStatus.SENT);
 * // Returns: { canAccept: true, canReject: true, canSend: false, canEdit: false, ... }
 *
 * const draftPermissions = getQuotePermissions(QuoteStatus.DRAFT);
 * // Returns: { canSend: true, canEdit: true, canCancel: true, canDelete: true, ... }
 * ```
 */
export function getQuotePermissions(status: QuoteStatus | undefined | null): QuotePermissions {
  if (!status) {
    return {
      canAccept: false,
      canReject: false,
      canSend: false,
      canSendQuote: false,
      canPutOnHold: false,
      canConvert: false,
      canCancel: false,
      canDelete: false,
      canCreateVersion: false,
      canEdit: false,
    };
  }

  return {
    canAccept: status === QuoteStatus.SENT || status === QuoteStatus.ON_HOLD,
    canReject: status === QuoteStatus.SENT,
    canSend: status === QuoteStatus.DRAFT,
    canSendQuote:
      status === QuoteStatus.SENT ||
      status === QuoteStatus.ACCEPTED ||
      status === QuoteStatus.ON_HOLD,
    canPutOnHold: status === QuoteStatus.SENT,
    canConvert: status === QuoteStatus.ACCEPTED,
    canCancel:
      status === QuoteStatus.DRAFT ||
      status === QuoteStatus.SENT ||
      status === QuoteStatus.ON_HOLD ||
      status === QuoteStatus.ACCEPTED ||
      status === QuoteStatus.REJECTED,
    canDelete:
      status === QuoteStatus.DRAFT ||
      status === QuoteStatus.REJECTED ||
      status === QuoteStatus.EXPIRED ||
      status === QuoteStatus.CANCELLED,
    canCreateVersion:
      status === QuoteStatus.SENT ||
      status === QuoteStatus.ON_HOLD ||
      status === QuoteStatus.ACCEPTED ||
      status === QuoteStatus.REJECTED ||
      status === QuoteStatus.EXPIRED,
    canEdit: status === QuoteStatus.DRAFT,
  };
}

// ============================================================================
// PDF UTILITIES
// ============================================================================

/**
 * Generate standardized quote filename from quote number
 *
 * @param quoteNumber - The quote number (e.g., "QUO-2024-001")
 * @returns PDF filename (e.g., "QUO-2024-001.pdf")
 *
 * @example
 * ```ts
 * const filename = generateQuoteFilename("QUO-2024-001");
 * // Returns: "QUO-2024-001.pdf"
 * ```
 */
export function generateQuoteFilename(quoteNumber: string): string {
  return `${quoteNumber}.pdf`;
}

/**
 * Generate quote PDF document as a Buffer for server-side operations
 *
 * Uses lazy loading to import the quote template only when needed,
 * reducing initial bundle size and improving performance.
 *
 * @param quote - Complete quote data with customer, items, and attachments
 * @returns Promise resolving to PDF Buffer
 *
 * @example
 * ```ts
 * const pdfBuffer = await generateQuotePDF(quote);
 * // Upload to S3, send via email, etc.
 * ```
 */
export async function generateQuotePDF(quote: QuoteWithDetails): Promise<Buffer> {
  // Lazy load template only when generating PDF
  const quoteTemplate = await import('@/templates/quote-template');
  const { absoluteUrl } = await import('@/lib/utils');
  const logoUrl = absoluteUrl('/static/logo-green-800.png');
  const pdfDoc = quoteTemplate.QuoteDocument({ quote, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Calculate SHA-256 hash of PDF content for deduplication and caching
 *
 * Only includes fields that affect the visual PDF output, ignoring fields
 * like status, updatedAt, or internal IDs that don't appear in the document.
 * This enables efficient S3 caching - if content hasn't changed, reuse existing PDF.
 *
 * Hashed fields include:
 * - Quote number, amount, discount, GST, dates
 * - Customer information
 * - Items with descriptions, quantities, prices, colors, notes, and attachments
 * - Quote notes and terms
 *
 * @param quote - The quote data with all details
 * @returns 64-character hex string (SHA-256 hash)
 *
 * @example
 * ```ts
 * const hash1 = calculateContentHash(quote);
 * const hash2 = calculateContentHash(quote);
 * // hash1 === hash2 if content is identical
 *
 * // After updating quote status (doesn't affect PDF)
 * const hash3 = calculateContentHash(updatedQuote);
 * // hash1 === hash3 (status not included in hash)
 * ```
 */
export function calculateContentHash(quote: QuoteWithDetails): string {
  const relevantData = {
    quoteNumber: quote.quoteNumber,
    amount: quote.amount.toString(),
    discount: quote.discount.toString(),
    gst: quote.gst.toString(),
    issuedDate: quote.issuedDate.toISOString(),
    validUntil: quote.validUntil.toISOString(),
    customer: {
      firstName: quote.customer.firstName,
      lastName: quote.customer.lastName,
      email: quote.customer.email,
    },
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
      colors: item.colors,
      notes: item.notes,
      order: item.order,
      attachments: item.attachments.map((att) => ({
        id: att.id,
        fileName: att.fileName,
        s3Url: att.s3Url,
      })),
    })),
    notes: quote.notes,
    terms: quote.terms,
  };

  return crypto.createHash('sha256').update(JSON.stringify(relevantData)).digest('hex');
}

// ============================================================================
// EXPIRY UTILITIES
// ============================================================================

/**
 * Calculate number of days until quote expires
 *
 * Positive values indicate future expiration, negative values indicate already expired.
 * Uses startOfToday() to ignore time component and only compare dates.
 *
 * @param validUntil - The quote expiration date
 * @returns Number of days (positive = future, negative = expired)
 *
 * @example
 * ```ts
 * const days = daysUntilExpiry(new Date('2024-12-31'));
 * // Returns: 10 (if today is Dec 21)
 * // Returns: -5 (if today is Jan 5)
 * ```
 */
export function daysUntilExpiry(validUntil: Date): number {
  return differenceInDays(validUntil, startOfToday());
}

/**
 * Check if quote is expired based on status and expiration date
 *
 * A quote is considered expired if:
 * - Status is explicitly EXPIRED, OR
 * - Status is DRAFT/SENT and current date is past validUntil date
 *
 * Quotes with status ACCEPTED, CONVERTED, ON_HOLD, or CANCELLED are never
 * considered expired (they've moved past the expiration concern).
 *
 * @param status - The quote status
 * @param validUntil - The quote expiration date
 * @returns True if quote is expired
 *
 * @example
 * ```ts
 * isExpired(QuoteStatus.SENT, pastDate); // Returns: true
 * isExpired(QuoteStatus.EXPIRED, anyDate); // Returns: true
 * isExpired(QuoteStatus.ACCEPTED, pastDate); // Returns: false (accepted quotes don't expire)
 * isExpired(QuoteStatus.SENT, futureDate); // Returns: false
 * ```
 */
export function isExpired(status: QuoteStatus, validUntil: Date): boolean {
  if (
    status === QuoteStatus.ACCEPTED ||
    status === QuoteStatus.CONVERTED ||
    status === QuoteStatus.EXPIRED ||
    status === QuoteStatus.ON_HOLD ||
    status === QuoteStatus.CANCELLED
  ) {
    return false;
  }

  return isAfter(startOfToday(), validUntil);
}

/**
 * Get the number of days a quote has been expired
 *
 * Returns 0 if quote is not yet expired (validUntil is in the future).
 *
 * @param validUntil - The quote expiration date
 * @returns Number of days expired (0 if not expired)
 *
 * @example
 * ```ts
 * const pastDate = new Date('2024-01-01'); // If today is Jan 10
 * getExpiredDays(pastDate); // Returns: 9
 *
 * const futureDate = new Date('2024-12-31');
 * getExpiredDays(futureDate); // Returns: 0
 * ```
 */
export function getExpiredDays(validUntil: Date): number {
  const days = daysUntilExpiry(validUntil);
  return days < 0 ? Math.abs(days) : 0;
}

/**
 * Check if quote needs attention (expiring soon)
 *
 * A quote needs attention if:
 * - Status is SENT (active quote with customer)
 * - Expires within 3 days or less (but not yet expired)
 *
 * Used to highlight quotes in the UI that require urgent action.
 *
 * @param quote - Quote object with status and validUntil properties
 * @returns True if quote needs attention
 *
 * @example
 * ```ts
 * needsAttention({status: QuoteStatus.SENT, validUntil: twoDaysFromNow}); // Returns: true
 * needsAttention({status: QuoteStatus.ACCEPTED, validUntil: twoDaysFromNow}); // Returns: false (not SENT status)
 * ```
 */
export function needsAttention({
  status,
  validUntil,
}: {
  status: QuoteStatus;
  validUntil: Date;
}): boolean {
  if (status !== QuoteStatus.SENT) {
    return false;
  }

  const daysUntil = daysUntilExpiry(validUntil);
  return daysUntil <= 3 && daysUntil >= 0;
}

/**
 * Get urgency level for a quote based on status and days until expiration
 *
 * Urgency levels:
 * - **critical**: Already expired (negative days until expiry)
 * - **high**: Expires within 3 days or less
 * - **medium**: Expires within 7 days or less
 * - **low**: All other cases (more than 7 days, or non-active statuses)
 *
 * Only SENT and DRAFT quotes are evaluated for urgency.
 * Other statuses (ACCEPTED, CONVERTED, CANCELLED, etc.) always return 'low'.
 *
 * @param quote - The quote to evaluate
 * @returns Urgency level: 'low' | 'medium' | 'high' | 'critical'
 *
 * @example
 * ```ts
 * const expiredQuote = { status: QuoteStatus.SENT, validUntil: pastDate };
 * getUrgency(expiredQuote); // Returns: 'critical'
 *
 * const soonQuote = { status: QuoteStatus.SENT, validUntil: twoDaysFromNow };
 * getUrgency(soonQuote); // Returns: 'high'
 *
 * const acceptedQuote = { status: QuoteStatus.ACCEPTED, validUntil: pastDate };
 * getUrgency(acceptedQuote); // Returns: 'low' (accepted quotes have no urgency)
 * ```
 */
export function getUrgency(quote: QuoteListItem): 'low' | 'medium' | 'high' | 'critical' {
  if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.DRAFT) {
    return 'low';
  }

  const daysUntil = daysUntilExpiry(quote.validUntil);
  if (daysUntil < 0) return 'critical';
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';

  return 'low';
}

/**
 * Get human-readable validity status message for a quote
 *
 * Returns contextual messages based on days until expiration:
 * - Expired: "Expired X days ago"
 * - Today: "Expires today"
 * - Tomorrow: "Expires tomorrow"
 * - Future: "Valid for X more days"
 *
 * @param quote - The quote to evaluate
 * @returns User-friendly validity message
 *
 * @example
 * ```ts
 * const quote1 = { validUntil: fiveDaysAgo };
 * getValidityMessage(quote1); // Returns: "Expired 5 days ago"
 *
 * const quote2 = { validUntil: today };
 * getValidityMessage(quote2); // Returns: "Expires today"
 *
 * const quote3 = { validUntil: tomorrow };
 * getValidityMessage(quote3); // Returns: "Expires tomorrow"
 *
 * const quote4 = { validUntil: tenDaysFromNow };
 * getValidityMessage(quote4); // Returns: "Valid for 10 more days"
 * ```
 */
export function getValidityMessage(quote: QuoteListItem): string {
  const daysUntil = daysUntilExpiry(quote.validUntil);

  if (daysUntil < 0) {
    return `Expired ${Math.abs(daysUntil)} days ago`;
  }

  if (daysUntil === 0) {
    return 'Expires today';
  }

  if (daysUntil === 1) {
    return 'Expires tomorrow';
  }

  return `Valid for ${daysUntil} more days`;
}
