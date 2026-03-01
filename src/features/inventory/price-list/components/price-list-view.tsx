'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { PriceListList } from '@/features/inventory/price-list/components/price-list-list';
import type { PriceListPagination } from '@/features/inventory/price-list/types';

const PriceListDrawer = dynamic(
  () =>
    import('@/features/inventory/price-list/components/price-list-drawer').then(
      (mod) => mod.PriceListDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface PriceListViewProps {
  initialData: PriceListPagination;
  searchParams: SearchParams;
}

export function PriceListView({ initialData, searchParams }: PriceListViewProps) {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const handleShowCreateDrawer = () => {
    setShowCreateDrawer((prev) => !prev);
  };

  return (
    <Box className="flex flex-col gap-6">
      {/* Header */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <h1 className="text-2xl font-bold tracking-tight">Price List</h1>
          <p className="text-muted-foreground">
            Manage your pricing catalog for florals, sundries, and supplies
          </p>
        </Box>
        <Button onClick={() => setShowCreateDrawer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </Box>

      <PriceListList initialData={initialData} searchParams={searchParams} />

      {showCreateDrawer ? (
        <PriceListDrawer open={showCreateDrawer} onClose={handleShowCreateDrawer} />
      ) : null}
    </Box>
  );
}
