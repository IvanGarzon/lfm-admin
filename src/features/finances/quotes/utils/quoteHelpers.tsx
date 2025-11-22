import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { QuoteWithDetails } from '../types';
import { QuoteDocument } from '@/templates/quote-template';

/**
 * Download quote as PDF
 */
export async function downloadQuotePdf(quote: QuoteWithDetails): Promise<void> {
  try {
    const blob = await pdf(<QuoteDocument quote={quote} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quote.quoteNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    throw error;
  }
}
