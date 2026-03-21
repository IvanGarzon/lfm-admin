import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
import type { QuoteStatus as QuoteStatusType } from '@/zod/schemas/enums/QuoteStatus.schema';
import type { PaginationMeta } from '@/types/pagination';

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
  versionNumber: number;
  parentQuoteId: string | null;
  isFavourite: boolean;
};

export type QuoteStatusHistoryItem = {
  id: string;
  status: QuoteStatusType;
  previousStatus: QuoteStatusType | null;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
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
  versionsCount: number;
  isFavourite: boolean;
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
  _count?: {
    statusHistory: number;
  };
};

/**
 * Lightweight quote metadata without items.
 * Used for headers, actions, and navigation where full item details aren't needed.
 * Reduces data transfer when viewing non-detail tabs (versions, history).
 */
export type QuoteMetadata = Omit<QuoteWithDetails, 'items'>;

/**
 * Quote item with all details including attachments.
 * Fetched separately from quote metadata for better performance.
 */
export type QuoteItem = QuoteWithDetails['items'][number];

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
  pagination: PaginationMeta;
};

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

export type QuoteValueTrend = {
  month: string;
  total: number;
  accepted: number;
  converted: number;
};

export type TopCustomerByQuotedValue = {
  customerId: string;
  customerName: string;
  totalQuotedValue: number;
  acceptedValue: number;
  quoteCount: number;
  conversionRate: number;
};

export type ConversionFunnelData = {
  sent: number;
  onHold: number;
  accepted: number;
  rejected: number;
  expired: number;
  converted: number;
  sentValue: number;
  acceptedValue: number;
  convertedValue: number;
};

export type AverageTimeToDecision = {
  avgDaysToAccept: number;
  avgDaysToReject: number;
  avgDaysToDecision: number; // Combined average for accept/reject
};

export type UploadAttachmentData = {
  quoteId: string;
  file: File;
};

export type DeleteAttachmentData = {
  attachmentId: string;
  s3Key: string;
};
