import type { QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';

/**
 * Valid status transitions for quotes.
 * Each key represents the current status, and the array contains valid next statuses.
 */
export const VALID_QUOTE_STATUS_TRANSITIONS: Record<QuoteStatusType, QuoteStatusType[]> = {
  [QuoteStatusSchema.enum.DRAFT]: [
    QuoteStatusSchema.enum.SENT,
    QuoteStatusSchema.enum.REJECTED,
    QuoteStatusSchema.enum.EXPIRED,
    QuoteStatusSchema.enum.CANCELLED,
  ],
  [QuoteStatusSchema.enum.SENT]: [
    QuoteStatusSchema.enum.ON_HOLD,
    QuoteStatusSchema.enum.ACCEPTED,
    QuoteStatusSchema.enum.REJECTED,
    QuoteStatusSchema.enum.EXPIRED,
    QuoteStatusSchema.enum.CANCELLED,
  ],
  [QuoteStatusSchema.enum.ON_HOLD]: [
    QuoteStatusSchema.enum.ACCEPTED,
    QuoteStatusSchema.enum.CANCELLED,
  ],
  [QuoteStatusSchema.enum.ACCEPTED]: [
    QuoteStatusSchema.enum.CONVERTED,
    QuoteStatusSchema.enum.CANCELLED,
  ],
  [QuoteStatusSchema.enum.REJECTED]: [QuoteStatusSchema.enum.CANCELLED], // Can create version from rejected
  [QuoteStatusSchema.enum.EXPIRED]: [QuoteStatusSchema.enum.CANCELLED], // Can create version from expired
  [QuoteStatusSchema.enum.CANCELLED]: [], // Terminal state
  [QuoteStatusSchema.enum.CONVERTED]: [], // Terminal state
};

/**
 * Check if a status transition is valid.
 * @param fromStatus - The current status
 * @param toStatus - The desired new status
 * @returns true if the transition is allowed, false otherwise
 */
export function canTransitionQuoteStatus(
  fromStatus: QuoteStatusType,
  toStatus: QuoteStatusType,
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
 * @param currentStatus - The current status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: QuoteStatusType): QuoteStatusType[] {
  return VALID_QUOTE_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions allowed).
 * @param status - The status to check
 * @returns true if the status is terminal, false otherwise
 */
export function isTerminalQuoteStatus(status: QuoteStatusType): boolean {
  return VALID_QUOTE_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Validate a status transition and throw an error if invalid.
 * @param fromStatus - The current status
 * @param toStatus - The desired new status
 * @throws Error if the transition is not valid
 */
export function validateQuoteStatusTransition(
  fromStatus: QuoteStatusType,
  toStatus: QuoteStatusType,
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
