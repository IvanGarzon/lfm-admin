import { PriceListActionProvider } from '@/features/inventory/price-list/context/price-list-action-context';

export default function PriceListLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <PriceListActionProvider>
      {children}
      {modal}
    </PriceListActionProvider>
  );
}
