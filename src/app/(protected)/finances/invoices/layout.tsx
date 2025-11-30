import { InvoiceActionProvider } from '@/features/finances/invoices/context/invoice-action-context';

export default function InvoicesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <InvoiceActionProvider>
      {children}
      {modal}
    </InvoiceActionProvider>
  );
}
