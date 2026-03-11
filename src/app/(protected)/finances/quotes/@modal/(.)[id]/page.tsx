'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const QuoteDrawer = dynamic(
  () => import('@/features/finances/quotes/components/quote-drawer').then((mod) => mod.QuoteDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function QuoteModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/quotes/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <QuoteDrawer id={id} onClose={() => Promise.resolve()} />;
}
