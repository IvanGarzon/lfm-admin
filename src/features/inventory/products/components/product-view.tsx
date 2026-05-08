'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useQueryStates } from 'nuqs';

import { EmptyState } from '@/components/shared/empty-state';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { hasActiveSearchFilters } from '@/lib/utils';
import { searchParams as productSearchParams } from '@/filters/products/products-filters';
import { ProductList } from '@/features/inventory/products/components/product-list';
import {
  useProducts,
  useProductStatistics
} from '@/features/inventory/products/hooks/use-products-queries';

const ProductDrawer = dynamic(
  () =>
    import('@/features/inventory/products/components/product-drawer').then(
      (mod) => mod.ProductDrawer
    ),
  {
    ssr: false,
    loading: () => null
  }
);

export function ProductsView() {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const [currentParams] = useQueryStates(productSearchParams);
  const { data } = useProducts(currentParams);

  const { data: stats, isLoading: statsLoading } = useProductStatistics({ enabled: true });

  const handleShowCreateDrawer = () => {
    setShowCreateDrawer((prev) => !prev);
  };

  const isZeroState =
    (data?.pagination.totalItems ?? 0) === 0 &&
    !hasActiveSearchFilters(currentParams, productSearchParams);

  return (
    <Box className='flex flex-col gap-6 min-w-0 w-full overflow-hidden'>
      {isZeroState ? (
        <EmptyState
          icon={Package}
          title='No products yet'
          description='Add your first product to start managing your catalogue and inventory.'
          action={
            <Button onClick={() => setShowCreateDrawer(true)}>
              <Plus className='h-4 w-4' aria-hidden='true' />
              Add Product
            </Button>
          }
        />
      ) : (
        <>
          <Box className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <Box>
              <h1 className='text-2xl font-bold tracking-tight'>Products</h1>
              <p className='text-muted-foreground'>Manage your product catalog and inventory</p>
            </Box>
            <Button onClick={() => setShowCreateDrawer(true)}>
              <Plus className='h-4 w-4' aria-hidden='true' />
              Add Product
            </Button>
          </Box>

          {stats && !statsLoading ? (
            <Box className='grid gap-4 md:grid-cols-4'>
              <Box className='rounded-lg border bg-card p-4'>
                <Box className='text-sm font-medium text-muted-foreground'>Total Products</Box>
                <Box className='text-2xl font-bold'>{stats.totalProducts}</Box>
              </Box>
              <Box className='rounded-lg border bg-card p-4'>
                <Box className='text-sm font-medium text-muted-foreground'>Active</Box>
                <Box className='text-2xl font-bold text-green-600'>
                  {stats.activeProducts}
                  <span className='sr-only'> active products</span>
                </Box>
              </Box>
              <Box className='rounded-lg border bg-card p-4'>
                <Box className='text-sm font-medium text-muted-foreground'>Out of Stock</Box>
                <Box className='text-2xl font-bold text-red-600'>
                  {stats.outOfStockProducts}
                  <span className='sr-only'> out of stock products</span>
                </Box>
              </Box>
              <Box className='rounded-lg border bg-card p-4'>
                <Box className='text-sm font-medium text-muted-foreground'>Low Stock</Box>
                <Box className='text-2xl font-bold text-amber-600'>
                  {stats.lowStockProducts}
                  <span className='sr-only'> low stock products</span>
                </Box>
              </Box>
            </Box>
          ) : null}

          <ProductList data={data} />
        </>
      )}

      {showCreateDrawer ? (
        <ProductDrawer open={showCreateDrawer} onClose={handleShowCreateDrawer} />
      ) : null}
    </Box>
  );
}
