import { QuoteActionProvider } from '@/features/finances/quotes/context/quote-action-context';

export default function QuotesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <QuoteActionProvider>
      {children}
      {modal}
    </QuoteActionProvider>
  );
}
