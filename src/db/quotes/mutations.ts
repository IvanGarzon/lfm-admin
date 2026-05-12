import { PrismaClient, QuoteStatus } from '@/prisma/client';
import { isPrismaError } from '@/lib/error-handler';
import { validateQuoteStatusTransition } from '@/features/finances/quotes/utils/quote-helpers';

import type { QuoteWithDetails } from '@/features/finances/quotes/types';
import { type CreateQuoteInput, type UpdateQuoteInput } from '@/schemas/quotes';

import { generateQuoteNumber } from './identifiers';
import { findQuoteById } from './queries';

/**
 * Create a new quote with its items in a single transaction.
 * Automatically generates a quote number, calculates total amount, and creates initial status history.
 * Implements retry logic to handle race conditions in quote number generation.
 * @param prisma - The Prisma client instance
 * @param data - The quote data including customer, items, dates, and financial details
 * @param tenantId - The tenant ID to scope the creation
 * @param createdBy - Optional ID of the user creating the quote
 * @returns A promise that resolves to an object containing the new quote's ID and generated quote number
 */
export async function createQuoteWithItems(
  prisma: PrismaClient,
  data: CreateQuoteInput,
  tenantId: string,
  createdBy?: string
): Promise<{ id: string; quoteNumber: string }> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const quoteNumber = await generateQuoteNumber(prisma, tenantId);

      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const createdDate = new Date();

      return await prisma.$transaction(async (tx) => {
        const quote = await tx.quote.create({
          data: {
            tenantId,
            quoteNumber,
            customerId: data.customerId,
            status: data.status,
            amount: totalAmount,
            currency: data.currency,
            gst: data.gst,
            discount: data.discount,
            issuedDate: data.issuedDate,
            validUntil: data.validUntil,
            notes: data.notes ?? null,
            terms: data.terms ?? null,
            items: {
              create: data.items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                productId: item.productId,
                order: index
              }))
            }
          },
          select: {
            id: true,
            quoteNumber: true
          }
        });

        await tx.quoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            status: data.status,
            previousStatus: null,
            updatedAt: createdDate,
            updatedBy: createdBy,
            notes: 'Quote created'
          }
        });

        return quote;
      });
    } catch (error: unknown) {
      if (isPrismaError(error) && error.code === 'P2002') {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error('Failed to generate a unique quote number. Please try again.');
        }
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to create quote');
}

/**
 * Update an existing quote and its items in a single transaction.
 * Handles adding new items, updating existing items, and removing deleted items.
 * Validates status transitions and creates status history when status changes.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to update
 * @param data - The updated quote data including items
 * @param tenantId - The tenant ID to scope the update
 * @param updatedBy - Optional ID of the user updating the quote
 * @returns A promise that resolves to the updated quote with full details, or null if quote not found
 */
export async function updateQuoteWithItems(
  prisma: PrismaClient,
  id: string,
  data: UpdateQuoteInput,
  tenantId: string,
  updatedBy?: string
): Promise<QuoteWithDetails | null> {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gstPercentage = Number(data.gst || 0);
  const gstAmount = (subtotal * gstPercentage) / 100;
  const totalAmount = subtotal + gstAmount - Number(data.discount || 0);

  const updatedQuote = await prisma.$transaction(async (tx) => {
    const currentQuote = await tx.quote.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!currentQuote) {
      throw new Error(`Quote ${id} not found`);
    }

    const statusChanged = currentQuote.status !== data.status;
    const previousStatus = currentQuote.status;

    if (statusChanged) {
      validateQuoteStatusTransition(previousStatus, data.status);
    }

    const existingItems = data.items.filter((item) => item.id);
    const newItems = data.items.filter((item) => !item.id);
    const existingItemIds = existingItems.map((item) => item.id!);

    await tx.quoteItem.deleteMany({
      where: {
        quoteId: data.id,
        id: { notIn: existingItemIds }
      }
    });

    const quote = await tx.quote.update({
      where: { id },
      data: {
        customerId: data.customerId,
        status: data.status,
        amount: totalAmount,
        currency: data.currency,
        gst: data.gst,
        discount: data.discount,
        issuedDate: data.issuedDate,
        validUntil: data.validUntil,
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        updatedAt: new Date()
      }
    });

    if (statusChanged) {
      await tx.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: data.status,
          previousStatus,
          updatedAt: new Date(),
          updatedBy: updatedBy,
          notes: 'Status updated via quote edit'
        }
      });
    }

    for (let index = 0; index < existingItems.length; index++) {
      const item = existingItems[index];
      await tx.quoteItem.update({
        where: { id: item.id },
        data: {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          productId: item.productId,
          order: data.items.findIndex((i) => i.id === item.id),
          updatedAt: new Date()
        }
      });
    }

    if (newItems.length > 0) {
      await tx.quoteItem.createMany({
        data: newItems.map((item) => {
          const index = data.items.findIndex((i) => i === item);
          return {
            quoteId: data.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId,
            order: index
          };
        })
      });
    }

    return quote;
  });

  if (!updatedQuote) {
    return null;
  }

  return await findQuoteById(prisma, updatedQuote.id, tenantId);
}

/**
 * Convert a quote to an invoice in a single transaction.
 * Creates a new invoice with PENDING status, updates the quote status to CONVERTED,
 * and creates a status history entry. All quote items are copied to the invoice.
 * @param prisma - The Prisma client instance
 * @param quoteId - The ID of the quote to convert
 * @param invoiceData - The invoice-specific data including number, gst, discount, and due date
 * @param updatedBy - Optional ID of the user who performed the conversion
 * @returns A promise that resolves to an object containing the new invoice's ID and number
 */
export async function convertQuoteToInvoice(
  prisma: PrismaClient,
  quoteId: string,
  invoiceData: {
    invoiceNumber: string;
    tenantId: string;
    gst: number;
    discount: number;
    dueDate: Date;
  },
  updatedBy?: string
): Promise<{ invoiceId: string; invoiceNumber: string }> {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId, tenantId: invoiceData.tenantId, deletedAt: null },
      include: {
        items: true,
        customer: true
      }
    });

    if (!quote) {
      throw new Error(`Quote ${quoteId} not found for tenant ${invoiceData.tenantId}`);
    }

    const previousStatus = quote.status;
    const convertedDate = new Date();

    validateQuoteStatusTransition(previousStatus, QuoteStatus.CONVERTED);

    const invoice = await tx.invoice.create({
      data: {
        tenantId: invoiceData.tenantId,
        invoiceNumber: invoiceData.invoiceNumber,
        customerId: quote.customerId,
        status: 'PENDING',
        amount: quote.amount,
        currency: quote.currency,
        gst: invoiceData.gst,
        discount: invoiceData.discount,
        issuedDate: new Date(),
        dueDate: invoiceData.dueDate,
        notes: quote.notes,
        items: {
          create: quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId
          }))
        }
      }
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.CONVERTED,
        invoiceId: invoice.id
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: quoteId,
        status: QuoteStatus.CONVERTED,
        previousStatus,
        updatedAt: convertedDate,
        updatedBy: updatedBy,
        notes: `Quote converted to invoice ${invoice.invoiceNumber}`
      }
    });

    return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  });
}

/**
 * Check for quotes that have passed their validity date and automatically expire them.
 * Only checks quotes with DRAFT or SENT status.
 * @param prisma - The Prisma client instance
 * @returns A promise that resolves to the number of quotes that were expired
 */
export async function checkAndExpireQuotes(prisma: PrismaClient): Promise<number> {
  const today = new Date();

  const quotesToExpire = await prisma.quote.findMany({
    where: {
      status: {
        in: [QuoteStatus.DRAFT, QuoteStatus.SENT]
      },
      validUntil: { lt: today },
      deletedAt: null
    },
    select: {
      id: true,
      status: true,
      validUntil: true
    }
  });

  let expiredCount = 0;
  for (const quote of quotesToExpire) {
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: QuoteStatus.EXPIRED,
          updatedAt: new Date()
        }
      });

      await tx.quoteStatusHistory.create({
        data: {
          quoteId: quote.id,
          status: QuoteStatus.EXPIRED,
          previousStatus: quote.status,
          updatedAt: quote.validUntil,
          updatedBy: null,
          notes: 'Quote expired automatically'
        }
      });

      expiredCount++;
    });
  }

  return expiredCount;
}

/**
 * Soft delete a quote by setting its deletedAt timestamp.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to soft delete
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves when the quote is deleted
 */
export async function softDeleteQuote(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<void> {
  await prisma.quote.update({
    where: { id, tenantId, deletedAt: null },
    data: {
      deletedAt: new Date()
    }
  });
}

/**
 * Create a new version of an existing quote in a transaction.
 * Copies all quote data, items, and item attachments to a new quote with incremented version number.
 * The new version starts in DRAFT status, and the parent quote is automatically cancelled.
 * @param prisma - The Prisma client instance
 * @param parentQuoteId - The ID of the quote to create a version from
 * @param tenantId - The tenant ID to scope the query
 * @param createdBy - Optional ID of the user creating the version
 * @returns A promise that resolves to an object containing the new version's ID, quote number, and version number
 */
export async function createQuoteVersion(
  prisma: PrismaClient,
  parentQuoteId: string,
  tenantId: string,
  createdBy?: string
): Promise<{ id: string; quoteNumber: string; versionNumber: number }> {
  return prisma.$transaction(async (tx) => {
    const parentQuote = await tx.quote.findUnique({
      where: { id: parentQuoteId, deletedAt: null },
      include: {
        items: {
          include: {
            attachments: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!parentQuote) {
      throw new Error(`Parent quote ${parentQuoteId} not found for tenant ${tenantId}`);
    }

    const highestVersionQuote = await tx.quote.findFirst({
      where: {
        OR: [
          { id: parentQuoteId },
          { parentQuoteId: parentQuoteId },
          {
            parentQuoteId: parentQuote.parentQuoteId ? parentQuote.parentQuoteId : undefined
          }
        ],
        deletedAt: null
      },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true }
    });

    const nextVersionNumber = (highestVersionQuote?.versionNumber || 1) + 1;

    const newQuoteNumber = await generateQuoteNumber(prisma, tenantId);

    const createdDate = new Date();

    const validUntil = new Date(createdDate);
    validUntil.setDate(validUntil.getDate() + 30);

    const newVersion = await tx.quote.create({
      data: {
        tenantId,
        quoteNumber: newQuoteNumber,
        customerId: parentQuote.customerId,
        status: QuoteStatus.DRAFT,
        amount: parentQuote.amount,
        currency: parentQuote.currency,
        gst: parentQuote.gst,
        discount: parentQuote.discount,
        issuedDate: createdDate,
        validUntil: validUntil,
        notes: parentQuote.notes,
        terms: parentQuote.terms,
        versionNumber: nextVersionNumber,
        parentQuoteId: parentQuote.parentQuoteId || parentQuoteId,
        items: {
          create: parentQuote.items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId,
            notes: item.notes,
            colors: item.colors,
            order: index,
            attachments: {
              create: item.attachments.map((attachment) => ({
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                s3Key: attachment.s3Key,
                s3Url: attachment.s3Url,
                uploadedBy: createdBy,
                uploadedAt: createdDate
              }))
            }
          }))
        }
      },
      select: {
        id: true,
        quoteNumber: true,
        versionNumber: true
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: newVersion.id,
        status: QuoteStatus.DRAFT,
        previousStatus: null,
        updatedAt: createdDate,
        updatedBy: createdBy,
        notes: `New version created from ${parentQuote.quoteNumber}`
      }
    });

    const previousParentStatus = parentQuote.status;
    await tx.quote.update({
      where: { id: parentQuoteId },
      data: {
        status: QuoteStatus.CANCELLED,
        isLatestVersion: false,
        updatedAt: createdDate
      }
    });

    await tx.quoteStatusHistory.create({
      data: {
        quoteId: parentQuoteId,
        status: QuoteStatus.CANCELLED,
        previousStatus: previousParentStatus,
        updatedAt: createdDate,
        updatedBy: createdBy,
        notes: `Quote cancelled due to new version ${newQuoteNumber} being created`
      }
    });

    return newVersion;
  });
}

/**
 * Update the status of multiple quotes in bulk with proper validation and audit trail.
 * Validates each status transition and creates history entries for successful updates.
 * Skips quotes with invalid transitions instead of failing the entire operation.
 * @param prisma - The Prisma client instance
 * @param ids - Array of quote IDs to update
 * @param status - The new status to set for all quotes
 * @param tenantId - The tenant ID to scope all queries
 * @param updatedBy - Optional user ID who triggered this change
 * @returns A promise that resolves to results array with success/failure for each quote
 */
export async function bulkUpdateQuoteStatus(
  prisma: PrismaClient,
  ids: string[],
  status: QuoteStatus,
  tenantId: string,
  updatedBy?: string
): Promise<{ id: string; success: boolean; error?: string }[]> {
  return prisma.$transaction(async (tx) => {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const quote = await tx.quote.findUnique({
          where: { id, tenantId, deletedAt: null },
          select: { status: true }
        });

        if (!quote) {
          results.push({ id, success: false, error: 'Quote not found' });
          continue;
        }

        if (quote.status === status) {
          results.push({ id, success: true });
          continue;
        }

        try {
          validateQuoteStatusTransition(quote.status, status);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid status transition';
          results.push({ id, success: false, error: errorMessage });
          continue;
        }

        await tx.quote.update({
          where: { id, tenantId },
          data: {
            status,
            updatedAt: new Date()
          }
        });

        await tx.quoteStatusHistory.create({
          data: {
            quoteId: id,
            status,
            previousStatus: quote.status,
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

/**
 * Soft delete multiple quotes in bulk.
 * Only deletes quotes that are in DRAFT status.
 * @param prisma - The Prisma client instance
 * @param ids - Array of quote IDs to delete
 * @param tenantId - The tenant ID to scope all queries
 * @returns A promise that resolves to results array with success/failure for each quote
 */
export async function bulkSoftDeleteQuotes(
  prisma: PrismaClient,
  ids: string[],
  tenantId: string
): Promise<{ id: string; success: boolean; error?: string }[]> {
  return prisma.$transaction(async (tx) => {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const quote = await tx.quote.findUnique({
          where: { id, tenantId, deletedAt: null },
          select: { status: true }
        });

        if (!quote) {
          results.push({ id, success: false, error: 'Quote not found' });
          continue;
        }

        if (quote.status !== QuoteStatus.DRAFT) {
          results.push({
            id,
            success: false,
            error: 'Only DRAFT quotes can be deleted'
          });
          continue;
        }

        await tx.quote.update({
          where: { id, tenantId },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
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

/**
 * Create a new attachment record for a quote item.
 * @param prisma - The Prisma client instance
 * @param data - The attachment data including S3 information and file metadata
 * @returns A promise that resolves to the created item attachment record
 */
export async function createQuoteItemAttachment(
  prisma: PrismaClient,
  data: {
    quoteItemId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    s3Url: string;
    uploadedBy?: string;
  }
) {
  return prisma.quoteItemAttachment.create({
    data: {
      quoteItemId: data.quoteItemId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      s3Key: data.s3Key,
      s3Url: data.s3Url,
      uploadedBy: data.uploadedBy ?? null,
      uploadedAt: new Date()
    }
  });
}

/**
 * Update the notes field for a specific quote item.
 * @param prisma - The Prisma client instance
 * @param quoteItemId - The ID of the quote item to update
 * @param notes - The notes text to set
 * @returns A promise that resolves to the updated quote item
 */
export async function updateQuoteItemNotes(
  prisma: PrismaClient,
  quoteItemId: string,
  notes: string
) {
  return prisma.quoteItem.update({
    where: { id: quoteItemId },
    data: { notes }
  });
}

/**
 * Update the color palette for a specific quote item.
 * @param prisma - The Prisma client instance
 * @param quoteItemId - The ID of the quote item to update
 * @param colors - An array of color values (typically hex codes)
 * @returns A promise that resolves to the updated quote item
 */
export async function updateQuoteItemColors(
  prisma: PrismaClient,
  quoteItemId: string,
  colors: string[]
) {
  return prisma.quoteItem.update({
    where: { id: quoteItemId },
    data: { colors }
  });
}

/**
 * Delete a quote item attachment record from the database.
 * Note: This does not delete the file from S3 — that should be handled separately.
 * @param prisma - The Prisma client instance
 * @param attachmentId - The ID of the item attachment to delete
 * @returns A promise that resolves to true if deletion was successful, false otherwise
 */
export async function deleteQuoteItemAttachment(
  prisma: PrismaClient,
  attachmentId: string
): Promise<boolean> {
  try {
    await prisma.quoteItemAttachment.delete({
      where: { id: attachmentId }
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle the favourite status of a quote.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to toggle favourite status
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the updated quote with new favourite status, or null if not found
 */
export async function toggleQuoteFavourite(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<{ id: string; isFavourite: boolean } | null> {
  const quote = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    select: { isFavourite: true }
  });

  if (!quote) {
    return null;
  }

  const updated = await prisma.quote.update({
    where: { id, tenantId, deletedAt: null },
    data: {
      isFavourite: !quote.isFavourite,
      updatedAt: new Date()
    },
    select: {
      id: true,
      isFavourite: true
    }
  });

  return updated;
}

/**
 * Duplicate an existing quote to create an independent copy.
 * Creates a new quote with DRAFT status, copying items (with colors and notes) and attachments.
 * Unlike versioning, the duplicate is completely independent with no parent-child relationship.
 * @param prisma - The Prisma client instance
 * @param id - The ID of the quote to duplicate
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to an object containing the duplicate quote's ID and number
 */
export async function duplicateQuote(
  prisma: PrismaClient,
  id: string,
  tenantId: string
): Promise<{ id: string; quoteNumber: string }> {
  const original = await prisma.quote.findUnique({
    where: { id, tenantId, deletedAt: null },
    include: {
      items: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          productId: true,
          notes: true,
          colors: true,
          order: true,
          attachments: {
            select: {
              fileName: true,
              fileSize: true,
              mimeType: true,
              s3Key: true,
              s3Url: true,
              uploadedBy: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!original) {
    throw new Error(`Quote ${id} not found for tenant ${tenantId}`);
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const quoteNumber = await generateQuoteNumber(prisma, tenantId);

      const totalAmount = Number(original.amount);

      const issuedDate = new Date();
      const validUntil = new Date(issuedDate);
      validUntil.setDate(validUntil.getDate() + 30);

      const duplicate = await prisma.$transaction(async (tx) => {
        const newQuote = await tx.quote.create({
          data: {
            tenantId,
            quoteNumber,
            customerId: original.customerId,
            status: QuoteStatus.DRAFT,
            amount: totalAmount,
            currency: original.currency,
            gst: original.gst,
            discount: original.discount,
            issuedDate,
            validUntil,
            notes: original.notes,
            terms: original.terms,
            versionNumber: 1,
            parentQuoteId: null,
            items: {
              create: original.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                productId: item.productId,
                notes: item.notes,
                colors: item.colors,
                order: item.order,
                attachments: {
                  create: item.attachments.map((attachment) => ({
                    fileName: attachment.fileName,
                    fileSize: attachment.fileSize,
                    mimeType: attachment.mimeType,
                    s3Key: attachment.s3Key,
                    s3Url: attachment.s3Url,
                    uploadedBy: attachment.uploadedBy,
                    uploadedAt: new Date()
                  }))
                }
              }))
            }
          },
          select: {
            id: true,
            quoteNumber: true
          }
        });

        await tx.quoteStatusHistory.create({
          data: {
            quoteId: newQuote.id,
            status: QuoteStatus.DRAFT,
            previousStatus: null,
            updatedAt: new Date(),
            notes: `Duplicated from quote ${original.quoteNumber}`
          }
        });

        return newQuote;
      });

      return duplicate;
    } catch (error: unknown) {
      if (isPrismaError(error) && error.code === 'P2002') {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error('Failed to generate a unique quote number. Please try again.');
        }
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to duplicate quote');
}
