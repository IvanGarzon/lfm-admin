import {
  Invoice,
  InvoiceStatus,
  Prisma,
  PrismaClient,
  TransactionType,
  TransactionStatus,
  DocumentKind
} from '@/prisma/client';
import { validateInvoiceStatusTransition } from '@/features/finances/invoices/utils/invoice-helpers';
import { INVOICE_CONFIG } from '@/features/finances/invoices/config/invoice-config';
import { TransactionRepository } from '@/repositories/transaction-repository';
import {
  getOrGenerateInvoicePdf,
  getOrGenerateReceiptPdf
} from '@/features/finances/invoices/services/invoice-pdf.service';
import { logger } from '@/lib/logger';

import type { InvoiceWithDetails } from '@/features/finances/invoices/types';

import { findInvoiceByIdWithDetails } from './queries';
import { generateInvoiceReceiptNumber, generateInvoiceNumber } from './identifiers';

/**
 * Add a payment to an invoice and update its status accordingly.
 * Automatically transitions status from PENDING/OVERDUE to PARTIALLY_PAID or PAID.
 * @param prisma - The Prisma client instance
 * @param invoiceId - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @param amount - The payment amount
 * @param method - The payment method used
 * @param date - The date the payment was made
 * @param notes - Optional notes about the payment
 * @param updatedBy - Optional user ID who recorded this payment
 * @param idempotencyKey - Optional idempotency key to prevent duplicate payments
 * @returns A promise that resolves to the updated invoice with full details
 */
export async function addInvoicePayment(
  prisma: PrismaClient,
  invoiceId: string,
  tenantId: string,
  amount: number,
  method: string,
  date: Date,
  notes?: string,
  updatedBy?: string,
  idempotencyKey?: string
): Promise<InvoiceWithDetails> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId, deletedAt: null },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      amount: true,
      amountPaid: true,
      receiptNumber: true,
      currency: true,
      customer: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found for tenant ${tenantId}`);
  }

  const previousStatus = invoice.status;
  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const newAmountDue = Number(invoice.amount) - newAmountPaid;

  // Determine new status
  let newStatus = invoice.status;
  if (newAmountDue <= INVOICE_CONFIG.PAYMENT_TOLERANCE) {
    // Floating point tolerance
    newStatus = InvoiceStatus.PAID;
  } else if (newAmountDue > 0 && newAmountPaid > 0) {
    newStatus = InvoiceStatus.PARTIALLY_PAID;
  }

  const statusChanged = previousStatus !== newStatus;

  // Validate status transition if status is changing
  if (statusChanged) {
    validateInvoiceStatusTransition(previousStatus, newStatus);
  } else {
    // If status is not changing, only allow it for PARTIALLY_PAID invoices
    // (adding another partial payment to an already partially paid invoice)
    if (previousStatus !== InvoiceStatus.PARTIALLY_PAID) {
      throw new Error(
        `Cannot add payment to invoice with status ${previousStatus}. The payment would not change the invoice status.`
      );
    }
  }

  // Generate receipt number if invoice will be fully paid and doesn't have one yet
  let receiptNumber = invoice.receiptNumber;
  if (newStatus === InvoiceStatus.PAID && !receiptNumber) {
    receiptNumber = await generateInvoiceReceiptNumber();
  }

  // Store the transaction ID for later document attachment
  let createdTransactionId: string | null = null;

  // Transaction to create payment and update invoice
  await prisma.$transaction(async (tx) => {
    // Check for existing payment with same idempotency key
    if (idempotencyKey) {
      const existingPayment = await tx.payment.findUnique({
        where: { idempotencyKey }
      });

      if (existingPayment) {
        // Payment already recorded, just return early from transaction
        return;
      }
    }

    await tx.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        date,
        notes,
        idempotencyKey
      }
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        updatedAt: new Date(),
        // If fully paid, set paidDate, paymentMethod, and receiptNumber
        ...(newStatus === InvoiceStatus.PAID
          ? {
              paidDate: date,
              paymentMethod: method,
              receiptNumber
            }
          : {})
      }
    });

    // Create status history entry if:
    // 1. Status actually changed, OR
    // 2. Status is PARTIALLY_PAID (to track each partial payment even if status doesn't change)
    if (statusChanged || newStatus === InvoiceStatus.PARTIALLY_PAID) {
      await tx.invoiceStatusHistory.create({
        data: {
          invoiceId,
          status: newStatus,
          previousStatus,
          updatedAt: new Date(),
          updatedBy,
          notes: `Payment of ${amount} ${invoice.currency} received. ${newStatus === InvoiceStatus.PAID ? 'Invoice fully paid.' : 'Invoice partially paid.'}`
        }
      });
    }

    // Transaction creation
    const categoryName =
      newStatus === InvoiceStatus.PAID ? 'Invoice Fully Payment' : 'Invoice Partial Payment';

    // Find or create the transaction category
    const category = await tx.transactionCategory.upsert({
      where: { tenantId_name: { tenantId, name: categoryName } },
      update: {},
      create: {
        name: categoryName,
        description: `Automatically created for ${categoryName.toLowerCase()}`,
        tenantId
      }
    });

    // Generate transaction reference number
    const referenceNumber = await TransactionRepository.generateReferenceNumber();

    const customerName = invoice.customer
      ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
      : 'Unknown Customer';

    const createdTransaction = await tx.transaction.create({
      data: {
        tenantId,
        type: TransactionType.INCOME,
        date: date,
        amount: new Prisma.Decimal(amount),
        currency: invoice.currency || 'AUD',
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        payee: customerName,
        status: TransactionStatus.COMPLETED,
        referenceNumber: referenceNumber,
        referenceId: receiptNumber || undefined,
        invoiceId: invoiceId,
        categories: {
          create: [
            {
              categoryId: category.id
            }
          ]
        }
      }
    });

    // Store transaction ID for document attachment after transaction completes
    createdTransactionId = createdTransaction.id;
  });

  // Fetch the updated invoice with full details
  const updated = await findInvoiceByIdWithDetails(prisma, invoiceId, tenantId);
  if (!updated) {
    throw new Error('Failed to retrieve updated invoice');
  }

  // Generate and attach the appropriate document to the transaction
  // AFTER the transaction completes to avoid race conditions
  if (createdTransactionId) {
    try {
      let documentKind: DocumentKind;

      // Generate RECEIPT if fully paid, INVOICE if partially paid
      if (newStatus === InvoiceStatus.PAID) {
        await getOrGenerateReceiptPdf(updated, {
          skipDownload: true,
          context: 'addPayment'
        });
        documentKind = DocumentKind.RECEIPT;
      } else {
        await getOrGenerateInvoicePdf(updated, {
          skipDownload: true,
          context: 'addPayment'
        });
        documentKind = DocumentKind.INVOICE;
      }

      // Query for the generated document
      const document = await prisma.document.findFirst({
        where: {
          invoiceId: invoiceId,
          kind: documentKind
        },
        orderBy: {
          generatedAt: 'desc'
        }
      });

      // Attach document to transaction
      if (document) {
        await prisma.transactionAttachment.create({
          data: {
            transactionId: createdTransactionId,
            fileName: document.fileName,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            s3Key: document.s3Key,
            s3Url: document.s3Url,
            uploadedBy: updatedBy
          }
        });
      }
    } catch (error) {
      logger.error('Failed to attach document to transaction', error, {
        context: 'addPayment',
        metadata: { transactionId: createdTransactionId }
      });
    }
  } else {
    logger.warn('No transaction ID available for document attachment', {
      context: 'addPayment'
    });
  }

  return updated;
}

/**
 * Increment the remindersSent counter for an invoice.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the updated invoice, or null if not found
 */
export async function incrementInvoiceReminderCount(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<Invoice | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { remindersSent: true }
  });

  if (!invoice) {
    return null;
  }

  return prisma.invoice.update({
    where: { id, tenantId },
    data: {
      remindersSent: (invoice.remindersSent ?? 0) + 1,
      updatedAt: new Date()
    }
  });
}

/**
 * Soft delete an invoice by setting the deletedAt timestamp.
 * Only DRAFT invoices can be deleted. For other statuses, use the cancel method instead.
 * Soft deleted invoices are excluded from normal queries but retained for audit purposes.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice to soft delete
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves when deletion is complete
 */
export async function deleteInvoice(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id, tenantId, deletedAt: null },
      select: { status: true }
    });

    if (!invoice) {
      throw new Error(`Invoice ${id} not found for tenant ${tenantId}`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only DRAFT invoices can be deleted. Use cancel for other statuses.');
    }

    await tx.invoice.update({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  });
}

/**
 * Duplicate an existing invoice creating a new DRAFT invoice.
 * Copies all invoice details and items but resets payment-related fields.
 * The new invoice gets a fresh invoice number and starts in DRAFT status.
 * @param prisma - The Prisma client instance
 * @param id - The unique identifier of the invoice to duplicate
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to an object with the new invoice ID and number
 */
export async function duplicateInvoice(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<{ id: string; invoiceNumber: string }> {
  // Get the original invoice with all details
  const original = await prisma.invoice.findUnique({
    where: { id, tenantId, deletedAt: null },
    include: {
      items: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          productId: true
        }
      }
    }
  });

  if (!original) {
    throw new Error(`Invoice ${id} not found for tenant ${tenantId}`);
  }

  // Generate new invoice number
  const invoiceNumber = await generateInvoiceNumber(prisma, tenantId);

  // Calculate total amount from items
  const totalAmount = Number(original.amount);

  // Set issued date to today and due date based on config
  const issuedDate = new Date();
  const dueDate = new Date(issuedDate);
  dueDate.setDate(dueDate.getDate() + INVOICE_CONFIG.DEFAULT_DUE_DAYS);

  // Create the duplicate invoice with DRAFT status
  const duplicate = await prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      customerId: original.customerId,
      status: InvoiceStatus.DRAFT,
      amount: totalAmount,
      amountDue: totalAmount,
      amountPaid: 0,
      currency: original.currency,
      gst: original.gst,
      discount: original.discount,
      issuedDate,
      dueDate,
      notes: original.notes,
      remindersSent: 0,
      // Reset payment-related fields
      paidDate: null,
      paymentMethod: null,
      receiptNumber: null,
      cancelledDate: null,
      cancelReason: null,
      // Copy items
      items: {
        create: original.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          productId: item.productId
        }))
      }
    },
    select: {
      id: true,
      invoiceNumber: true
    }
  });

  return duplicate;
}
