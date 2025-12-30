import { prisma } from '@/lib/prisma';
import { DocumentKind, Prisma } from '@/prisma/client';
import { uploadFileToS3, getSignedDownloadUrl, deleteFileFromS3 } from '@/lib/s3';

/**
 * Creates a new document record and uploads the file to S3.
 */
export async function createDocument(data: {
  kind: DocumentKind;
  invoiceId?: string;
  quoteId?: string;
  buffer: Buffer;
  fileName: string;
  fileHash: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}) {
  const { kind, invoiceId, quoteId, buffer, fileName, fileHash, mimeType = 'application/pdf', metadata } = data;

  // Validate that at least one ID is provided
  if (!invoiceId && !quoteId) {
    throw new Error('Document must be linked to an Invoice or Quote');
  }

  // Determine resource ID for S3 path
  const resourceId = invoiceId || quoteId || 'general';
  const resourceType = kind.toLowerCase() + 's'; // invoices, receipts, quotes

  // Upload to S3
  const { s3Key, s3Url } = await uploadFileToS3({
    file: buffer,
    fileName,
    mimeType,
    resourceType,
    resourceId,
    metadata: {
      ...metadata,
      documentKind: kind,
    } as Record<string, string>,
  });

  // Create Database Record
  const document = await prisma.document.create({
    data: {
      kind,
      invoiceId,
      quoteId,
      fileName,
      fileHash,
      fileSize: buffer.length,
      mimeType,
      s3Key,
      s3Url,
      metadata: metadata ?? Prisma.JsonNull,
      generatedAt: new Date(),
      lastAccessedAt: new Date(),
    },
  });

  return document;
}

/**
 * Retrieves the latest document of a specific type for a given entity.
 */
export async function getLatestDocument(
  entityId: string,
  kind: DocumentKind,
) {
  if (kind === DocumentKind.INVOICE || kind === DocumentKind.RECEIPT) {
    return prisma.document.findFirst({
      where: {
        invoiceId: entityId,
        kind,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  return prisma.document.findFirst({
    where: {
      quoteId: entityId,
      kind,
    },
    orderBy: { generatedAt: 'desc' },
  });
}

/**
 * Gets a signed download URL for a document and updates its lastAccessedAt.
 */
export async function getDocumentUrl(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Update access time (fire and forget)
  await prisma.document.update({
    where: { id: documentId },
    data: { lastAccessedAt: new Date() },
  });

  // Generate signed URL with filename to force download
  return getSignedDownloadUrl(document.s3Key, 24 * 60 * 60, document.fileName);
}

/**
 * Soft deletes a document (or hard deletes if preferred).
 * Currently implements hard delete from DB and S3 for cleanup.
 */
export async function deleteDocument(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) return;

  // Delete from S3
  await deleteFileFromS3(document.s3Key);

  // Delete from DB
  await prisma.document.delete({
    where: { id: documentId },
  });
}
