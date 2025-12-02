import type { InvoiceStatusType } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';
import { InvoiceStatusSchema } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';

/**
 * Valid status transitions for invoices.
 * Each key represents the current status, and the array contains valid next statuses.
 */
export const VALID_INVOICE_STATUS_TRANSITIONS: Record<
  InvoiceStatusType,
  InvoiceStatusType[]
> = {
  [InvoiceStatusSchema.enum.DRAFT]: [
    InvoiceStatusSchema.enum.PENDING,
    InvoiceStatusSchema.enum.CANCELLED,
  ],
  [InvoiceStatusSchema.enum.PENDING]: [
    InvoiceStatusSchema.enum.PAID,
    InvoiceStatusSchema.enum.OVERDUE,
    InvoiceStatusSchema.enum.CANCELLED,
    InvoiceStatusSchema.enum.DRAFT, // Allow reverting to draft for corrections
  ],
  [InvoiceStatusSchema.enum.OVERDUE]: [
    InvoiceStatusSchema.enum.PAID,
    InvoiceStatusSchema.enum.CANCELLED,
    InvoiceStatusSchema.enum.PENDING, // Allow reverting if due date extended
  ],
  [InvoiceStatusSchema.enum.PAID]: [], // Terminal state - cannot change once paid
  [InvoiceStatusSchema.enum.CANCELLED]: [], // Terminal state - cannot reactivate cancelled invoice
};

/**
 * Check if a status transition is valid.
 * @param fromStatus - The current status
 * @param toStatus - The desired new status
 * @returns true if the transition is allowed, false otherwise
 */
export function canTransitionInvoiceStatus(
  fromStatus: InvoiceStatusType,
  toStatus: InvoiceStatusType,
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
 * @param currentStatus - The current status
 * @returns Array of valid next statuses
 */
export function getValidNextInvoiceStatuses(
  currentStatus: InvoiceStatusType,
): InvoiceStatusType[] {
  return VALID_INVOICE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed).
 * @param status - The status to check
 * @returns true if the status is terminal, false otherwise
 */
export function isTerminalInvoiceStatus(status: InvoiceStatusType): boolean {
  return VALID_INVOICE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid.
 * @param fromStatus - The current status
 * @param toStatus - The desired new status
 * @throws Error if the transition is not valid
 */
export function validateInvoiceStatusTransition(
  fromStatus: InvoiceStatusType,
  toStatus: InvoiceStatusType,
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
