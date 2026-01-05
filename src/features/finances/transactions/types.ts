import type { TransactionStatusType } from '@/zod/inputTypeSchemas/TransactionStatusSchema';
import type { TransactionTypeType } from '@/zod/inputTypeSchemas/TransactionTypeSchema';

import { type CreateTransactionInput, type UpdateTransactionInput } from '@/schemas/transactions';

export type TransactionFormInput = CreateTransactionInput | UpdateTransactionInput;

export type TransactionCategory =
  | 'SALES'
  | 'OFFICE_SUPPLIES'
  | 'SALARY'
  | 'RENT'
  | 'CONTRACTORS'
  | 'SOFTWARE'
  | 'MARKETING'
  | 'UTILITIES'
  | 'TAXES'
  | 'OTHER';

export type TransactionAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedBy: string | null;
  uploadedAt: Date;
};

export type Transaction = {
  id: string;
  type: TransactionTypeType;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  payee: string;
  status: TransactionStatusType;
  referenceNumber: string | null;
  referenceId: string | null;
  invoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  attachments?: TransactionAttachment[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  } | null;
};

export type TransactionListItem = Transaction;

export interface TransactionFilters {
  search?: string;
  type?: TransactionTypeType[];
  status?: TransactionStatusType[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}

export type TransactionPagination = {
  items: TransactionListItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
};

export interface TransactionStatistics {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  pendingTransactions: number;
  completedTransactions: number;
  // Growth indicators (compared to previous period)
  totalIncomeGrowth?: number;
  totalExpenseGrowth?: number;
  netCashFlowGrowth?: number;
  // Average transaction size
  avgTransactionSize?: number;
  // Analytics data (optional, loaded separately for performance)
  transactionTrend?: TransactionTrend[];
  categoryBreakdown?: TransactionCategoryBreakdown[];
  topCategories?: TopTransactionCategory[];
}

export type TransactionTrend = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type TransactionCategoryBreakdown = {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
};

export type TopTransactionCategory = {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  avgTransactionAmount: number;
};
