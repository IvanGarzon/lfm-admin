import { prisma } from '@/lib/prisma';

/**
 * Generates a unique receipt number in the format: XXXX-XXXX-XXXX
 * Uses only numbers for simplicity and uniqueness.
 * 
 * @returns A unique receipt number string
 */
export async function generateReceiptNumber(): Promise<string> {
  let receiptNumber = '';
  let isUnique = false;

  const generateNumberSegment = () => Math.floor(1000 + Math.random() * 9000);

  while (!isUnique) {
    // Generate 12 random digits
    const part1 = generateNumberSegment();
    const part2 = generateNumberSegment();
    const part3 = generateNumberSegment();

    receiptNumber = `${part1}-${part2}-${part3}`;

    // Check if this number already exists
    const existing = await prisma.invoice.findUnique({
      where: { receiptNumber },
      select: { id: true },
    });

    isUnique = !existing;
  }

  return receiptNumber;
}
