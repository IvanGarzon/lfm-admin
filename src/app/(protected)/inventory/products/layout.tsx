import { ProductActionProvider } from '@/features/inventory/products/context/product-action-context';

export default function ProductsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <ProductActionProvider>
      {children}
      {modal}
    </ProductActionProvider>
  );
}
