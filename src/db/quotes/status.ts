import { PrismaClient, QuoteStatus } from '@/prisma/client';
import { validateQuoteStatusTransition } from '@/features/finances/quotes/utils/quote-helpers';

import type { QuoteWithDetails } from '@/features/finances/quotes/types';

import { findQuoteById } from './queries';

/**
 * Mark a quote as accepted by the customer.
 * Validates the status transition and creates a status history entry in a transaction.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to mark as accepted
 * @param tenantId - The tenant ID to scope the query
 * @param updatedBy - Optional ID of the user who marked the quote as accepted
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function markQuoteAsAccepted(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!quote) {
    return null;
  }

  const previousStatus = quote.status;
  const updatedAt = new Date();

  validateQuoteStatusTransition(previousStatus, QuoteStatus.ACCEPTED);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedQuote = await tx.quote.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: QuoteStatus.ACCEPTED,
        updatedAt: updatedAt
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        status: QuoteStatus.ACCEPTED,
        previousStatus,
        updatedAt,
        updatedBy,
        notes: 'Quote accepted by customer'
      }
    });

    return updatedQuote;
  });

  if (!updated) {
    return null;
  }

  return findQuoteById(prisma, updated.id, tenantId);
}

/**
 * Mark a quote as on hold.
 * Validates the status transition and creates a status history entry with the optional reason.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to mark as on hold
 * @param tenantId - The tenant ID to scope the query
 * @param reason - Optional reason for putting the quote on hold
 * @param updatedBy - Optional ID of the user who put the quote on hold
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function markQuoteAsOnHold(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  reason?: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!quote) {
    return null;
  }

  const previousStatus = quote.status;
  const updatedAt = new Date();

  validateQuoteStatusTransition(previousStatus, QuoteStatus.ON_HOLD);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedQuote = await tx.quote.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: QuoteStatus.ON_HOLD,
        updatedAt: updatedAt
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        status: QuoteStatus.ON_HOLD,
        previousStatus,
        updatedAt,
        updatedBy,
        notes: reason || 'Quote put on hold by customer'
      }
    });

    return updatedQuote;
  });

  if (!updated) {
    return null;
  }

  return findQuoteById(prisma, updated.id, tenantId);
}

/**
 * Mark a quote as cancelled.
 * Validates the status transition and creates a status history entry with the optional cancellation reason.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to cancel
 * @param tenantId - The tenant ID to scope the query
 * @param cancelReason - Optional reason for cancelling the quote
 * @param updatedBy - Optional ID of the user who cancelled the quote
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function markQuoteAsCancelled(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  cancelReason?: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!quote) {
    return null;
  }

  const previousStatus = quote.status;

  validateQuoteStatusTransition(previousStatus, QuoteStatus.CANCELLED);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedQuote = await tx.quote.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: QuoteStatus.CANCELLED,
        cancelledDate: new Date(),
        cancelReason: cancelReason || 'Quote cancelled'
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        status: QuoteStatus.CANCELLED,
        previousStatus,
        updatedBy,
        notes: cancelReason || 'Quote cancelled'
      }
    });

    return updatedQuote;
  });

  if (!updated) {
    return null;
  }

  return findQuoteById(prisma, updated.id, tenantId);
}

/**
 * Mark a quote as rejected by the customer.
 * Validates the status transition and creates a status history entry with the rejection reason.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to mark as rejected
 * @param tenantId - The tenant ID to scope the query
 * @param rejectReason - The reason why the quote was rejected (required)
 * @param updatedBy - Optional ID of the user who marked the quote as rejected
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function markQuoteAsRejected(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  rejectReason: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!quote) {
    return null;
  }

  const previousStatus = quote.status;
  const updatedAt = new Date();

  validateQuoteStatusTransition(previousStatus, QuoteStatus.REJECTED);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedQuote = await tx.quote.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: QuoteStatus.REJECTED,
        updatedAt: updatedAt
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        status: QuoteStatus.REJECTED,
        previousStatus,
        updatedAt,
        updatedBy,
        notes: `Quote rejected by customer${rejectReason ? `: ${rejectReason}` : ''}`
      }
    });

    return updatedQuote;
  });

  return findQuoteById(prisma, updated.id, tenantId);
}

/**
 * Mark a quote as sent to the customer.
 * Validates the status transition and creates a status history entry.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to mark as sent
 * @param tenantId - The tenant ID to scope the query
 * @param updatedBy - Optional ID of the user who sent the quote
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function markQuoteAsSent(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!quote) {
    return null;
  }

  const previousStatus = quote.status;
  const sentDate = new Date();

  validateQuoteStatusTransition(previousStatus, QuoteStatus.SENT);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedQuote = await tx.quote.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: QuoteStatus.SENT,
        updatedAt: sentDate
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: id,
        status: QuoteStatus.SENT,
        previousStatus,
        updatedAt: sentDate,
        updatedBy,
        notes: 'Quote sent to customer'
      }
    });

    return updatedQuote;
  });

  if (!updated) {
    return null;
  }

  return findQuoteById(prisma, updated.id, tenantId);
}
