import { isAfter, differenceInDays, startOfToday } from 'date-fns';
import crypto from 'crypto';
import { generatePdfBuffer } from '@/lib/pdf';
import { QuoteDocument } from '@/templates/quote-template';
import type { QuoteListItem, QuoteWithDetails } from '@/features/finances/quotes/types';
import { QuoteStatus } from '@/prisma/client';

/**
 * Get human-readable label for a quote status
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
 * Valid status transitions for quotes.
 * Each key represents the current status, and the array contains valid next statuses.
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
  [QuoteStatus.ON_HOLD]: [
    QuoteStatus.ACCEPTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.ACCEPTED]: [
    QuoteStatus.CONVERTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.REJECTED]: [QuoteStatus.CANCELLED], // Can create version from rejected
  [QuoteStatus.EXPIRED]: [QuoteStatus.CANCELLED], // Can create version from expired
  [QuoteStatus.CANCELLED]: [], // Terminal state
  [QuoteStatus.CONVERTED]: [], // Terminal state
};

/**
 * Check if a status transition is valid.
 */
export function canTransitionQuoteStatus(
  fromStatus: QuoteStatus,
  toStatus: QuoteStatus,
): boolean {
  // If statuses are the same, no transition needed
  if (fromStatus === toStatus) {
    return true;
  }

  const allowedTransitions = VALID_QUOTE_STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Get all valid next statuses for a given current status.
 */
export function getValidNextStatuses(currentStatus: QuoteStatus): QuoteStatus[] {
  return VALID_QUOTE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed).
 */
export function isTerminalQuoteStatus(status: QuoteStatus): boolean {
  return VALID_QUOTE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid.
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
 */
export interface QuotePermissions {
  canAccept: boolean;
  canReject: boolean;
  canSend: boolean;
  canPutOnHold: boolean;
  canConvert: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canCreateVersion: boolean;
  canEdit: boolean;
}

/**
 * Get permissions for a quote based on its status
 */
export function getQuotePermissions(status: QuoteStatus | undefined | null): QuotePermissions {
  if (!status) {
    return {
      canAccept: false,
      canReject: false,
      canSend: false,
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
    canEdit:
      status === QuoteStatus.DRAFT,
  };
}

// ============================================================================
// PDF UTILITIES
// ============================================================================

/**
 * Generate quote filename
 */
export function generateQuoteFilename(quoteNumber: string): string {
  return `${quoteNumber}.pdf`;
}

/**
 * Generate quote PDF as Buffer (server-side)
 */
export async function generateQuotePDF(quote: QuoteWithDetails): Promise<Buffer> {
  const pdfDoc = QuoteDocument({ quote });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Calculate hash of PDF content for deduplication.
 * Only includes fields that affect the visual PDF output.
 *
 * @param quote - The quote data
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
    items: quote.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
      colors: item.colors,
      notes: item.notes,
      order: item.order,
      attachments: item.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        s3Url: att.s3Url,
      })),
    })),
    notes: quote.notes,
    terms: quote.terms,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}

// ============================================================================
// EXPIRY UTILITIES
// ============================================================================

/**
 * Calculate days until quote expires
 */
export function daysUntilExpiry(validUntil: Date): number {
  return differenceInDays(validUntil, startOfToday());
}

/**
 * Check if quote is expired
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
 * Get expired days count
 */
export function getExpiredDays(validUntil: Date): number {
  const days = daysUntilExpiry(validUntil);
  return days < 0 ? Math.abs(days) : 0;
}

/**
 * Check if quote needs attention (expiring soon)
 */
export function needsAttention(quote: QuoteListItem): boolean {
  if (quote.status !== QuoteStatus.SENT) {
    return false;
  }

  const daysUntil = daysUntilExpiry(quote.validUntil);
  return daysUntil <= 3 && daysUntil >= 0;
}

/**
 * Get urgency level based on expiration
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
 * Get quote validity status message
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
