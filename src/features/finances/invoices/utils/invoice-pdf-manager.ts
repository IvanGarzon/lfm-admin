import { logger } from '@/lib/logger';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import { generatePdfBuffer } from '@/lib/pdf';
import { InvoiceDocument  } from '@/templates/invoice-template';
import { ReceiptDocument  } from '@/templates/receipt-template';
import { absoluteUrl } from '@/lib/utils';

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
  /** 
   * Hours to trust PDF metadata without verifying S3 existence (default: 24)
   * Set to 0 to always verify with S3
   */
  metadataTrustHours?: number;
}

/**
 * Generate invoice filename
 * @param invoiceNumber - The invoice number
 * @returns string - The filename
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}

/**
 * Generate receipt filename
 * @param invoiceNumber - The invoice number
 * @returns string - The filename
 */
export function generateReceiptFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}

/**
 * Generate invoice PDF as Buffer (server-side)
 * @param invoice - The invoice details
 * @returns Promise<Buffer> - The PDF as a Buffer
 */
export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = InvoiceDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Generate receipt PDF as Buffer (server-side)
 * @param invoice - The invoice details
 * @returns Promise<Buffer> - The PDF as a Buffer
 */
export async function generateReceiptPDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  // For now, we'll generate invoice PDF
  // In the future, create a server-side receipt template
  const logoUrl = absoluteUrl("/static/logo-green-800.png");
  const pdfDoc = ReceiptDocument({ invoice, logoUrl });
  return generatePdfBuffer(pdfDoc);
}

/**
 * Gets or generates an invoice PDF with intelligent caching.
 * 
 * This function implements a smart caching strategy:
 * 1. Checks if PDF metadata exists in database
 * 2. Determines if regeneration is needed (invoice updated after last PDF generation)
 * 3. Verifies PDF still exists in S3
 * 4. Reuses existing PDF if valid, or generates new one if needed
 * 
 * @param invoice - The invoice with full details
 * @param options - Configuration options
 * @returns PDF result with buffer, URL, and metadata
 */
export async function getOrGenerateInvoicePdf(
  invoice: InvoiceWithDetails,
  options: GetPdfOptions = {}
): Promise<PdfResult> {
  const {
    urlExpirationSeconds = 7 * 24 * 60 * 60, // 7 days default
    skipDownload = false,
    context = 'getOrGenerateInvoicePdf',
    metadataTrustHours = 24, // Trust metadata for 24 hours by default
  } = options;

  // Import S3 utilities
  const {
    uploadFileToS3,
    getSignedDownloadUrl,
    fileExistsInS3,
    downloadFileFromS3,
    deleteFileFromS3,
  } = await import('@/lib/s3');

  const pdfFilename = generateInvoiceFilename(invoice.invoiceNumber);

  // Step 1: Check if PDF metadata exists in database
  const hasPdfMetadata = Boolean(invoice.s3Key && invoice.s3Url);

  // Step 2: Determine if regeneration is needed
  const needsRegeneration =
    hasPdfMetadata &&
    invoice.lastGeneratedAt &&
    invoice.updatedAt > invoice.lastGeneratedAt;

  // Step 3: Determine if we should trust metadata without S3 verification
  const metadataTrustMs = metadataTrustHours * 60 * 60 * 1000;
  const metadataAge = invoice.lastGeneratedAt 
    ? Date.now() - invoice.lastGeneratedAt.getTime()
    : Infinity;
  const shouldTrustMetadata = 
    hasPdfMetadata && 
    !needsRegeneration && 
    metadataAge < metadataTrustMs;

  // Step 4: Verify PDF exists in S3 (only if metadata exists, no regeneration needed, and outside trust window)
  let pdfExists: boolean;
  
  if (shouldTrustMetadata) {
    // Trust metadata without S3 API call
    pdfExists = true;
    logger.debug('Trusting PDF metadata without S3 verification', {
      context,
      metadata: {
        invoiceId: invoice.id,
        metadataAgeHours: Math.round(metadataAge / (60 * 60 * 1000)),
        trustWindowHours: metadataTrustHours,
      },
    });
  } else if (hasPdfMetadata && !needsRegeneration) {
    // Verify with S3 API call
    pdfExists = await fileExistsInS3(invoice.s3Key!);
    logger.debug('Verified PDF existence with S3 API call', {
      context,
      metadata: {
        invoiceId: invoice.id,
        exists: pdfExists,
        s3Key: invoice.s3Key,
      },
    });
  } else {
    pdfExists = false;
  }

  let pdfBuffer: Buffer | null = null;
  let s3Key: string;
  let s3Url: string;
  let pdfUrl: string;
  let pdfFileSize: number;
  let wasRegenerated: boolean;

  // Step 5: Reuse existing PDF if valid
  if (pdfExists) {
    s3Key = invoice.s3Key!;
    s3Url = invoice.s3Url!;
    pdfFileSize = invoice.fileSize || 0; // Fallback if missing, though it should exist
    pdfUrl = await getSignedDownloadUrl(s3Key, urlExpirationSeconds);

    // Only download if needed
    if (!skipDownload) {
      pdfBuffer = await downloadFileFromS3(s3Key);
      pdfFileSize = pdfBuffer.byteLength; // Update with actual size if downloaded
    }

    wasRegenerated = false;

    logger.info('Reused existing PDF from S3', {
      context,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        s3Key,
        skipDownload,
      },
    });
  }
  // Step 6: Generate new PDF
  else {
    // Delete stale PDF from S3 if it exists
    if (hasPdfMetadata) {
      try {
        await deleteFileFromS3(invoice.s3Key!);
        logger.debug('Deleted stale PDF from S3', {
          context,
          metadata: { invoiceId: invoice.id, oldS3Key: invoice.s3Key },
        });
      } catch (error) {
        logger.debug('Old PDF file not found in S3 during cleanup', {
          context,
          metadata: { invoiceId: invoice.id, oldS3Key: invoice.s3Key },
        });
      }
    }

    // Generate new PDF
    logger.info('Generating new PDF', {
      context,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        reason: needsRegeneration ? 'invoice_updated' : hasPdfMetadata ? 'file_not_found' : 'first_generation',
      },
    });

    const generatedPdfBuffer = await generateInvoicePDF(invoice);
    pdfFileSize = generatedPdfBuffer.byteLength;

    // Upload to S3
    const result = await uploadFileToS3({
      file: generatedPdfBuffer,
      fileName: pdfFilename,
      mimeType: 'application/pdf',
      resourceType: 'invoices',
      resourceId: invoice.id,
      allowedMimeTypes: ['application/pdf'],
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      },
    });

    s3Key = result.s3Key;
    s3Url = result.s3Url;
    pdfUrl = await getSignedDownloadUrl(s3Key, urlExpirationSeconds);

    // Only keep buffer if needed
    if (!skipDownload) {
      pdfBuffer = generatedPdfBuffer;
    }

    wasRegenerated = true;

    logger.info('Generated and uploaded new PDF', {
      context,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        s3Key,
        fileSize: pdfFileSize,
      },
    });
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
