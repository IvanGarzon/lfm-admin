'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import { InvoiceDrawer } from '@/features/finances/invoices/components/invoice-drawer';

export default function InvoiceModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/invoices/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <InvoiceDrawer key={id} id={id} onClose={() => Promise.resolve()} />;
}
