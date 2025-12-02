import { isAfter, differenceInDays } from 'date-fns';
import type { InvoiceListItem } from '../types.ts';

/**
 * Calculate days until due
 */
export function daysUntilDue(dueDate: Date): number {
  return differenceInDays(dueDate, new Date());
}

/**
 * Check if invoice is overdue
 */
export function isOverdue(invoice: InvoiceListItem): boolean {
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
    return false;
  }

  return isAfter(new Date(), invoice.dueDate);
}

/**
 * Get overdue days count
 */
export function getOverdueDays(dueDate: Date): number {
  const days = daysUntilDue(dueDate);
  return days < 0 ? Math.abs(days) : 0;
}

/**
 * Check if invoice needs reminder
 */
export function needsReminder(invoice: InvoiceListItem): boolean {
  if (invoice.status !== 'PENDING') {
    return false;
  }

  const daysUntil = daysUntilDue(invoice.dueDate);
  return daysUntil <= 7;
}

/**
 * Get urgency level
 */
export function getUrgency(invoice: InvoiceListItem): 'low' | 'medium' | 'high' | 'critical' {
  if (invoice.status !== 'PENDING') {
    return 'low';
  }

  const daysUntil = daysUntilDue(invoice.dueDate);
  if (daysUntil < 0) return 'critical';
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';

  return 'low';
}

// Re-export the PDF download function from the PDF helpers file
export { downloadInvoicePdf, downloadReceiptPdf } from './invoice-pdf-helpers';
