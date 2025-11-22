import { isAfter, differenceInDays } from 'date-fns';
import type { QuoteListItem } from '../types';

/**
 * Calculate days until quote expires
 */
export function daysUntilExpiry(validUntil: Date): number {
  return differenceInDays(validUntil, new Date());
}

/**
 * Check if quote is expired
 */
export function isExpired(quote: QuoteListItem): boolean {
  if (quote.status === 'ACCEPTED' || quote.status === 'CONVERTED' || quote.status === 'EXPIRED') {
    return false;
  }

  return isAfter(new Date(), quote.validUntil);
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
  if (quote.status !== 'SENT') {
    return false;
  }

  const daysUntil = daysUntilExpiry(quote.validUntil);
  return daysUntil <= 3 && daysUntil >= 0;
}

/**
 * Get urgency level based on expiration
 */
export function getUrgency(quote: QuoteListItem): 'low' | 'medium' | 'high' | 'critical' {
  if (quote.status !== 'SENT' && quote.status !== 'DRAFT') {
    return 'low';
  }

  const daysUntil = daysUntilExpiry(quote.validUntil);
  if (daysUntil < 0) return 'critical';
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';

  return 'low';
}

/**
 * Check if quote can be edited
 */
export function canEdit(status: QuoteListItem['status']): boolean {
  return status === 'DRAFT';
}

/**
 * Check if quote can be sent
 */
export function canSend(status: QuoteListItem['status']): boolean {
  return status === 'DRAFT';
}

/**
 * Check if quote can be accepted
 */
export function canAccept(quote: QuoteListItem): boolean {
  return quote.status === 'SENT' && !isExpired(quote);
}

/**
 * Check if quote can be rejected
 */
export function canReject(quote: QuoteListItem): boolean {
  return quote.status === 'SENT' && !isExpired(quote);
}

/**
 * Check if quote can be converted to invoice
 */
export function canConvert(status: QuoteListItem['status']): boolean {
  return status === 'ACCEPTED';
}

/**
 * Check if quote can be deleted
 */
export function canDelete(status: QuoteListItem['status']): boolean {
  return status === 'DRAFT' || status === 'REJECTED' || status === 'EXPIRED';
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
