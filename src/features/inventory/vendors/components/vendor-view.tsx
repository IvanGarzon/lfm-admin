'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { VendorList } from '@/features/inventory/vendors/components/vendor-list';
import { useVendorStatistics } from '@/features/inventory/vendors/hooks/use-vendor-queries';
import type { VendorPagination } from '@/features/inventory/vendors/types';

const VendorDrawer = dynamic(
  () =>
    import('@/features/inventory/vendors/components/vendor-drawer').then((mod) => mod.VendorDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

interface VendorsViewProps {
  initialData: VendorPagination;
  searchParams: SearchParams;
}

export function VendorsView({ initialData, searchParams }: VendorsViewProps) {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const { data: stats, isLoading: statsLoading } = useVendorStatistics();

  const handleShowCreateDrawer = () => {
    setShowCreateDrawer((prev) => !prev);
  };

  return (
    <Box className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
      {/* Header */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </Box>
        <Button onClick={handleShowCreateDrawer}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Vendor
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && !statsLoading ? (
        <Box className="grid gap-4 md:grid-cols-4">
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Total Vendors</Box>
            <Box className="text-2xl font-bold">{stats.total}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Active</Box>
            <Box className="text-2xl font-bold text-green-600">{stats.active}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Inactive</Box>
            <Box className="text-2xl font-bold text-muted-foreground">{stats.inactive}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Suspended</Box>
            <Box className="text-2xl font-bold text-destructive">{stats.suspended}</Box>
          </Box>
        </Box>
      ) : null}

      <VendorList initialData={initialData} searchParams={searchParams} />

      {showCreateDrawer ? (
        <VendorDrawer open={showCreateDrawer} onClose={handleShowCreateDrawer} />
      ) : null}
    </Box>
  );
}
