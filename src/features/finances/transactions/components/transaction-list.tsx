'use client';

import { useMemo, useCallback } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import type { TransactionPagination } from '../types';
import { createTransactionColumns } from './transaction-columns';
import { TransactionTable } from './transaction-table';
import { useDeleteTransaction } from '../hooks/use-transaction-queries';

const DEFAULT_PAGE_SIZE = 20;

export function TransactionList({
  data,
  searchParams: serverSearchParams,
}: {
  data: TransactionPagination;
  searchParams: SearchParams;
}) {
  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const deleteMutation = useDeleteTransaction();

  const transactions = data.items;

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this transaction?')) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const columns = useMemo(() => createTransactionColumns(handleDelete), [handleDelete]);

  const { table } = useDataTable({
    data: transactions,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <TransactionTable
        table={table}
        items={transactions}
        totalItems={data.pagination.totalItems}
      />
    </Box>
  );
}
