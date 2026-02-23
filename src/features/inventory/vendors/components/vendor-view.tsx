'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { VendorList } from './vendor-list';
import { useVendorStatistics } from '@/features/inventory/vendors/hooks/use-vendor-queries';
import type { VendorPagination } from '@/features/inventory/vendors/types';

const VendorDrawer = dynamic(() => import('./vendor-drawer').then((mod) => mod.VendorDrawer), {
  ssr: false,
  loading: () => null,
});

interface VendorsViewProps {
  initialData: VendorPagination;
  searchParams: SearchParams;
}

export function VendorsView({ initialData, searchParams }: VendorsViewProps) {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const { data: stats, isLoading: statsLoading } = useVendorStatistics();

  return (
    <Box className="flex flex-col gap-6">
      {/* Header */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </Box>
        <Button onClick={() => setShowCreateDrawer(true)}>
          <Plus className="mr-2 h-4 w-4" />
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
            <Box className="text-2xl font-bold text-gray-600">{stats.inactive}</Box>
          </Box>
          <Box className="rounded-lg border bg-card p-4">
            <Box className="text-sm font-medium text-muted-foreground">Suspended</Box>
            <Box className="text-2xl font-bold text-red-600">{stats.suspended}</Box>
          </Box>
        </Box>
      ) : null}

      <VendorList initialData={initialData} searchParams={searchParams} />

      {showCreateDrawer ? (
        <VendorDrawer open={showCreateDrawer} onClose={() => setShowCreateDrawer(false)} />
      ) : null}
    </Box>
  );
}
