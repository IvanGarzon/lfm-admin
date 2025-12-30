'use client';

import { Table } from '@tanstack/react-table';
import { XCircle, CheckCircle } from 'lucide-react';

import { InvoiceStatus } from '@/prisma/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionsBarProps<TData> {
  table: Table<TData>;
  onUpdateStatus: (rows: TData[], status: string) => void;
  isPending?: boolean;
}

export function BulkActionsBar<TData>({
  table,
  onUpdateStatus,
  isPending,
}: BulkActionsBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border">
      <span className="text-sm font-medium px-2">{selectedCount} selected</span>
      <div className="h-4 w-px bg-border mx-2" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            Update Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              onUpdateStatus(
                selectedRows.map((r) => r.original),
                InvoiceStatus.PENDING,
              )
            }
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onUpdateStatus(
                selectedRows.map((r) => r.original),
                InvoiceStatus.CANCELLED,
              )
            }
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark as Cancelled
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={() => table.toggleAllPageRowsSelected(false)}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
