import { logger } from '@/lib/logger';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import { generatePdfBuffer } from '@/lib/pdf';
import { InvoiceDocument } from '@/templates/invoice-template';
import { ReceiptDocument } from '@/templates/receipt-template';
import { absoluteUrl } from '@/lib/utils';
import { getLatestDocument, createDocument, getDocumentUrl } from '@/services/document-service';
import { DocumentKind } from '@/prisma/client';
import crypto from 'crypto';

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
 * Generate invoice filename
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}

/**
 * Generate receipt filename using receipt number
 */
export function generateReceiptFilename(receiptNumber: string): string {
  return `${receiptNumber}.pdf`;
}

/**
 * Generate invoice PDF as Buffer (server-side)
 */
export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = InvoiceDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Generate receipt PDF as Buffer (server-side)
 */
export async function generateReceiptPDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = ReceiptDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Calculate hash of PDF content for deduplication.
 * Only includes fields that affect the visual PDF output.
 * 
 * @param invoice - The invoice data
 * @param type - The document type ('invoice' or 'receipt')
 */
function calculateContentHash(invoice: InvoiceWithDetails, type: 'invoice' | 'receipt' = 'invoice'): string {
  const baseData = {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount.toString(),
    customer: {
      firstName: invoice.customer.firstName,
      lastName: invoice.customer.lastName,
      email: invoice.customer.email,
    },
  };

  // Add type-specific fields
  const relevantData = type === 'invoice' 
    ? {
        ...baseData,
        discount: invoice.discount.toString(),
        gst: invoice.gst.toString(),
        issuedDate: invoice.issuedDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: item.total.toString(),
        })),
        notes: invoice.notes,
      }
    : {
        ...baseData,
        paidDate: invoice.paidDate?.toISOString(),
        paymentMethod: invoice.paymentMethod,
      };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(relevantData))
    .digest('hex');
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
  const needsRegeneration = !existingDoc || existingDoc.fileHash !== contentHash;

  let pdfBuffer: Buffer | null = null;
  let s3Key: string;
  let s3Url: string;
  let pdfUrl: string;
  let pdfFileSize: number;
  let wasRegenerated: boolean;

  if (!needsRegeneration && existingDoc) {
    // REUSE EXISTING - Content hasn't changed
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

    logger.info('Reused existing PDF (content unchanged)', {
      context,
      metadata: {
        invoiceId: invoice.id,
        documentId: existingDoc.id,
        contentHash,
        skipDownload,
      },
    });
  } else {
    // GENERATE NEW - Content changed
    logger.info('Generating new PDF (content changed)', {
      context,
      metadata: {
        invoiceId: invoice.id,
        reason: !existingDoc ? 'first_generation' : 'content_changed',
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
  const needsRegeneration = !existingDoc || existingDoc.fileHash !== contentHash;

  let pdfBuffer: Buffer | null = null;
  let s3Key: string;
  let s3Url: string;
  let pdfUrl: string;
  let pdfFileSize: number;
  let wasRegenerated: boolean;

  if (!needsRegeneration && existingDoc) {
    // REUSE EXISTING
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
  } else {
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
