import { isAfter, differenceInDays } from 'date-fns';
import crypto from 'crypto';
import { absoluteUrl } from '@/lib/utils';
import { generatePdfBuffer } from '@/lib/pdf';
import { InvoiceDocument } from '@/templates/invoice-template';
import { ReceiptDocument } from '@/templates/receipt-template';
import { InvoiceStatus } from '@/prisma/client';
import type { InvoiceListItem, InvoiceWithDetails } from '@/features/finances/invoices/types';

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate invoice filename
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}

/**
 * Generate receipt filename using receipt number
 */
export function generateReceiptFilename(receiptNumber: string): string {
  return `${receiptNumber}.pdf`;
}

/**
 * Generate invoice PDF as Buffer (server-side)
 */
export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = InvoiceDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Generate receipt PDF as Buffer (server-side)
 */
export async function generateReceiptPDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = ReceiptDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Calculate hash of PDF content for deduplication.
 * Only includes fields that affect the visual PDF output.
 *
 * @param invoice - The invoice data
 * @param type - The document type ('invoice' or 'receipt')
 */
export function calculateContentHash(invoice: InvoiceWithDetails, type: 'invoice' | 'receipt' = 'invoice'): string {
  const baseData = {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount.toString(),
    customer: {
      firstName: invoice.customer.firstName,
      lastName: invoice.customer.lastName,
      email: invoice.customer.email,
    },
  };

  // Add type-specific fields
  const relevantData = type === 'invoice'
    ? {
        ...baseData,
        discount: invoice.discount.toString(),
        gst: invoice.gst.toString(),
        issuedDate: invoice.issuedDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: item.total.toString(),
        })),
        notes: invoice.notes,
        amountPaid: invoice.amountPaid.toString(),
        amountDue: invoice.amountDue.toString(),
        payments: invoice.payments?.map(payment => ({
          id: payment.id,
          amount: payment.amount.toString(),
          date: payment.date.toISOString(),
          method: payment.method,
          notes: payment.notes,
        })) || [],
      }
    : {
        ...baseData,
        paidDate: invoice.paidDate?.toISOString(),
        paymentMethod: invoice.paymentMethod,
        payments: invoice.payments?.map(payment => ({
          id: payment.id,
          amount: payment.amount.toString(),
          date: payment.date.toISOString(),
          method: payment.method,
          notes: payment.notes,
        })) || [],
      };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Valid status transitions for invoices.
 * Each key represents the current status, and the array contains valid next statuses.
 */
export const VALID_INVOICE_STATUS_TRANSITIONS: Record<
  InvoiceStatus,
  InvoiceStatus[]
> = {
  [InvoiceStatus.DRAFT]: [
    InvoiceStatus.PENDING,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.PENDING]: [
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.DRAFT,
  ],
  [InvoiceStatus.PARTIALLY_PAID]: [
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
  ],
  [InvoiceStatus.OVERDUE]: [
    InvoiceStatus.PAID,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.PENDING,
  ],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.CANCELLED]: [],
};

/**
 * Check if a status transition is valid.
 */
export function canTransitionInvoiceStatus(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus,
): boolean {
  // If statuses are the same, no transition needed
  if (fromStatus === toStatus) {
    return true;
  }

  const allowedTransitions = VALID_INVOICE_STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Get all valid next statuses for a given current status.
 */
export function getValidNextInvoiceStatuses(
  currentStatus: InvoiceStatus,
): InvoiceStatus[] {
  return VALID_INVOICE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed).
 */
export function isTerminalInvoiceStatus(status: InvoiceStatus): boolean {
  return VALID_INVOICE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid.
 */
export function validateInvoiceStatusTransition(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus,
): void {
  if (!canTransitionInvoiceStatus(fromStatus, toStatus)) {
    if (isTerminalInvoiceStatus(fromStatus)) {
      throw new Error(
        `Cannot change status from ${fromStatus} as it is a terminal state. Current status: ${fromStatus}, Attempted status: ${toStatus}`,
      );
    }
    throw new Error(
      `Invalid status transition from ${fromStatus} to ${toStatus}. Valid transitions: ${VALID_INVOICE_STATUS_TRANSITIONS[fromStatus].join(', ')}`,
    );
  }
}

// ============================================================================
// DUE DATE UTILITIES
// ============================================================================

/**
 * Calculate days until due
 */
export function daysUntilDue(dueDate: Date): number {
  return differenceInDays(dueDate, new Date());
}

/**
 * Check if invoice is overdue
 */
/**
 * Check if invoice is overdue
 */
export function isOverdue(invoice: InvoiceListItem): boolean {
  // If status is explicitly OVERDUE, it is overdue
  if (invoice.status === InvoiceStatus.OVERDUE) {
    return true;
  }
  
  // Paid or Cancelled are never overdue
  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
    return false;
  }

  // Otherwise check the date
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
  // Don't send reminders for paid or cancelled
  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) {
    return false;
  }

  // Always remind if overdue
  if (invoice.status === InvoiceStatus.OVERDUE || isOverdue(invoice)) {
    return true;
  }

  const daysUntil = daysUntilDue(invoice.dueDate);
  return daysUntil <= 7;
}

/**
 * Get urgency level
 */
export function getUrgency(invoice: InvoiceListItem): 'low' | 'medium' | 'high' | 'critical' {
  // Paid or cancelled has no urgency
  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) {
    return 'low';
  }

  // Explicit overdue status or past due date is critical
  if (invoice.status === InvoiceStatus.OVERDUE || isOverdue(invoice)) {
    return 'critical';
  }

  const daysUntil = daysUntilDue(invoice.dueDate);
  
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';

  return 'low';
}
