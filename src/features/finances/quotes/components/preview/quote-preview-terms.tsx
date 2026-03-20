import { Box } from '@/components/ui/box';

interface QuotePreviewTermsProps {
  terms: string | null | undefined;
  currency: string;
}

export function QuotePreviewTerms({ terms, currency }: QuotePreviewTermsProps) {
  const defaultTerms = `This quote is valid for the period specified above. Prices are in ${currency} and are subject to change after the expiration date. Acceptance of this quote constitutes agreement to these terms. Please retain this quote for your records.`;

  return (
    <Box className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
        Terms & Conditions
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {terms || defaultTerms}
      </p>
    </Box>
  );
}
