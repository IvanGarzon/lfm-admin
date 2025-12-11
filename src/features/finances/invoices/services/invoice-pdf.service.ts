import { logger } from '@/lib/logger';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import { getLatestDocument, createDocument, getDocumentUrl } from '@/services/document-service';
import { DocumentKind } from '@/prisma/client';
import {
  generateInvoiceFilename,
  generateReceiptFilename,
  calculateContentHash,
  generateInvoicePDF,
  generateReceiptPDF
} from '../utils/invoice-helpers';

export interface PdfResult {
  /** PDF file buffer (only populated if skipDownload is false) */
  pdfBuffer: Buffer | null;
  /** S3 key where PDF is stored */
  s3Key: string;
  /** Public or internal S3 URL (not signed) */
  s3Url: string;
  /** Signed URL for downloading the PDF */
  pdfUrl: string;
  /** Filename of the PDF */
  pdfFilename: string;
  /** Size of the PDF file in bytes */
  pdfFileSize: number;
  /** Whether a new PDF was generated (true) or existing was reused (false) */
  wasRegenerated: boolean;
}

export interface GetPdfOptions {
  /** Number of seconds the signed URL should be valid for (default: 7 days) */
  urlExpirationSeconds?: number;
  /** Skip downloading the PDF buffer (useful when only URL is needed) */
  skipDownload?: boolean;
  /** Context for logging purposes */
  context?: string;
}

/**
 * Gets or generates an invoice PDF using DocumentService.
 *
 * Strategy:
 * 1. Calculate hash of invoice content (only PDF-relevant fields).
 * 2. Check if a document with the same hash exists.
 * 3. If yes, reuse it. If no, generate new PDF and save.
 * 
 * This prevents duplicate PDFs when only non-visual fields change
 * (e.g., status, updatedAt, notes that don't appear in PDF).
 */
export async function getOrGenerateInvoicePdf(
  invoice: InvoiceWithDetails,
  options: GetPdfOptions = {}
): Promise<PdfResult> {
  const {
    skipDownload = false,
    context = 'getOrGenerateInvoicePdf',
  } = options;

  const pdfFilename = generateInvoiceFilename(invoice.invoiceNumber);

  // Step 1: Calculate content hash
  const contentHash = calculateContentHash(invoice, 'invoice');

  // Step 2: Check for existing document with same hash
  const existingDoc = await getLatestDocument(
    invoice.id,
    DocumentKind.INVOICE,
  );

  // Step 3: Determine if regeneration is needed
  // Only regenerate if content hash changed
  let needsRegeneration = !existingDoc || existingDoc.fileHash !== contentHash;

  let pdfBuffer: Buffer | null = null;
  let s3Key = '';
  let s3Url = '';
  let pdfUrl = '';
  let pdfFileSize = 0;
  let wasRegenerated = false;

  // Determine if we should try to reuse existing
  const shouldTryReuse = !needsRegeneration && existingDoc;
  let reuseSuccessful = false;

  if (shouldTryReuse && existingDoc) {
    try {
      s3Key = existingDoc.s3Key;
      s3Url = existingDoc.s3Url;
      pdfFileSize = existingDoc.fileSize;

      // Get signed URL
      pdfUrl = await getDocumentUrl(existingDoc.id);

      // Download buffer if requested
      if (!skipDownload) {
        const { downloadFileFromS3 } = await import('@/lib/s3');
        pdfBuffer = await downloadFileFromS3(s3Key);
      }

      wasRegenerated = false;
      reuseSuccessful = true;

      logger.info('Reused existing PDF (content unchanged)', {
        context,
        metadata: {
          invoiceId: invoice.id,
          documentId: existingDoc.id,
          contentHash,
          skipDownload,
        },
      });
    } catch (error) {
      // If S3 file is missing, regenerate the PDF
      logger.warn('S3 file missing for existing document, regenerating PDF', {
        context,
        metadata: {
          invoiceId: invoice.id,
          s3Key: existingDoc?.s3Key,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  // Generate new PDF if reuse wasn't successful
  if (!reuseSuccessful) {
    // GENERATE NEW - Content changed or S3 file missing
    logger.info('Generating new PDF', {
      context,
      metadata: {
        invoiceId: invoice.id,
        reason: !existingDoc ? 'first_generation' : 'content_changed_or_missing',
        oldHash: existingDoc?.fileHash,
        newHash: contentHash,
      },
    });

    const generatedPdfBuffer = await generateInvoicePDF(invoice);
    pdfFileSize = generatedPdfBuffer.byteLength;

    // Save via DocumentService (handles S3 upload + DB record)
    const newDoc = await createDocument({
      kind: DocumentKind.INVOICE,
      invoiceId: invoice.id,
      buffer: generatedPdfBuffer,
      fileName: pdfFilename,
      fileHash: contentHash,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });

    s3Key = newDoc.s3Key;
    s3Url = newDoc.s3Url;

    // Get signed URL
    pdfUrl = await getDocumentUrl(newDoc.id);

    if (!skipDownload) {
      pdfBuffer = generatedPdfBuffer;
    }

    wasRegenerated = true;
  }

  return {
    pdfBuffer,
    s3Key,
    s3Url,
    pdfUrl,
    pdfFilename,
    pdfFileSize,
    wasRegenerated,
  };
}

/**
 * Gets or generates a receipt PDF using DocumentService.
 *
 * Strategy:
 * 1. Check DocumentService for latest 'RECEIPT' document.
 * 2. If exists and valid (not stale), return URL.
 * 3. If missing or stale, generate new PDF and save via DocumentService.
 */
export async function getOrGenerateReceiptPdf(
  invoice: InvoiceWithDetails,
  options: GetPdfOptions = {}
): Promise<PdfResult> {
  const {
    skipDownload = false,
    context = 'getOrGenerateReceiptPdf',
  } = options;

  const pdfFilename = generateReceiptFilename(invoice.receiptNumber || invoice.invoiceNumber);

  // Step 1: Calculate content hash
  const contentHash = calculateContentHash(invoice, 'receipt');

  // Step 2: Check for existing document
  const existingDoc = await getLatestDocument(
    invoice.id,
    DocumentKind.RECEIPT,
  );

  // Step 3: Determine if regeneration is needed
  let needsRegeneration = !existingDoc || existingDoc.fileHash !== contentHash;

  let pdfBuffer: Buffer | null = null;
  let s3Key = '';
  let s3Url = '';
  let pdfUrl = '';
  let pdfFileSize = 0;
  let wasRegenerated = false;

  if (!needsRegeneration && existingDoc) {
    // REUSE EXISTING - but verify file exists in S3
    try {
      s3Key = existingDoc.s3Key;
      s3Url = existingDoc.s3Url;
      pdfFileSize = existingDoc.fileSize;

      // Get signed URL
      pdfUrl = await getDocumentUrl(existingDoc.id);

      // Download buffer if requested
      if (!skipDownload) {
        const { downloadFileFromS3 } = await import('@/lib/s3');
        pdfBuffer = await downloadFileFromS3(s3Key);
      }

      wasRegenerated = false;

      logger.info('Reused existing receipt PDF from DocumentService', {
        context,
        metadata: {
          invoiceId: invoice.id,
          documentId: existingDoc.id,
          skipDownload,
        },
      });
    } catch (error) {
      // If S3 file is missing, regenerate the PDF
      logger.warn('S3 file missing for existing document, regenerating PDF', {
        context,
        metadata: {
          invoiceId: invoice.id,
          s3Key: existingDoc.s3Key,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      needsRegeneration = true;
    }
  }

  if (needsRegeneration || !existingDoc) {
    // GENERATE NEW
    logger.info('Generating new receipt PDF', {
      context,
      metadata: {
        invoiceId: invoice.id,
        reason: !existingDoc ? 'first_generation' : 'content_changed',
      },
    });

    const generatedPdfBuffer = await generateReceiptPDF(invoice);
    pdfFileSize = generatedPdfBuffer.byteLength;

    // Save via DocumentService (handles S3 upload + DB record)
    const newDoc = await createDocument({
      kind: DocumentKind.RECEIPT,
      invoiceId: invoice.id,
      buffer: generatedPdfBuffer,
      fileName: pdfFilename,
      fileHash: contentHash,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paidDate: invoice.paidDate,
      },
    });

    s3Key = newDoc.s3Key;
    s3Url = newDoc.s3Url;

    // Get signed URL
    pdfUrl = await getDocumentUrl(newDoc.id);

    if (!skipDownload) {
      pdfBuffer = generatedPdfBuffer;
    }

    wasRegenerated = true;
  }

  // TypeScript flow analysis safety check (should never happen)
  if (!s3Key || !s3Url || !pdfUrl || pdfFileSize === undefined || wasRegenerated === undefined) {
    throw new Error('PDF generation failed: variables not properly assigned');
  }

  return {
    pdfBuffer,
    s3Key,
    s3Url,
    pdfUrl,
    pdfFilename,
    pdfFileSize,
    wasRegenerated,
  };
}
