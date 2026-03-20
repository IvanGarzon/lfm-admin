import { Box } from '@/components/ui/box';

interface QuotePreviewNotesProps {
  notes: string | null | undefined;
}

export function QuotePreviewNotes({ notes }: QuotePreviewNotesProps) {
  if (!notes) {
    return null;
  }

  return (
    <Box className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Notes:</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{notes}</p>
    </Box>
  );
}
