import { InvoiceStatus, PrismaClient } from '@/prisma/client';
import { isPrismaError } from '@/lib/error-handler';
import { validateInvoiceStatusTransition } from '@/features/finances/invoices/utils/invoice-helpers';

import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';

import { generateInvoiceNumber } from './identifiers';
import { findInvoiceByIdWithDetails } from './queries';

/**
 * Create a new invoice with associated line items in a single transaction.
 * Automatically generates invoice number and calculates total amount.
 * Retries up to 3 times if invoice number collision occurs.
 * @param prisma - The Prisma client instance
 * @param data - The invoice data including items to create
 * @param tenantId - The tenant ID to scope the creation
 * @param createdBy - Optional user ID who created the invoice
 * @returns A promise that resolves to an object with the new invoice ID and number
 */
export async function createInvoiceWithItems(
  prisma: PrismaClient,
  data: CreateInvoiceInput,
  tenantId: string,
  createdBy?: string
): Promise<{ id: string; invoiceNumber: string }> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(prisma, tenantId);

      // Calculate total amount
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const gstPercentage = Number(data.gst || 0);
      const gstAmount = (subtotal * gstPercentage) / 100;
      const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

      return await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            tenantId,
            invoiceNumber,
            customerId: data.customerId,
            status: data.status,
            amount: totalAmount,
            amountDue: totalAmount, // Initial amountDue is full amount
            amountPaid: 0,
            currency: data.currency,
            gst: data.gst,
            discount: data.discount,
            issuedDate: data.issuedDate,
            dueDate: data.dueDate,
            notes: data.notes ?? null,
            remindersSent: 0,
            items: {
              create: data.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                productId: item.productId
              }))
            }
          },
          select: {
            id: true,
            invoiceNumber: true
          }
        });

        // Create initial status history entry
        await tx.invoiceStatusHistory.create({
          data: {
            invoiceId: invoice.id,
            status: data.status,
            previousStatus: null,
            updatedAt: new Date(),
            updatedBy: createdBy,
            notes: 'Invoice created'
          }
        });

        return invoice;
      });
    } catch (error: unknown) {
      // Handle unique constraint violation (invoice number collision)
      if (isPrismaError(error) && error.code === 'P2002') {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error('Failed to generate a unique invoice number. Please try again.');
        }
        continue; // Retry with a new number
      }

      // Re-throw other errors
      throw error;
    }
  }

  throw new Error('Failed to create invoice');
}

/**
 * Update an existing invoice and its line items in a transaction.
 * Handles adding, updating, and deleting items as needed.
 * Status changes are NOT allowed through this method — use specific status methods instead.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice to update
 * @param data - The updated invoice data including items
 * @param tenantId - The tenant ID to scope the update
 * @returns A promise that resolves to the updated invoice with details, or null if not found
 */
export async function updateInvoiceWithItems(
  prisma: PrismaClient,
  id: string,
  data: UpdateInvoiceInput,
  tenantId: string
): Promise<InvoiceWithDetails | null> {
  // Calculate total amount
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gstPercentage = Number(data.gst || 0);
  const gstAmount = (subtotal * gstPercentage) / 100;
  const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

  // Update invoice with items in a transaction
  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // 1. Fetch current invoice to check status and locking
    const currentInvoice = await tx.invoice.findUnique({
      where: { id, deletedAt: null },
      select: { status: true, amountPaid: true }
    });

    if (!currentInvoice) {
      throw new Error(`Invoice ${id} not found`);
    }

    // 2. Determine if the invoice content is locked.
    // Invoices in PENDING, OVERDUE, PAID, PARTIALLY_PAID, or CANCELLED are locked.
    const lockedStatuses: InvoiceStatus[] = [
      InvoiceStatus.PENDING,
      InvoiceStatus.OVERDUE,
      InvoiceStatus.PAID,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.CANCELLED
    ];

    const isLocked = lockedStatuses.includes(currentInvoice.status);

    // 3. If locked, we only allow status transitions (like to CANCELLED),
    // not editing of content (items, gst, discount, customer).
    if (isLocked) {
      // Items change is detected if any items are passed (simplified check)
      const hasContentChanges =
        (data.customerId && data.customerId !== undefined) ||
        data.gst !== undefined ||
        data.discount !== undefined ||
        (data.items && data.items.length > 0);

      if (hasContentChanges) {
        throw new Error(
          `This invoice is ${currentInvoice.status.toLowerCase()} and its content cannot be modified. Revert to draft first if possible.`
        );
      }

      // If they only wanted to change status
      if (data.status && data.status !== currentInvoice.status) {
        validateInvoiceStatusTransition(currentInvoice.status, data.status);

        await tx.invoice.update({
          where: { id },
          data: {
            status: data.status,
            updatedAt: new Date()
          }
        });

        await tx.invoiceStatusHistory.create({
          data: {
            invoiceId: id,
            status: data.status,
            previousStatus: currentInvoice.status,
            updatedAt: new Date(),
            notes: `Status updated via edit: ${data.status}`
          }
        });
      }

      return { id };
    }

    // 4. Regular update for non-locked (DRAFT) invoices
    const statusChanged = currentInvoice.status !== data.status;
    const previousStatus = currentInvoice.status;

    if (statusChanged) {
      validateInvoiceStatusTransition(previousStatus, data.status);
    }

    // Recalculate amountDue
    const amountPaid = Number(currentInvoice.amountPaid);
    const amountDue = totalAmount - amountPaid;

    // Separate existing items from new items
    const existingItems = data.items.filter((item) => item.id);
    const newItems = data.items.filter((item) => !item.id);
    const existingItemIds = existingItems.map((item) => item.id!);

    // Delete items that are no longer in the list
    await tx.invoiceItem.deleteMany({
      where: {
        invoiceId: data.id,
        id: { notIn: existingItemIds }
      }
    });

    // Update invoice details
    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        customerId: data.customerId,
        status: data.status || currentInvoice.status,
        amount: totalAmount,
        currency: data.currency,
        issuedDate: data.issuedDate,
        dueDate: data.dueDate,
        notes: data.notes,
        gst: data.gst,
        discount: data.discount,
        amountDue,
        updatedAt: new Date()
      }
    });

    // Update existing items
    for (let index = 0; index < existingItems.length; index++) {
      const item = existingItems[index];
      await tx.invoiceItem.update({
        where: { id: item.id },
        data: {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          productId: item.productId,
          updatedAt: new Date()
        }
      });
    }

    // Create new items
    if (newItems.length > 0) {
      await tx.invoiceItem.createMany({
        data: newItems.map((item) => {
          return {
            invoiceId: data.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId
          };
        })
      });
    }

    return invoice;
  });

  if (!updatedInvoice) {
    return null;
  }

  return await findInvoiceByIdWithDetails(prisma, updatedInvoice.id, tenantId);
}
