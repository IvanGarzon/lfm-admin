'use client';

import { Table } from '@tanstack/react-table';
import { XCircle, CheckCircle, Send, PauseCircle, FileX, Trash2, RefreshCw } from 'lucide-react';

import { QuoteStatus } from '@/prisma/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { QuoteListItem } from '../types';

interface BulkActionsBarProps<TData extends QuoteListItem> {
  table: Table<TData>;
  onUpdateStatus: (ids: string[], status: QuoteStatus) => void;
  onDelete: (ids: string[]) => void;
  isPending?: boolean;
}

export function BulkActionsBar<TData extends QuoteListItem>({
  table,
  onUpdateStatus,
  onDelete,
  isPending,
}: BulkActionsBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  if (selectedCount === 0) return null;

  const selectedIds = selectedRows.map((r) => r.original.id);

  // Check if all selected items are DRAFT (for delete action)
  const allDraft = selectedRows.every((r) => r.original.status === 'DRAFT');

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border mb-4">
      <span className="text-sm font-medium px-2">{selectedCount} selected</span>
      <div className="h-4 w-px bg-border mx-2" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            Update Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onUpdateStatus(selectedIds, 'SENT')}>
            <Send className="mr-2 h-4 w-4" />
            Mark as Sent
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(selectedIds, 'ACCEPTED')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Accepted
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(selectedIds, 'REJECTED')}>
            <XCircle className="mr-2 h-4 w-4" />
            Mark as Rejected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(selectedIds, 'ON_HOLD')}>
            <PauseCircle className="mr-2 h-4 w-4" />
            Mark as On Hold
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onUpdateStatus(selectedIds, 'CANCELLED')}
            className="text-destructive focus:text-destructive"
          >
            <FileX className="mr-2 h-4 w-4" />
            Mark as Cancelled
          </DropdownMenuItem>
          {/* DRAFT is usually for reverting, maybe less common in bulk but possible */}
          <DropdownMenuItem onClick={() => onUpdateStatus(selectedIds, 'DRAFT')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Revert to Draft
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {allDraft && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => onDelete(selectedIds)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}

      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={() => table.toggleAllPageRowsSelected(false)}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
