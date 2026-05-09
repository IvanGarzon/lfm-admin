import { InvoiceStatus, PrismaClient } from '@/prisma/client';
import { validateInvoiceStatusTransition } from '@/features/finances/invoices/utils/invoice-helpers';

import type { InvoiceWithDetails } from '@/features/finances/invoices/types';

import { findInvoiceByIdWithDetails } from './queries';

/**
 * Mark an invoice as pending (revert from OVERDUE or DRAFT status).
 * Validates status transition before updating.
 * Typically used when extending due dates or correcting status.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @param updatedBy - Optional user ID who triggered this change
 * @returns A promise that resolves to the updated invoice with details, or null if not found
 */
export async function markInvoiceAsPending(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  updatedBy?: string
): Promise<InvoiceWithDetails | null> {
  // Get current invoice to validate status transition
  const currentInvoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!currentInvoice) {
    return null;
  }

  // Validate status transition
  validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.PENDING);

  const updated = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: InvoiceStatus.PENDING,
        updatedAt: new Date()
      }
    });

    await tx.invoiceStatusHistory.create({
      data: {
        invoiceId: id,
        status: InvoiceStatus.PENDING,
        previousStatus: currentInvoice.status,
        updatedAt: new Date(),
        updatedBy,
        notes: 'Marked as pending'
      }
    });

    return invoice;
  });

  if (!updated) {
    return null;
  }

  return findInvoiceByIdWithDetails(prisma, updated.id, tenantId);
}

/**
 * Revert an invoice to draft status.
 * Only possible from PENDING or OVERDUE status.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @param updatedBy - Optional user ID who triggered this change
 * @returns A promise that resolves to the updated invoice with details, or null if not found
 */
export async function markInvoiceAsDraft(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  updatedBy?: string
): Promise<InvoiceWithDetails | null> {
  const currentInvoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!currentInvoice) {
    return null;
  }

  validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.DRAFT);

  const updated = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status: InvoiceStatus.DRAFT,
        updatedAt: new Date()
      }
    });

    await tx.invoiceStatusHistory.create({
      data: {
        invoiceId: id,
        status: InvoiceStatus.DRAFT,
        previousStatus: currentInvoice.status,
        updatedAt: new Date(),
        updatedBy,
        notes: 'Reverted to draft'
      }
    });

    return invoice;
  });

  if (!updated) {
    return null;
  }

  return findInvoiceByIdWithDetails(prisma, updated.id, tenantId);
}

/**
 * Cancel an invoice with a reason and date.
 * Validates status transition before updating (PAID invoices cannot be cancelled).
 * Cancelled invoices are in a terminal state and cannot be changed.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @param cancelReason - The reason for cancellation (required for audit purposes)
 * @param updatedBy - Optional user ID who triggered this change
 * @returns A promise that resolves to the updated invoice with details, or null if not found
 */
export async function cancelInvoice(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  cancelReason: string,
  updatedBy?: string
): Promise<InvoiceWithDetails | null> {
  // Get current invoice to validate status transition
  const currentInvoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { status: true }
  });

  if (!currentInvoice) {
    return null;
  }

  // Validate status transition
  validateInvoiceStatusTransition(currentInvoice.status, InvoiceStatus.CANCELLED);

  const status = InvoiceStatus.CANCELLED;
  const today = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id, tenantId, deletedAt: null },
      data: {
        status,
        cancelReason,
        cancelledDate: today
      }
    });

    await tx.invoiceStatusHistory.create({
      data: {
        invoiceId: id,
        status,
        previousStatus: currentInvoice.status,
        updatedAt: today,
        updatedBy,
        notes: `Cancelled: ${cancelReason}`
      }
    });

    return invoice;
  });

  return findInvoiceByIdWithDetails(prisma, updated.id, tenantId);
}

/**
 * Update the status of multiple invoices in bulk with proper validation and audit trail.
 * Validates each status transition and creates history entries for successful updates.
 * Skips invoices with invalid transitions instead of failing the entire operation.
 * @param prisma - The Prisma client instance
 * @param ids - Array of invoice IDs to update
 * @param tenantId - The tenant ID to scope all queries (prevents cross-tenant access)
 * @param status - The new status to set for all invoices
 * @param updatedBy - Optional user ID who triggered this change
 * @returns A promise that resolves to results array with success/failure for each invoice
 */
export async function bulkUpdateInvoiceStatus(
  prisma: PrismaClient,
  ids: string[],
  tenantId: string,
  status: InvoiceStatus,
  updatedBy?: string
): Promise<{ id: string; success: boolean; error?: string }[]> {
  return prisma.$transaction(async (tx) => {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        // Fetch current invoice status scoped to tenant
        const invoice = await tx.invoice.findUnique({
          where: { id, tenantId, deletedAt: null },
          select: { status: true }
        });

        if (!invoice) {
          results.push({ id, success: false, error: 'Invoice not found' });
          continue;
        }

        // Skip if status is already the target status
        if (invoice.status === status) {
          results.push({ id, success: true });
          continue;
        }

        // Validate status transition
        try {
          validateInvoiceStatusTransition(invoice.status, status);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid status transition';
          results.push({ id, success: false, error: errorMessage });
          continue;
        }

        // Update invoice status scoped to tenant
        await tx.invoice.update({
          where: { id, tenantId },
          data: {
            status,
            updatedAt: new Date()
          }
        });

        // Create audit trail entry
        await tx.invoiceStatusHistory.create({
          data: {
            invoiceId: id,
            status,
            previousStatus: invoice.status,
            updatedAt: new Date(),
            updatedBy,
            notes: 'Bulk status update'
          }
        });

        results.push({ id, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id, success: false, error: errorMessage });
      }
    }

    return results;
  });
}
