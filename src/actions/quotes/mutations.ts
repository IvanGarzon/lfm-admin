'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { QuoteRepository } from '@/repositories/quote-repository';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { QuoteStatus } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import {
  CreateQuoteSchema,
  UpdateQuoteSchema,
  MarkQuoteAsAcceptedSchema,
  MarkQuoteAsRejectedSchema,
  MarkQuoteAsOnHoldSchema,
  MarkQuoteAsCancelledSchema,
  ConvertQuoteToInvoiceSchema,
  UploadItemAttachmentSchema,
  DeleteItemAttachmentSchema,
  CreateVersionSchema,
  type CreateQuoteInput,
  type UpdateQuoteInput,
  type MarkQuoteAsAcceptedInput,
  type MarkQuoteAsRejectedInput,
  type MarkQuoteAsOnHoldInput,
  type MarkQuoteAsCancelledInput,
  type ConvertQuoteToInvoiceInput,
  type CreateVersionInput,
} from '@/schemas/quotes';
import type { QuoteItemAttachment } from '@/features/finances/quotes/types';
import type { ActionResult } from '@/types/actions';
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/lib/file-constants';
import { queueQuoteEmail, queueInvoiceEmail } from '@/services/email-queue.service';

const quoteRepo = new QuoteRepository(prisma);
const invoiceRepo = new InvoiceRepository(prisma);

/**
 * Creates a new quote with the provided data.
 * It calculates the total amount and generates a new quote number.
 * @param data - The input data for creating the quote, conforming to `CreateQuoteInput`.
 * @returns A promise that resolves to an `ActionResult` with the new quote's ID and number.
 */
export async function createQuote(
  data: CreateQuoteInput,
): Promise<ActionResult<{ id: string; quoteNumber: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageQuotes');

    // Validate input
    const validatedData = CreateQuoteSchema.parse(data);
    const quote = await quoteRepo.createQuoteWithItems(validatedData, session.user.id);
    revalidatePath('/finances/quotes');

    return {
      success: true,
      data: { id: quote.id, quoteNumber: quote.quoteNumber },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create quote');
  }
}

/**
 * Updates an existing quote with the provided data.
 * It recalculates the total amount and handles updates to quote items.
 * @param data - The input data for updating the quote, conforming to `UpdateQuoteInput`.
 * @returns A promise that resolves to an `ActionResult` with the updated quote's ID.
 */
export async function updateQuote(data: UpdateQuoteInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageQuotes');

    // Validate input
    const validatedData = UpdateQuoteSchema.parse(data);

    // Check if quote exists
    const existing = await quoteRepo.findById(validatedData.id);
    if (!existing) {
      return { success: false, error: 'Quote not found' };
    }

    const quote = await quoteRepo.updateQuoteWithItems(
      validatedData.id,
      validatedData,
      session.user.id,
    );

    if (!quote) {
      return { success: false, error: 'Failed to update quote' };
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${quote.id}`);

    return { success: true, data: { id: quote.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update quote');
  }
}

/**
 * Marks a quote as accepted.
 * @param data - An object containing the quote ID.
 * @returns A promise that resolves to an `ActionResult` with the quote's ID upon success,
 * or an error if the quote is not found.
 */
export async function markQuoteAsAccepted(
  data: MarkQuoteAsAcceptedInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = MarkQuoteAsAcceptedSchema.parse(data);
    const quote = await quoteRepo.markAsAccepted(validatedData.id, session?.user?.id);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.id}`);

    return { success: true, data: { id: quote.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark quote as accepted');
  }
}

/**
 * Marks a quote as rejected.
 * @param data - An object containing the quote ID and reason for rejection.
 * @returns A promise that resolves to an `ActionResult` with the quote's ID upon success,
 * or an error if the quote is not found.
 */
export async function markQuoteAsRejected(
  data: MarkQuoteAsRejectedInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = MarkQuoteAsRejectedSchema.parse(data);
    const quote = await quoteRepo.markAsRejected(
      validatedData.id,
      validatedData.rejectReason,
      session?.user?.id,
    );

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.id}`);

    return { success: true, data: { id: quote.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark quote as rejected');
  }
}

/**
 * Marks a quote as sent.
 * @param id - The ID of the quote to mark as sent.
 * @returns A promise that resolves to an `ActionResult` with the quote's ID upon success,
 * or an error if the quote is not found.
 */
export async function markQuoteAsSent(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    // Fetch quote with customer details
    const quote = await quoteRepo.markAsSent(id, session?.user?.id);
    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Auto-send email when quote is marked as SENT
    let emailWarning: string | undefined;
    try {
      const emailResult = await sendQuoteEmail({ quoteId: id, type: 'sent' });
      if (!emailResult.success) {
        emailWarning = emailResult.error;
      }
    } catch (emailError) {
      emailWarning = 'Failed to queue automatic email';
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${id}`);

    return {
      success: true,
      data: { id: quote.id },
      message: emailWarning,
    };
  } catch (error) {
    return handleActionError(error, 'Failed to mark quote as sent');
  }
}

/**
 * Marks a quote as on hold.
 * @param data - An object containing the quote ID and optional reason.
 * @returns A promise that resolves to an `ActionResult` with the quote's ID upon success,
 * or an error if the quote is not found.
 */
export async function markQuoteAsOnHold(
  data: MarkQuoteAsOnHoldInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = MarkQuoteAsOnHoldSchema.parse(data);
    const quote = await quoteRepo.markAsOnHold(
      validatedData.id,
      validatedData.reason,
      session?.user?.id,
    );

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.id}`);

    return { success: true, data: { id: quote.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark quote as on hold');
  }
}

/**
 * Marks a quote as cancelled.
 * @param data - An object containing the quote ID and optional reason.
 * @returns A promise that resolves to an `ActionResult` with the quote's ID upon success,
 * or an error if the quote is not found.
 */
export async function markQuoteAsCancelled(
  data: MarkQuoteAsCancelledInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = MarkQuoteAsCancelledSchema.parse(data);
    const quote = await quoteRepo.markAsCancelled(
      validatedData.id,
      validatedData.reason,
      session?.user?.id,
    );

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.id}`);

    return { success: true, data: { id: quote.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to cancel quote');
  }
}

/**
 * Converts a quote into a new invoice with PENDING status.
 * It copies over relevant details from the quote to a new invoice record and updates the quote status to CONVERTED.
 * The status transition is validated before conversion.
 * @param data - The input data for the conversion, including the quote ID, invoice due date, GST, and discount.
 * @returns A promise that resolves to an `ActionResult` containing the new invoice's ID and number,
 * or an error if the quote is not found or the status transition is invalid.
 */
export async function convertQuoteToInvoice(
  data: ConvertQuoteToInvoiceInput,
): Promise<ActionResult<{ invoiceId: string; invoiceNumber: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = ConvertQuoteToInvoiceSchema.parse(data);
    const invoiceNumber = await invoiceRepo.generateInvoiceNumber();

    // Convert quote to invoice
    const result = await quoteRepo.convertToInvoice(
      validatedData.id,
      {
        invoiceNumber,
        gst: validatedData.gst,
        discount: validatedData.discount,
        dueDate: validatedData.dueDate,
      },
      session?.user?.id,
    );

    // Auto-send invoice email to customer
    try {
      const invoice = await invoiceRepo.findByIdWithDetails(result.invoiceId);
      if (invoice) {
        await queueInvoiceEmail({
          invoiceId: invoice.id,
          customerId: invoice.customer.id,
          type: 'pending',
          recipient: invoice.customer.email,
          subject: `Invoice ${invoice.invoiceNumber}`,
          emailData: {
            invoiceNumber: invoice.invoiceNumber,
            customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
            amount: invoice.amount,
            currency: invoice.currency,
            dueDate: invoice.dueDate,
            issuedDate: invoice.issuedDate,
          },
        });
      }
    } catch (emailError) {
      // Log error but don't fail the conversion
      console.error('Failed to queue invoice email:', emailError);
    }

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.id}`);
    revalidatePath('/finances/invoices');

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to convert quote to invoice');
  }
}

/**
 * Checks for quotes that are past their 'validUntil' date and updates their status to 'EXPIRED'.
 * This is intended to be run periodically.
 * @returns A promise that resolves to an `ActionResult` with the count of expired quotes.
 */
export async function checkAndExpireQuotes(): Promise<ActionResult<{ count: number }>> {
  try {
    const count = await quoteRepo.checkAndExpireQuotes();

    if (count > 0) {
      revalidatePath('/finances/quotes');
    }

    return { success: true, data: { count } };
  } catch (error) {
    return handleActionError(error, 'Failed to expire quotes');
  }
}

/**
 * Soft deletes a quote by setting its `deletedAt` timestamp.
 * The quote is not permanently removed from the database.
 * @param id - The ID of the quote to delete.
 * @returns A promise that resolves to an `ActionResult` with the ID of the soft-deleted quote,
 * or an error if the quote is not found.
 */
export async function deleteQuote(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const success = await quoteRepo.softDelete(id);

    if (!success) {
      return { success: false, error: 'Quote not found' };
    }

    revalidatePath('/finances/quotes');

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete quote');
  }
}

/**
 * Uploads an image attachment for a specific quote item.
 * The file is stored in S3 and a corresponding record is created in the database.
 * @param formData - The form data containing the file, quote ID, and quote item ID.
 * @returns A promise that resolves to an `ActionResult` with the new item attachment's data.
 */
export async function uploadQuoteItemAttachment(
  formData: FormData,
): Promise<ActionResult<QuoteItemAttachment>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  requirePermission(session.user, 'canManageQuotes');

  try {
    const quoteItemId = formData.get('quoteItemId');
    const quoteId = formData.get('quoteId');
    const fileEntry = formData.get('file');

    if (
      typeof quoteItemId !== 'string' ||
      typeof quoteId !== 'string' ||
      !(fileEntry instanceof File)
    ) {
      return { success: false, error: 'Missing required fields' };
    }

    const file: File = fileEntry;

    // Validate inputs with file properties
    const validatedData = UploadItemAttachmentSchema.parse({
      quoteItemId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const params = {
      file: buffer,
      fileName: validatedData.fileName,
      mimeType: validatedData.mimeType,
      quoteId,
    };

    const { s3Key, s3Url } = await uploadFileToS3({
      ...params,
      resourceType: 'quotes',
      resourceId: params.quoteId,
      subPath: `items/${validatedData.quoteItemId}`,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      metadata: {
        quoteId: params.quoteId,
        itemId: validatedData.quoteItemId,
      },
    });

    // Create database record
    const attachment = await quoteRepo.createItemAttachment({
      quoteItemId: validatedData.quoteItemId,
      fileName: validatedData.fileName,
      fileSize: validatedData.fileSize,
      mimeType: validatedData.mimeType,
      s3Key,
      s3Url,
      uploadedBy: session.user.id,
    });

    revalidatePath(`/finances/quotes/${quoteId}`);

    return {
      success: true,
      data: {
        id: attachment.id,
        quoteItemId: attachment.quoteItemId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        s3Key: attachment.s3Key,
        s3Url: attachment.s3Url,
        uploadedBy: attachment.uploadedBy,
        uploadedAt: attachment.uploadedAt,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to upload item attachment');
  }
}

/**
 * Deletes a quote item attachment from both S3 and the database.
 * @param data - An object containing the `attachmentId` and `quoteId`.
 * The `quoteId` is used for revalidating the cache.
 * @returns A promise that resolves to an `ActionResult` with the ID of the deleted attachment,
 * or an error if the attachment is not found.
 */
export async function deleteQuoteItemAttachment(data: {
  attachmentId: string;
  quoteId: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  requirePermission(session.user, 'canManageQuotes');

  try {
    const validatedData = DeleteItemAttachmentSchema.parse(data);

    // Get attachment details
    const attachment = await quoteRepo.getItemAttachmentById(validatedData.attachmentId);
    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Check if other attachments use the same S3 key (e.g. from duplicated quotes)
    const usageCount = await prisma.quoteItemAttachment.count({
      where: {
        s3Key: attachment.s3Key,
        id: { not: attachment.id }, // Exclude current attachment
      },
    });

    // Only delete from S3 if no other records reference this file
    if (usageCount === 0) {
      await deleteFileFromS3(attachment.s3Key);
    }

    // Delete from database
    const success = await quoteRepo.deleteItemAttachment(validatedData.attachmentId);
    if (!success) {
      return { success: false, error: 'Failed to delete attachment record' };
    }

    revalidatePath(`/finances/quotes/${data.quoteId}`);

    return { success: true, data: { id: validatedData.attachmentId } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete item attachment');
  }
}

/**
 * Updates the notes for a specific quote item.
 * @param data - An object containing the `quoteItemId`, `quoteId`, and the new `notes`.
 * The `quoteId` is used for revalidating the cache.
 * @returns A promise that resolves to an `ActionResult` with the updated item's ID and notes,
 * or an error if the update fails.
 */
export async function updateQuoteItemNotes(data: {
  quoteItemId: string;
  quoteId: string;
  notes: string;
}): Promise<ActionResult<{ id: string; notes: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  requirePermission(session.user, 'canManageQuotes');

  try {
    // Update notes in database
    const quoteItem = await quoteRepo.updateQuoteItemNotes(data.quoteItemId, data.notes);

    revalidatePath(`/finances/quotes/${data.quoteId}`);

    return {
      success: true,
      data: {
        id: quoteItem.id,
        notes: quoteItem.notes ?? '',
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update quote item notes');
  }
}

/**
 * Updates the color palette for a specific quote item.
 * @param data - An object containing the `quoteItemId`, `quoteId`, and the array of `colors`.
 * The `quoteId` is used for revalidating the cache.
 * @returns A promise that resolves to an `ActionResult` with the updated item's ID and colors,
 * or an error if the update fails.
 */
export async function updateQuoteItemColors(data: {
  quoteItemId: string;
  quoteId: string;
  colors: string[];
}): Promise<ActionResult<{ id: string; colors: string[] }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  requirePermission(session.user, 'canManageQuotes');

  try {
    // Validate that colors are valid hex codes
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const validColors = data.colors.every((color) => hexColorRegex.test(color));

    if (!validColors) {
      return { success: false, error: 'Invalid color format. Use hex colors (e.g., #FF5733)' };
    }

    if (data.colors.length > 10) {
      return { success: false, error: 'Maximum of 10 colors allowed' };
    }

    // Update colors in database
    const quoteItem = await quoteRepo.updateQuoteItemColors(data.quoteItemId, data.colors);

    revalidatePath(`/finances/quotes/${data.quoteId}`);

    return {
      success: true,
      data: {
        id: quoteItem.id,
        colors: quoteItem.colors,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update quote item colors');
  }
}

/**
 * Creates a new version of an existing quote.
 * The new version copies all data from the parent quote and starts in DRAFT status.
 * @param data - An object containing the quote ID to create a version from.
 * @returns A promise that resolves to an `ActionResult` with the new version's details.
 */
export async function createQuoteVersion(data: CreateVersionInput): Promise<
  ActionResult<{
    id: string;
    quoteNumber: string;
    versionNumber: number;
    parentQuoteNumber: string;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    const validatedData = CreateVersionSchema.parse(data);

    // Get parent quote to include its number in the response
    const parentQuote = await quoteRepo.findById(validatedData.quoteId);
    if (!parentQuote) {
      return { success: false, error: 'Quote not found' };
    }

    const newVersion = await quoteRepo.createVersion(validatedData.quoteId, session.user.id);

    revalidatePath('/finances/quotes');
    revalidatePath(`/finances/quotes/${validatedData.quoteId}`);
    revalidatePath(`/finances/quotes/${newVersion.id}`);

    return {
      success: true,
      data: {
        id: newVersion.id,
        quoteNumber: newVersion.quoteNumber,
        versionNumber: newVersion.versionNumber,
        parentQuoteNumber: parentQuote.quoteNumber,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create quote version');
  }
}

/**
 * Queues a quote email for background processing via Inngest.
 * @param data - An object containing the quote ID and email type.
 * @returns A promise that resolves to an `ActionResult` with the email audit ID.
 */
export async function sendQuoteEmail(data: {
  quoteId: string;
  type: 'sent' | 'reminder' | 'accepted' | 'rejected' | 'followup';
}): Promise<ActionResult<{ auditId: string; eventId: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    // Fetch quote with customer details
    const quote = await quoteRepo.findByIdWithDetails(data.quoteId);
    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Prepare email data
    const emailData = {
      quoteNumber: quote.quoteNumber,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      amount: quote.amount,
      currency: quote.currency,
      issuedDate: quote.issuedDate,
      validUntil: quote.validUntil,
      itemCount: quote.items.length,
    };

    // Generate subject based on type
    const subjects = {
      sent: `Quote ${quote.quoteNumber} from Las Flores`,
      reminder: `Reminder: Quote ${quote.quoteNumber} expiring soon`,
      accepted: `Quote ${quote.quoteNumber} Accepted - Thank You!`,
      rejected: `Quote ${quote.quoteNumber} - We Value Your Feedback`,
      followup: `Following up: Quote ${quote.quoteNumber} from Las Flores`,
    };

    // Queue email via Inngest
    const result = await queueQuoteEmail({
      quoteId: quote.id,
      customerId: quote.customer.id,
      type: data.type,
      recipient: quote.customer.email,
      subject: subjects[data.type],
      emailData,
    });

    revalidatePath(`/finances/quotes/${data.quoteId}`);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to queue quote email');
  }
}

/**
 * Sends a follow-up email for a quote with rate limiting (1 per 24h)
 * @param quoteId - The ID of the quote to send follow-up for
 * @returns A promise that resolves to an `ActionResult` with the email audit ID
 */
export async function sendQuoteFollowUp(
  quoteId: string,
): Promise<ActionResult<{ auditId: string; eventId: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canManageQuotes');

    // Fetch quote with customer details
    const quote = await quoteRepo.findByIdWithDetails(quoteId);
    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Check rate limiting - no follow-up sent in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentFollowUp = await prisma.emailAudit.findFirst({
      where: {
        quoteId: quoteId,
        emailType: 'quote.followup',
        status: 'SENT',
        sentAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    if (recentFollowUp) {
      const hoursSinceLastFollowUp = Math.floor(
        (Date.now() - new Date(recentFollowUp.sentAt!).getTime()) / (1000 * 60 * 60),
      );
      const hoursRemaining = 24 - hoursSinceLastFollowUp;

      return {
        success: false,
        error: `Please wait ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'} before sending another follow-up`,
      };
    }

    // Prepare email data
    const emailData = {
      quoteNumber: quote.quoteNumber,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      amount: quote.amount,
      currency: quote.currency,
      issuedDate: quote.issuedDate,
      validUntil: quote.validUntil,
      itemCount: quote.items.length,
    };

    // Queue follow-up email via Inngest
    const result = await queueQuoteEmail({
      quoteId: quote.id,
      customerId: quote.customer.id,
      type: 'followup' as any, // Will be handled as 'quote.followup'
      recipient: quote.customer.email,
      subject: `Following up: Quote ${quote.quoteNumber} from Las Flores`,
      emailData,
    });

    revalidatePath(`/finances/quotes/${quoteId}`);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to send quote follow-up');
  }
}

/**
 * Duplicates an existing quote to create an independent copy.
 * Unlike creating a version, this creates a completely independent quote with:
 * - New quote number
 * - DRAFT status
 * - No parent-child relationship
 * - Same customer (can be changed after duplication)
 * - All items, colors, and attachment references copied
 *
 * Use this for templating or creating similar quotes for different customers.
 *
 * @param id - The ID of the quote to duplicate
 * @returns A promise that resolves to an `ActionResult` with the duplicate quote's ID and number
 */
export async function duplicateQuote(
  id: string,
): Promise<ActionResult<{ id: string; quoteNumber: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageQuotes');

    const result = await quoteRepo.duplicate(id);

    revalidatePath('/finances/quotes');

    return {
      success: true,
      data: { id: result.id, quoteNumber: result.quoteNumber },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to duplicate quote');
  }
}

/**
 * Updates the status of multiple quotes in a single operation.
 * @param ids - An array of quote IDs to update.
 * @param status - The new status to apply to the quotes.
 * @returns A promise that resolves to an `ActionResult` containing bulk update results,
 * including success and failure counts and individual operation results.
 */
export async function bulkUpdateQuoteStatus(
  ids: string[],
  status: QuoteStatus,
): Promise<
  ActionResult<{
    successCount: number;
    failureCount: number;
    results: { id: string; success: boolean; error?: string }[];
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageQuotes');

    const results = await quoteRepo.bulkUpdateStatus(ids, status, session.user.id);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    revalidatePath('/finances/quotes');

    return {
      success: true,
      data: {
        successCount,
        failureCount,
        results,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update quotes');
  }
}

/**
 * Bulk deletes multiple quotes.
 * Only quotes in DRAFT status can be deleted.
 * @param ids - An array of quote IDs to delete.
 * @returns A promise that resolves to an `ActionResult` containing bulk deletion results.
 */
export async function bulkDeleteQuotes(ids: string[]): Promise<
  ActionResult<{
    successCount: number;
    failureCount: number;
    results: { id: string; success: boolean; error?: string }[];
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageQuotes');

    const results = await quoteRepo.bulkSoftDelete(ids);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    revalidatePath('/finances/quotes');

    return {
      success: true,
      data: {
        successCount,
        failureCount,
        results,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to delete quotes');
  }
}
