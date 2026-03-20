import { Download } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

const QuotePreview = dynamic(
  () =>
    import('@/features/finances/quotes/components/preview/quote-preview').then(
      (mod) => mod.QuotePreview,
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

interface QuotePreviewPanelProps {
  quote: QuoteWithDetails;
  onDownloadPdf: () => void;
}

export function QuotePreviewPanel({ quote, onDownloadPdf }: QuotePreviewPanelProps) {
  return (
    <Box
      className="border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col"
      style={{ width: '50%' }}
    >
      <Box className="px-8 py-4 border-b dark:border-gray-800 bg-white dark:bg-gray-925 flex items-center justify-between">
        <p className="text-lg font-semibold">Preview</p>
        <Button type="button" variant="ghost" size="icon" onClick={onDownloadPdf}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Download PDF</span>
        </Button>
      </Box>

      <Box className="flex-1 overflow-hidden">
        <QuotePreview quote={quote} />
      </Box>
    </Box>
  );
}
