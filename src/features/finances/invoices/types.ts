import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';
import type { InvoiceStatusType } from '@/zod/inputTypeSchemas/InvoiceStatusSchema';

export type InvoiceFormInput = CreateInvoiceInput | UpdateInvoiceInput;

export type InvoiceStatusHistoryItem = {
  id: string;
  status: InvoiceStatusType;
  previousStatus: InvoiceStatusType | null;
  changedAt: Date;
  changedBy: string | null;
  notes: string | null;
};

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatusType;
  amount: number;
  currency: string;
  issuedDate: Date;
  dueDate: Date;
  itemCount: number;
  amountPaid: number;
  amountDue: number;
};

export type InvoiceWithDetails = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatusType;
  amount: number;
  gst: number;
  discount: number;
  currency: string;
  issuedDate: Date;
  dueDate: Date;
  remindersSent?: number | null;
  paidDate?: Date | null;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  cancelledDate?: Date | null;
  cancelReason?: string | null;
  notes?: string;
  amountPaid: number;
  amountDue: number;
  payments: {
    id: string;
    amount: number;
    date: Date;
    method: string;
    reference: string | null;
    notes: string | null;
  }[];
  statusHistory: InvoiceStatusHistoryItem[];
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: {
      id: string;
      name: string;
    } | null;
  };
  items: {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productId: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatusType[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}

export type InvoicePagination = {
  items: InvoiceListItem[];
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

/**
 * Invoice Actions
 */
export type MarkInvoiceAsPaidData = {
  id: string;
  paidDate: Date;
  paymentMethod: string;
};

export type CancelInvoiceData = {
  id: string;
  cancelledDate: Date;
  cancelReason: string;
};

export type SendInvoiceReminderData = {
  id: string;
};

/**
 * Statistics
 */
export type InvoiceStatistics = {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  cancelled: number;
  overdue: number;
  totalRevenue: number;
  pendingRevenue: number;
  avgInvoiceValue: number;
};

export type StatsDateFilter = {
  startDate?: Date;
  endDate?: Date;
};
