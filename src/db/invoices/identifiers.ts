import { Invoice, PrismaClient } from '@/prisma/client';

/**
 * Generate a unique invoice number with format: INV-YYYY-####
 * Automatically increments the sequential number for the current year.
 * Uses raw query to match only numeric suffixes, avoiding Q-prefixed numbers
 * (e.g. INV-2026-Q0001) from converted quotes breaking the sequence.
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the generated invoice number e.g. "INV-2025-0042"
 */
export async function generateInvoiceNumber(
  prisma: PrismaClient,
  tenantId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const rows = await prisma.$queryRaw<{ invoice_number: string }[]>`
    SELECT invoice_number
    FROM invoices
    WHERE tenant_id = ${tenantId}
      AND invoice_number ~ ${`^INV-${year}-\\d{4}$`}
    ORDER BY invoice_number DESC
    LIMIT 1`;

  if (rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(rows[0].invoice_number.split('-')[2], 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Generates a unique receipt number using UUID.
 * Format: RCP-XXXXXXXX where X is uppercase hex from UUID.
 * This eliminates race conditions from the previous check-then-act pattern.
 * @returns A promise that resolves to the generated receipt number e.g. "RCP-A1B2C3D4"
 */
export async function generateInvoiceReceiptNumber(): Promise<string> {
  const crypto = await import('crypto');
  const uuid = crypto.randomUUID();
  // Take first 8 characters of UUID (without hyphens) and uppercase
  const shortId = uuid.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `RCP-${shortId}`;
}

/**
 * Update the receipt number on an invoice.
 * Used when a receipt number needs to be assigned after the invoice was marked as paid.
 * @param prisma - The Prisma client instance
 * @param id - The invoice ID
 * @param tenantId - The tenant ID to scope the update
 * @param receiptNumber - The receipt number to set
 * @returns A promise that resolves to the updated invoice
 */
export async function updateInvoiceReceiptNumber(
  prisma: PrismaClient,
  id: string,
  tenantId: string,
  receiptNumber: string
): Promise<Invoice> {
  return prisma.invoice.update({
    where: { id, tenantId },
    data: { receiptNumber }
  });
}
