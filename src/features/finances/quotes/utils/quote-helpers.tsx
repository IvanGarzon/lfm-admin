import { isAfter, differenceInDays, startOfToday } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { QuoteListItem, QuoteWithDetails } from '../types';
import { QuoteDocument } from '@/templates/quote-template';
import { QuoteStatusSchema, type QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';

/**
 * Simpler constant for quote status values
 * Use QuoteStatus.DRAFT instead of QuoteStatusSchema.enum.DRAFT
 */
export const QuoteStatus = QuoteStatusSchema.enum;

/**
 * Get human-readable label for a quote status
 */
export function getQuoteStatusLabel(status: QuoteStatusType): string {
  const labels: Record<QuoteStatusType, string> = {
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
export function getQuotePermissions(status: QuoteStatusType | undefined | null): QuotePermissions {
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

/**
 * Download quote as PDF
 */
export async function downloadQuotePdf(quote: QuoteWithDetails): Promise<void> {
  try {
    const blob = await pdf(<QuoteDocument quote={quote} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quote.quoteNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    throw error;
  }
}

/**
 * Calculate days until quote expires
 */
export function daysUntilExpiry(validUntil: Date): number {
  return differenceInDays(validUntil, startOfToday());
}

/**
 * Check if quote is expired
 */
export function isExpired(status: QuoteStatusType, validUntil: Date): boolean {
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
