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

export type Transaction = {
  id: string;
  type: TransactionTypeType;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  payee: string;
  status: TransactionStatusType;
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
}
