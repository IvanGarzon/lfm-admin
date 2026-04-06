'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useDataTable } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { tenantColumns } from '@/features/admin/tenants/components/tenant-columns';
import { CreateTenantDialog } from '@/features/admin/tenants/components/create-tenant-dialog';
import type { TenantListItem } from '@/features/admin/tenants/types';

export function TenantsList({ initialData }: { initialData: TenantListItem[] }) {
  const [showCreate, setShowCreate] = useState(false);

  const columns = useMemo(() => tenantColumns, []);

  const { table } = useDataTable({
    data: initialData,
    columns,
    pageCount: 1,
    shallow: true,
    debounceMs: 300,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground text-sm">Manage all tenants on the platform</p>
        </Box>
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Tenant
        </Button>
      </Box>

      <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
        <DataTableToolbar table={table} />
        {initialData.length ? (
          <DataTable table={table} totalItems={initialData.length} />
        ) : (
          <Box className="text-center py-12 text-muted-foreground">No tenants found.</Box>
        )}
      </Card>

      <CreateTenantDialog open={showCreate} onOpenChange={setShowCreate} />
    </Box>
  );
}
