'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const RecipeDrawer = dynamic(
  () =>
    import('@/features/finances/recipes/components/recipe-drawer').then((mod) => mod.RecipeDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function RecipeModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pathname = usePathname();
  const shouldRender = pathname?.includes(`/recipes/${id}`) ?? false;

  if (!shouldRender) {
    return null;
  }

  return <RecipeDrawer id={id} onClose={() => Promise.resolve()} />;
}
