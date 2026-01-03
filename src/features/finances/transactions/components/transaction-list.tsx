'use client';

import { useState, useMemo } from 'react';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import type { TransactionPagination, Transaction } from '../types';
import { createTransactionColumns } from './transaction-columns';
import { TransactionForm } from './transaction-form';
import { TransactionTable } from './transaction-table';
import {
  useTransactionStatistics,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/use-transaction-queries';

const DEFAULT_PAGE_SIZE = 20;

export function TransactionList({
  data,
  searchParams: serverSearchParams,
}: {
  data: TransactionPagination;
  searchParams: SearchParams;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const { data: stats, isLoading: isLoadingStats } = useTransactionStatistics();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const transactions = data.items;

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleShowCreateModal = () => {
    setEditingTransaction(null);
    setShowCreateModal((prev) => !prev);
  };

  const columns = useMemo(() => createTransactionColumns(handleEdit, handleDelete), []);

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
      <Sheet open={showCreateModal} onOpenChange={setShowCreateModal}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</SheetTitle>
            <SheetDescription>
              {editingTransaction
                ? 'Update the transaction details below.'
                : 'Create a new income or expense transaction.'}
            </SheetDescription>
          </SheetHeader>
          <Box className="mt-6">
            <TransactionForm
              transaction={editingTransaction}
              onCreate={(data) => {
                createMutation.mutate(data, {
                  onSuccess: () => {
                    setShowCreateModal(false);
                  },
                });
              }}
              onUpdate={(data) => {
                updateMutation.mutate(data, {
                  onSuccess: () => {
                    setShowCreateModal(false);
                  },
                });
              }}
              onClose={() => setShowCreateModal(false)}
            />
          </Box>
        </SheetContent>
      </Sheet>
    </Box>
  );
}
