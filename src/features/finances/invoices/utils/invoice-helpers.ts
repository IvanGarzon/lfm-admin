import { isAfter, differenceInDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { InvoiceStatus } from '@/prisma/client';

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
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.DRAFT, // Allow reverting to draft for corrections
  ],
  [InvoiceStatus.OVERDUE]: [
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.PENDING, // Allow reverting if due date extended
  ],
  [InvoiceStatus.PAID]: [], // Terminal state - cannot change once paid
  [InvoiceStatus.CANCELLED]: [], // Terminal state - cannot reactivate cancelled invoice
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
// RECEIPT NUMBER GENERATION
// ============================================================================

/**
 * Generates a unique receipt number in the format: XXXX-XXXX-XXXX
 * Uses only numbers for simplicity and uniqueness.
 */
export async function generateReceiptNumber(): Promise<string> {
  let receiptNumber = '';
  let isUnique = false;

  const generateNumberSegment = () => Math.floor(1000 + Math.random() * 9000);

  while (!isUnique) {
    // Generate 12 random digits
    const part1 = generateNumberSegment();
    const part2 = generateNumberSegment();
    const part3 = generateNumberSegment();

    receiptNumber = `${part1}-${part2}-${part3}`;

    // Check if this number already exists
    const existing = await prisma.invoice.findUnique({
      where: { receiptNumber },
      select: { id: true },
    });

    isUnique = !existing;
  }

  return receiptNumber;
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
