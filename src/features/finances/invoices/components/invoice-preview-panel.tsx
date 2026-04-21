import { Download } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import type {
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
} from '@/features/finances/invoices/types';

const InvoicePreview = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-preview').then(
      (mod) => mod.InvoicePreview,
    ),
  {
    ssr: false,
    loading: () => (
      <Box className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </Box>
    ),
  },
);

interface InvoicePreviewPanelProps {
  invoice: InvoiceMetadata;
  items?: InvoiceItemDetail[];
  payments?: InvoicePaymentItem[];
  isLoadingItems?: boolean;
  isLoadingPayments?: boolean;
  onDownloadPdf: () => void;
}

export function InvoicePreviewPanel({
  invoice,
  items,
  payments,
  isLoadingItems,
  isLoadingPayments,
  onDownloadPdf,
}: InvoicePreviewPanelProps) {
  return (
    <Box
      className="border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col"
      style={{ width: '50%' }}
    >
      <Box className="px-8 py-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
        <p className="text-lg font-semibold">Preview</p>
        <Button type="button" variant="ghost" size="icon" onClick={onDownloadPdf}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Download PDF</span>
        </Button>
      </Box>

      <Box className="flex-1 overflow-hidden">
        <InvoicePreview
          invoice={invoice}
          items={items}
          payments={payments}
          isLoadingItems={isLoadingItems}
          isLoadingPayments={isLoadingPayments}
        />
      </Box>
    </Box>
  );
}
