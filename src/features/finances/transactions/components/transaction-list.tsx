'use client';

import { useMemo, useCallback, useState } from 'react';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import type { TransactionPagination } from '../types';
import { createTransactionColumns } from './transaction-columns';
import { TransactionTable } from './transaction-table';
import { useDeleteTransaction } from '../hooks/use-transaction-queries';
import { DeleteTransactionDialog } from './dialogs/delete-transaction-dialog';

export function TransactionList({ data }: { data?: TransactionPagination }) {
  const pageCount = data?.pagination.totalPages ?? 0;

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteRef, setPendingDeleteRef] = useState<string | undefined>(undefined);

  const deleteMutation = useDeleteTransaction();

  const handleDeleteRequest = useCallback((id: string, referenceNumber?: string) => {
    setPendingDeleteId(id);
    setPendingDeleteRef(referenceNumber);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId, {
        onSuccess: () => {
          setPendingDeleteId(null);
          setPendingDeleteRef(undefined);
        }
      });
    }
  }, [pendingDeleteId, deleteMutation]);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
    setPendingDeleteRef(undefined);
  }, []);

  const columns = useMemo(
    () => createTransactionColumns(handleDeleteRequest),
    [handleDeleteRequest]
  );

  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: pageCount,
    debounceMs: 500
  });

  return (
    <Box className='space-y-4 min-w-0 w-full'>
      <TransactionTable
        table={table}
        items={data?.items ?? []}
        totalItems={data?.pagination.totalItems ?? 0}
      />

      <DeleteTransactionDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        referenceNumber={pendingDeleteRef}
        isPending={deleteMutation.isPending}
      />
    </Box>
  );
}
