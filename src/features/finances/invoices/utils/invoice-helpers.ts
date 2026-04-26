/**
 * Invoice Helper Utilities
 *
 * Collection of utility functions for invoice management including:
 * - PDF generation (invoice and receipt documents)
 * - Status transition validation and management
 * - Due date calculations and overdue detection
 * - Content hashing for PDF deduplication
 * - Urgency and reminder calculations
 *
 * @module invoice-helpers
 */

import { isAfter, differenceInDays } from 'date-fns';
import crypto from 'crypto';
import { generatePdfBuffer } from '@/lib/pdf';

import { InvoiceStatusSchema, type InvoiceStatus } from '@/zod/schemas/enums/InvoiceStatus.schema';
import type { InvoiceListItem, InvoiceWithDetails } from '@/features/finances/invoices/types';
import { INVOICE_CONFIG } from '../config/invoice-config';
import { getTenantBranding } from '@/actions/tenant/queries';

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate standardized invoice filename from invoice number
 *
 * @param invoiceNumber - The invoice number (e.g., "INV-2024-001")
 * @returns PDF filename (e.g., "INV-2024-001.pdf")
 *
 * @example
 * ```ts
 * const filename = generateInvoiceFilename("INV-2024-001");
 * // Returns: "INV-2024-001.pdf"
 * ```
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}

/**
 * Generate standardized receipt filename from receipt number
 *
 * @param receiptNumber - The receipt number (e.g., "REC-2024-001")
 * @returns PDF filename (e.g., "REC-2024-001.pdf")
 *
 * @example
 * ```ts
 * const filename = generateReceiptFilename("REC-2024-001");
 * // Returns: "REC-2024-001.pdf"
 * ```
 */
export function generateReceiptFilename(receiptNumber: string): string {
  return `${receiptNumber}.pdf`;
}

/**
 * Generate invoice PDF document as a Buffer for server-side operations
 *
 * Uses lazy loading to import the invoice template only when needed,
 * reducing initial bundle size and improving performance.
 *
 * @param invoice - Complete invoice data with customer, items, and payments
 * @returns Promise resolving to PDF Buffer
 *
 * @example
 * ```ts
 * const pdfBuffer = await generateInvoicePDF(invoice);
 * // Upload to S3, send via email, etc.
 * ```
 */
export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  // Lazy load template only when generating PDF
  const invoiceTemplate = await import('@/templates/invoice-template');
  const { absoluteUrl } = await import('@/lib/utils');
  const logoUrl = absoluteUrl('/static/logo-green-800.png');
  const settings = await getTenantBranding();
  const pdfDoc = invoiceTemplate.InvoiceDocument({ invoice, settings, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Generate receipt PDF document as a Buffer for server-side operations
 *
 * Uses lazy loading to import the receipt template only when needed.
 * Receipts are simplified documents showing payment confirmation.
 *
 * @param invoice - Complete invoice data (must have payment information)
 * @returns Promise resolving to PDF Buffer
 *
 * @example
 * ```ts
 * const receiptBuffer = await generateReceiptPDF(invoice);
 * // Send receipt to customer
 * ```
 */
export async function generateReceiptPDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  // Lazy load template only when generating PDF
  const receiptTemplate = await import('@/templates/receipt-template');
  const { absoluteUrl } = await import('@/lib/utils');
  const logoUrl = absoluteUrl('/static/logo-green-800.png');
  const settings = await getTenantBranding();
  const pdfDoc = receiptTemplate.ReceiptDocument({ invoice, settings, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Calculate SHA-256 hash of PDF content for deduplication and caching
 *
 * Only includes fields that affect the visual PDF output, ignoring fields
 * like status, updatedAt, or internal IDs that don't appear in the document.
 * This enables efficient S3 caching - if content hasn't changed, reuse existing PDF.
 *
 * @param invoice - The invoice data with all details
 * @param type - The document type to hash ('invoice' or 'receipt')
 * @returns 64-character hex string (SHA-256 hash)
 *
 * @example
 * ```ts
 * const hash1 = calculateContentHash(invoice, 'invoice');
 * const hash2 = calculateContentHash(invoice, 'invoice');
 * // hash1 === hash2 if content is identical
 *
 * // After updating invoice status (doesn't affect PDF)
 * const hash3 = calculateContentHash(updatedInvoice, 'invoice');
 * // hash1 === hash3 (status not included in hash)
 * ```
 */
export function calculateContentHash(
  invoice: InvoiceWithDetails,
  type: 'invoice' | 'receipt' = 'invoice',
): string {
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
  const relevantData =
    type === 'invoice'
      ? {
          ...baseData,
          discount: invoice.discount.toString(),
          gst: invoice.gst.toString(),
          issuedDate: invoice.issuedDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            total: item.total.toString(),
          })),
          notes: invoice.notes,
          amountPaid: invoice.amountPaid.toString(),
          amountDue: invoice.amountDue.toString(),
          payments:
            invoice.payments?.map((payment) => ({
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
          payments:
            invoice.payments?.map((payment) => ({
              id: payment.id,
              amount: payment.amount.toString(),
              date: payment.date.toISOString(),
              method: payment.method,
              notes: payment.notes,
            })) || [],
        };

  return crypto.createHash('sha256').update(JSON.stringify(relevantData)).digest('hex');
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Valid status transitions for invoices
 *
 * Defines allowed state transitions to maintain invoice workflow integrity.
 * Each key represents the current status, and the array contains valid next statuses.
 *
 * Workflow:
 * - DRAFT → PENDING (sent to customer) or CANCELLED
 * - PENDING → PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, or back to DRAFT
 * - PARTIALLY_PAID → PAID (full payment), OVERDUE, CANCELLED, or stay PARTIALLY_PAID
 * - OVERDUE → PAID, PARTIALLY_PAID, CANCELLED, or back to PENDING
 * - PAID → Terminal state (no transitions)
 * - CANCELLED → Terminal state (no transitions)
 *
 * @example
 * ```ts
 * const allowedStatuses = VALID_INVOICE_STATUS_TRANSITIONS[InvoiceStatusSchema.enum.PENDING];
 * // Returns: [PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, DRAFT]
 * ```
 */
export const VALID_INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatusSchema.enum.DRAFT]: [
    InvoiceStatusSchema.enum.PENDING,
    InvoiceStatusSchema.enum.CANCELLED,
  ],
  [InvoiceStatusSchema.enum.PENDING]: [
    InvoiceStatusSchema.enum.PARTIALLY_PAID,
    InvoiceStatusSchema.enum.PAID,
    InvoiceStatusSchema.enum.OVERDUE,
    InvoiceStatusSchema.enum.CANCELLED,
    InvoiceStatusSchema.enum.DRAFT,
  ],
  [InvoiceStatusSchema.enum.PARTIALLY_PAID]: [
    InvoiceStatusSchema.enum.PARTIALLY_PAID,
    InvoiceStatusSchema.enum.PAID,
    InvoiceStatusSchema.enum.OVERDUE,
    InvoiceStatusSchema.enum.CANCELLED,
  ],
  [InvoiceStatusSchema.enum.OVERDUE]: [
    InvoiceStatusSchema.enum.PAID,
    InvoiceStatusSchema.enum.PARTIALLY_PAID,
    InvoiceStatusSchema.enum.CANCELLED,
    InvoiceStatusSchema.enum.PENDING,
  ],
  [InvoiceStatusSchema.enum.PAID]: [],
  [InvoiceStatusSchema.enum.CANCELLED]: [],
};

/**
 * Check if a status transition is valid according to workflow rules
 *
 * @param fromStatus - Current invoice status
 * @param toStatus - Desired next status
 * @returns True if transition is allowed, false otherwise
 *
 * @example
 * ```ts
 * canTransitionInvoiceStatus(InvoiceStatusSchema.enum.PENDING, InvoiceStatusSchema.enum.PAID);
 * // Returns: true
 *
 * canTransitionInvoiceStatus(InvoiceStatusSchema.enum.PAID, InvoiceStatusSchema.enum.PENDING);
 * // Returns: false (PAID is terminal)
 * ```
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
 * Get all valid next statuses for a given current status
 *
 * @param currentStatus - The current invoice status
 * @returns Array of allowed next statuses
 *
 * @example
 * ```ts
 * const nextStatuses = getValidNextInvoiceStatuses(InvoiceStatusSchema.enum.PARTIALLY_PAID);
 * // Returns: [InvoiceStatusSchema.enum.PARTIALLY_PAID, InvoiceStatusSchema.enum.PAID, InvoiceStatusSchema.enum.OVERDUE, InvoiceStatusSchema.enum.CANCELLED]
 * ```
 */
export function getValidNextInvoiceStatuses(currentStatus: InvoiceStatus): InvoiceStatus[] {
  return VALID_INVOICE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 *
 * Terminal statuses: PAID, CANCELLED
 *
 * @param status - The invoice status to check
 * @returns True if the status is terminal
 *
 * @example
 * ```ts
 * isTerminalInvoiceStatus(InvoiceStatusSchema.enum.PAID);      // Returns: true
 * isTerminalInvoiceStatus(InvoiceStatusSchema.enum.CANCELLED); // Returns: true
 * isTerminalInvoiceStatus(InvoiceStatusSchema.enum.PENDING);   // Returns: false
 * ```
 */
export function isTerminalInvoiceStatus(status: InvoiceStatus): boolean {
  return VALID_INVOICE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid
 *
 * Use this in mutation handlers to ensure data integrity.
 * Provides specific error messages for terminal states vs invalid transitions.
 *
 * @param fromStatus - Current invoice status
 * @param toStatus - Desired next status
 * @throws Error if transition is invalid, with specific message about why
 *
 * @example
 * ```ts
 * try {
 *   validateInvoiceStatusTransition(currentStatus, newStatus);
 *   // Safe to proceed with status update
 * } catch (error) {
 *   // Handle invalid transition
 *   console.error(error.message);
 * }
 * ```
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
 * Calculate number of days until invoice due date
 *
 * Positive values indicate future due dates, negative values indicate overdue.
 *
 * @param dueDate - The invoice due date
 * @returns Number of days (positive = future, negative = overdue)
 *
 * @example
 * ```ts
 * const days = daysUntilDue(new Date('2024-12-31'));
 * // Returns: 10 (if today is Dec 21)
 * // Returns: -5 (if today is Jan 5)
 * ```
 */
export function daysUntilDue(dueDate: Date): number {
  return differenceInDays(dueDate, new Date());
}

/**
 * Check if invoice is overdue based on status and due date
 *
 * An invoice is considered overdue if:
 * - Status is explicitly OVERDUE, OR
 * - Status is PENDING/PARTIALLY_PAID and current date is past due date
 *
 * PAID and CANCELLED invoices are never considered overdue.
 *
 * @param invoice - The invoice to check (list item with status and dueDate)
 * @returns True if invoice is overdue
 *
 * @example
 * ```ts
 * const invoice = { status: InvoiceStatusSchema.enum.PENDING, dueDate: pastDate };
 * isOverdue(invoice); // Returns: true
 *
 * const paidInvoice = { status: InvoiceStatusSchema.enum.PAID, dueDate: pastDate };
 * isOverdue(paidInvoice); // Returns: false (paid invoices are never overdue)
 * ```
 */
export function isOverdue(invoice: InvoiceListItem): boolean {
  // If status is explicitly OVERDUE, it is overdue
  if (invoice.status === InvoiceStatusSchema.enum.OVERDUE) {
    return true;
  }

  // Paid or Cancelled are never overdue
  if (
    invoice.status === InvoiceStatusSchema.enum.PAID ||
    invoice.status === InvoiceStatusSchema.enum.CANCELLED
  ) {
    return false;
  }

  // Otherwise check the date
  return isAfter(new Date(), invoice.dueDate);
}

/**
 * Get the number of days an invoice is overdue
 *
 * Returns 0 if invoice is not yet overdue (due date is in the future).
 *
 * @param dueDate - The invoice due date
 * @returns Number of days overdue (0 if not overdue)
 *
 * @example
 * ```ts
 * const pastDate = new Date('2024-01-01'); // If today is Jan 10
 * getOverdueDays(pastDate); // Returns: 9
 *
 * const futureDate = new Date('2024-12-31');
 * getOverdueDays(futureDate); // Returns: 0
 * ```
 */
export function getOverdueDays(dueDate: Date): number {
  const days = daysUntilDue(dueDate);
  return days < 0 ? Math.abs(days) : 0;
}

/**
 * Check if invoice needs a payment reminder to be sent
 *
 * Invoices need reminders if:
 * - Status is OVERDUE or past due date, OR
 * - Status is PENDING/PARTIALLY_PAID and within reminder threshold days
 *
 * PAID, CANCELLED, and DRAFT invoices never need reminders.
 *
 * @param invoice - The invoice to check
 * @returns True if a reminder should be sent
 *
 * @example
 * ```ts
 * const invoice = {
 *   status: InvoiceStatusSchema.enum.PENDING,
 *   dueDate: threeDaysFromNow
 * };
 * needsReminder(invoice); // Returns: true (within threshold)
 * ```
 */
export function needsReminder(invoice: InvoiceListItem): boolean {
  // Don't send reminders for paid or cancelled
  if (
    invoice.status === InvoiceStatusSchema.enum.PAID ||
    invoice.status === InvoiceStatusSchema.enum.CANCELLED ||
    invoice.status === InvoiceStatusSchema.enum.DRAFT
  ) {
    return false;
  }

  // Always remind if overdue
  if (invoice.status === InvoiceStatusSchema.enum.OVERDUE || isOverdue(invoice)) {
    return true;
  }

  const daysUntil = daysUntilDue(invoice.dueDate);
  return daysUntil <= INVOICE_CONFIG.REMINDER_THRESHOLD_DAYS;
}

/**
 * Get urgency level for an invoice based on status and days until due
 *
 * Urgency levels:
 * - **critical**: Overdue invoices (OVERDUE status or past due date)
 * - **high**: Due within urgency high threshold (configured in INVOICE_CONFIG)
 * - **medium**: Due within urgency medium threshold (configured in INVOICE_CONFIG)
 * - **low**: All other cases (PAID, CANCELLED, DRAFT, or far future due dates)
 *
 * @param invoice - The invoice to evaluate
 * @returns Urgency level: 'low' | 'medium' | 'high' | 'critical'
 *
 * @example
 * ```ts
 * const overdueInvoice = { status: InvoiceStatusSchema.enum.OVERDUE, dueDate: pastDate };
 * getUrgency(overdueInvoice); // Returns: 'critical'
 *
 * const upcomingInvoice = { status: InvoiceStatusSchema.enum.PENDING, dueDate: twoDaysFromNow };
 * getUrgency(upcomingInvoice); // Returns: 'high' (if threshold is 3 days)
 *
 * const paidInvoice = { status: InvoiceStatusSchema.enum.PAID, dueDate: anyDate };
 * getUrgency(paidInvoice); // Returns: 'low'
 * ```
 */
export function getUrgency(invoice: InvoiceListItem): 'low' | 'medium' | 'high' | 'critical' {
  // Paid or cancelled has no urgency
  if (
    invoice.status === InvoiceStatusSchema.enum.PAID ||
    invoice.status === InvoiceStatusSchema.enum.CANCELLED ||
    invoice.status === InvoiceStatusSchema.enum.DRAFT
  ) {
    return 'low';
  }

  // Explicit overdue status or past due date is critical
  if (invoice.status === InvoiceStatusSchema.enum.OVERDUE || isOverdue(invoice)) {
    return 'critical';
  }

  const daysUntil = daysUntilDue(invoice.dueDate);

  if (daysUntil <= INVOICE_CONFIG.URGENCY_HIGH_DAYS) return 'high';
  if (daysUntil <= INVOICE_CONFIG.URGENCY_MEDIUM_DAYS) return 'medium';

  return 'low';
}
