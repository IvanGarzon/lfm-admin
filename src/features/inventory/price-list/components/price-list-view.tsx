'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { EmptyState } from '@/components/shared/empty-state';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { hasActiveSearchFilters } from '@/lib/utils';
import { searchParams as priceListSearchParams } from '@/filters/price-list/price-list-filters';
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

  const isZeroState =
    initialData.pagination.totalItems === 0 &&
    !hasActiveSearchFilters(searchParams, priceListSearchParams);

  return (
    <Box className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
      {isZeroState ? (
        <EmptyState
          icon={Tag}
          title="No price list items yet"
          description="Add your first item to start building your pricing catalogue."
          action={
            <Button onClick={handleShowCreateDrawer}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Item
            </Button>
          }
        />
      ) : (
        <>
          <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Box>
              <h1 className="text-2xl font-bold tracking-tight">Price List</h1>
              <p className="text-muted-foreground">
                Manage your pricing catalog for florals, sundries, and supplies
              </p>
            </Box>
            <Button onClick={handleShowCreateDrawer}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Item
            </Button>
          </Box>

          <PriceListList initialData={initialData} searchParams={searchParams} />
        </>
      )}

      {showCreateDrawer ? (
        <PriceListDrawer open={showCreateDrawer} onClose={handleShowCreateDrawer} />
      ) : null}
    </Box>
  );
}
