import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
import type { QuoteStatusType } from '@/zod/inputTypeSchemas/QuoteStatusSchema';

export type QuoteFormInput = CreateQuoteInput | UpdateQuoteInput;

export type QuoteListItem = {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: QuoteStatusType;
  amount: number;
  currency: string;
  gst: number;
  discount: number;
  issuedDate: Date;
  validUntil: Date;
  itemCount: number;
  attachmentCount: number;
  versionNumber: number;
  parentQuoteId: string | null;
};

export type QuoteStatusHistoryItem = {
  id: string;
  status: QuoteStatusType;
  previousStatus: QuoteStatusType | null;
  changedAt: Date;
  changedBy: string | null;
  notes: string | null;
};

export type QuoteWithDetails = {
  id: string;
  quoteNumber: string;
  status: QuoteStatusType;
  amount: number;
  currency: string;
  gst: number;
  discount: number;
  issuedDate: Date;
  validUntil: Date;
  invoiceId?: string | null;
  notes?: string;
  terms?: string;
  versionNumber: number;
  parentQuoteId?: string | null;
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
    quoteId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productId: string | null;
    notes: string | null;
    order: number;
    colors: string[];
    createdAt: Date;
    attachments: QuoteItemAttachment[];
  }[];
  attachments: QuoteAttachment[];
  statusHistory: QuoteStatusHistoryItem[];
};

export type QuoteAttachment = {
  id: string;
  quoteId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedBy: string | null;
  uploadedAt: Date;
};

export type QuoteItemAttachment = {
  id: string;
  quoteItemId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedBy: string | null;
  uploadedAt: Date;
};

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatusType[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}

export type QuotePagination = {
  items: QuoteListItem[];
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
 * Quote Actions
 */
export type MarkQuoteAsAcceptedData = {
  id: string;
};

export type MarkQuoteAsRejectedData = {
  id: string;
  rejectReason: string;
};

export type MarkQuoteAsOnHoldData = {
  id: string;
  reason?: string;
};

export type MarkQuoteAsCancelledData = {
  id: string;
  reason?: string;
};

export type ConvertQuoteToInvoiceData = {
  id: string;
  dueDate: Date;
  gst?: number;
  discount?: number;
};

/**
 * Statistics
 */
export type QuoteStatistics = {
  total: number;
  draft: number;
  sent: number;
  onHold: number;
  accepted: number;
  rejected: number;
  expired: number;
  cancelled: number;
  converted: number;
  totalQuotedValue: number;
  totalAcceptedValue: number;
  totalConvertedValue: number;
  conversionRate: number;
  avgQuoteValue: number;
};

export type StatsDateFilter = {
  startDate?: Date;
  endDate?: Date;
};

/**
 * Attachment Actions
 */
export type UploadAttachmentData = {
  quoteId: string;
  file: File;
};

export type DeleteAttachmentData = {
  attachmentId: string;
  s3Key: string;
};
