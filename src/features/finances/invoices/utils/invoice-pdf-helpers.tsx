import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { InvoiceWithDetails } from '../types';
import { InvoiceDocument } from '@/templates/invoice-template';
import { ReceiptDocument } from '@/templates/receipt-template';

/**
 * Download invoice as PDF
 * Accepts both Invoice and InvoiceWithDetails types
 */
export async function downloadInvoicePdf(invoice: InvoiceWithDetails): Promise<void> {
  try {
    const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('PDF downloaded successfully');
  } catch (error) {
    toast.error('Failed to generate PDF');
    // Re-throw to let caller handle error
    throw error;
  }
}

/**
 * Download receipt as PDF
 * Generates a receipt PDF for a paid invoice
 */
export async function downloadReceiptPdf(invoice: InvoiceWithDetails): Promise<void> {
  try {
    const blob = await pdf(<ReceiptDocument invoice={invoice} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Receipt PDF downloaded successfully');
  } catch (error) {
    toast.error('Failed to generate receipt PDF');
    // Re-throw to let caller handle error
    throw error;
  }
}
