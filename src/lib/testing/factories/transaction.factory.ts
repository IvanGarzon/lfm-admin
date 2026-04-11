/**
 * Transaction Factory
 *
 * Creates mock transaction objects and related data for testing.
 * Uses existing types from schemas and features.
 */

import { testIds } from '../id-generator';
import type { TransactionType, TransactionStatus } from '@/prisma/client';
import type { CreateTransactionInput } from '@/schemas/transactions';
import type {
  TransactionListItem,
  TransactionStatistics,
  TransactionTrend,
  TransactionCategoryBreakdown,
  TopTransactionCategory,
} from '@/features/finances/transactions/types';

// Response type for repository returns (minimal)
interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  status?: TransactionStatus;
}

interface TransactionCategory {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Creates valid transaction input data for create/update mutations.
 */
export function createTransactionInput(
  overrides: Partial<CreateTransactionInput> = {},
): CreateTransactionInput {
  return {
    type: 'INCOME',
    date: new Date(),
    amount: 100,
    currency: 'AUD',
    categoryIds: overrides.categoryIds ?? [testIds.category()],
    description: 'Test Transaction',
    payee: 'Test Payee',
    status: 'COMPLETED',
    referenceNumber: null,
    referenceId: null,
    invoiceId: null,
    ...overrides,
  };
}

/**
 * Creates a mock transaction response as returned by the repository.
 */
export function createTransactionResponse(
  overrides: Partial<TransactionResponse> = {},
): TransactionResponse {
  return {
    id: overrides.id ?? testIds.transaction(),
    type: 'INCOME',
    amount: 100,
    ...overrides,
  };
}

/**
 * Creates a mock transaction with full details.
 */
export function createTransactionWithDetails(
  overrides: Partial<TransactionListItem> = {},
): TransactionListItem {
  return {
    id: testIds.transaction(),
    type: 'INCOME',
    date: new Date(),
    amount: 100,
    currency: 'AUD',
    description: 'Test Transaction',
    payee: 'Test Payee',
    status: 'COMPLETED',
    referenceNumber: null,
    referenceId: null,
    invoiceId: null,
    vendorId: null,
    customerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [{ category: { id: testIds.category(), name: 'Test Category' } }],
    attachments: [],
    invoice: null,
    vendor: null,
    ...overrides,
  };
}

/**
 * Creates a mock transaction category.
 */
export function createTransactionCategory(
  overrides: Partial<TransactionCategory> = {},
): TransactionCategory {
  return {
    id: overrides.id ?? testIds.category(),
    name: overrides.name ?? 'Test Category',
    description: overrides.description ?? null,
    ...overrides,
  };
}

/**
 * Creates mock transaction statistics.
 */
export function createTransactionStatistics(
  overrides: Partial<TransactionStatistics> = {},
): TransactionStatistics {
  return {
    totalIncome: 50000,
    totalExpense: 30000,
    netCashFlow: 20000,
    pendingTransactions: 5,
    completedTransactions: 45,
    totalIncomeGrowth: 10,
    totalExpenseGrowth: 5,
    netCashFlowGrowth: 15,
    avgTransactionSize: 1000,
    ...overrides,
  };
}

/**
 * Creates mock transaction trend data.
 */
export function createTransactionTrend(
  overrides: Partial<TransactionTrend> = {},
): TransactionTrend {
  return {
    month: '2024-01',
    income: 10000,
    expense: 5000,
    net: 5000,
    ...overrides,
  };
}

/**
 * Creates mock category breakdown data.
 */
export function createCategoryBreakdown(
  overrides: Partial<TransactionCategoryBreakdown> = {},
): TransactionCategoryBreakdown {
  return {
    category: 'Office Supplies',
    amount: 5000,
    percentage: 25,
    transactionCount: 10,
    ...overrides,
  };
}

/**
 * Creates mock top category data.
 */
export function createTopCategory(
  overrides: Partial<TopTransactionCategory> = {},
): TopTransactionCategory {
  return {
    categoryId: overrides.categoryId ?? testIds.category(),
    categoryName: 'Office Supplies',
    totalAmount: 5000,
    transactionCount: 10,
    avgTransactionAmount: 500,
    ...overrides,
  };
}
