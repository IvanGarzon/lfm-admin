'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load InvoiceDrawer to avoid bundling 11+ MB into the modal page chunk
// This significantly improves initial page load performance
const InvoiceDrawer = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-drawer').then(
      (mod) => mod.InvoiceDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function InvoiceModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/invoices/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <InvoiceDrawer key={id} id={id} onClose={() => Promise.resolve()} />;
}
