import { PrismaClient } from '@/prisma/client';

/**
 * Generate a unique quote number based on the current year.
 * Format: QUO-YYYY-NNNN (e.g., QUO-2025-0001)
 * @param prisma - The Prisma client instance
 * @param tenantId - The tenant ID to scope the query
 * @returns A promise that resolves to the next available quote number for the current year
 */
export async function generateQuoteNumber(prisma: PrismaClient, tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;

  const lastQuote = await prisma.quote.findFirst({
    where: {
      tenantId,
      quoteNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      quoteNumber: 'desc'
    },
    select: {
      quoteNumber: true
    }
  });

  if (!lastQuote) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2], 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}
