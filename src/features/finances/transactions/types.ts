import type { TransactionStatus } from '@/zod/schemas/enums/TransactionStatus.schema';
import type { TransactionType } from '@/zod/schemas/enums/TransactionType.schema';
import type { PaginationMeta } from '@/types/pagination';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/schemas/transactions';

export type TransactionFormInput = CreateTransactionInput | UpdateTransactionInput;

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

export type TransactionListItem = {
  id: string;
  type: TransactionType;
  date: Date;
  amount: number;
  currency: string;
  description: string;
  payee: string;
  status: TransactionStatus;
  referenceNumber: string | null;
  referenceId: string | null;
  invoiceId: string | null;
  vendorId: string | null;
  customerId: string | null;
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
  vendor?: {
    id: string;
    name: string;
  } | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export interface TransactionFilters {
  search?: string;
  type?: TransactionType[];
  status?: TransactionStatus[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}

export type TransactionPagination = {
  items: TransactionListItem[];
  pagination: PaginationMeta;
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
