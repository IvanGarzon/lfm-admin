import { pdf } from '@react-pdf/renderer';

/**
 * Generate PDF as Buffer from a React Element (server-side)
 * @param document - The React Element to render as PDF
 * @returns Promise<Buffer> - The PDF as a Buffer
 */
export async function generatePdfBuffer(document: React.ReactElement): Promise<Buffer> {
  // @ts-ignore - ReactPDF types are strict about DocumentProps but we want to allow any valid React Element that renders a Document
  const asPdf = pdf(document);
  const blob = await asPdf.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
