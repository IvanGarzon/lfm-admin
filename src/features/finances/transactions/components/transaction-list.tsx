'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { SearchParams } from 'nuqs/server';
import dynamic from 'next/dynamic';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { TransactionPagination, Transaction } from '../types';
import { createTransactionColumns } from './transaction-columns';
import { TransactionTable } from './transaction-table';
import { useTransactionStatistics, useDeleteTransaction } from '../hooks/use-transaction-queries';

const TransactionDrawer = dynamic(
  () => import('./transaction-drawer').then((mod) => mod.TransactionDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

const DEFAULT_PAGE_SIZE = 20;

export function TransactionList({
  data,
  searchParams: serverSearchParams,
}: {
  data: TransactionPagination;
  searchParams: SearchParams;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | undefined>(undefined);

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const { data: stats, isLoading: isLoadingStats } = useTransactionStatistics();

  const deleteMutation = useDeleteTransaction();

  const transactions = data.items;

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setShowCreateModal(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this transaction?')) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleShowCreateModal = useCallback(() => {
    setEditingTransactionId(undefined);
    setShowCreateModal((prev) => !prev);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setShowCreateModal(false);
    setEditingTransactionId(undefined);
  }, []);

  const columns = useMemo(
    () => createTransactionColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

  const { table } = useDataTable({
    data: transactions,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      {/* Header */}
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">Track all your income and expenses</p>
        </Box>
        <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? '...' : formatCurrency({ number: stats?.totalIncome || 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingStats ? '...' : formatCurrency({ number: stats?.totalExpense || 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${(stats?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {isLoadingStats ? '...' : formatCurrency({ number: stats?.netCashFlow || 0 })}
            </div>
          </CardContent>
        </Card>
      </Box>

      {/* Transaction Table */}
      <TransactionTable
        table={table}
        items={transactions}
        totalItems={data.pagination.totalItems}
      />

      {/* Transaction Form Drawer */}
      {showCreateModal ? (
        <TransactionDrawer
          id={editingTransactionId}
          open={showCreateModal}
          onClose={handleCloseDrawer}
        />
      ) : null}
    </Box>
  );
}
