'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import { QuoteDrawer } from '@/features/finances/quotes/components/quote-drawer';

export default function QuoteModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/quotes/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <QuoteDrawer key={id} id={id} onClose={() => Promise.resolve()} />;
}
