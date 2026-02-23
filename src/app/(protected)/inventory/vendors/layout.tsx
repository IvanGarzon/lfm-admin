import { VendorActionProvider } from '@/features/inventory/vendors/context/vendor-action-context';

export default function VendorsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <VendorActionProvider>
      {children}
      {modal}
    </VendorActionProvider>
  );
}
