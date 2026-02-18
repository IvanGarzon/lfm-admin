'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { ProductList } from '@/features/inventory/products/components/product-list';
import { useProductStatistics } from '@/features/inventory/products/hooks/use-products-queries';
import type { ProductPagination } from '@/features/inventory/products/types';

const ProductDrawer = dynamic(
  () =>
    import('@/features/inventory/products/components/product-drawer').then(
      (mod) => mod.ProductDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface ProductsViewProps {
  initialData: ProductPagination;
  searchParams: SearchParams;
}

export function ProductsView({ initialData, searchParams }: ProductsViewProps) {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const { data: stats, isLoading: statsLoading } = useProductStatistics({ enabled: true });

  const handleShowCreateDrawer = () => {
    setShowCreateDrawer((prev) => !prev);
  };

  return (
    <Box className="flex flex-col gap-6">
      {/* Header */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </Box>
        <Button onClick={() => setShowCreateDrawer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && !statsLoading ? (
        <Box className="grid gap-4 md:grid-cols-4">
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Total Products</Box>
            <Box className="text-2xl font-bold">{stats.totalProducts}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Active</Box>
            <Box className="text-2xl font-bold text-green-600">{stats.activeProducts}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Out of Stock</Box>
            <Box className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Low Stock</Box>
            <Box className="text-2xl font-bold text-amber-600">{stats.lowStockProducts}</Box>
          </Box>
        </Box>
      ) : null}

      <ProductList initialData={initialData} searchParams={searchParams} />

      {showCreateDrawer ? (
        <ProductDrawer open={showCreateDrawer} onClose={handleShowCreateDrawer} />
      ) : null}
    </Box>
  );
}
