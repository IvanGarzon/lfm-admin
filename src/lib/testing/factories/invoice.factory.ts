/**
 * Invoice Factory
 *
 * Creates mock invoice objects and related data for testing.
 * Uses existing types from schemas and features.
 */

import { testIds } from '../id-generator';
import type { InvoiceStatus } from '@/prisma/client';
import type {
  CreateInvoiceInput,
  RecordPaymentInput,
  CancelInvoiceInput,
} from '@/schemas/invoices';

// Derive item type from schema
type InvoiceItemInput = CreateInvoiceInput['items'][number];

// Response types for repository returns (minimal, flexible)
interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  status?: InvoiceStatus;
  amount?: number;
  receiptNumber?: string | null;
}

interface InvoiceWithCustomer extends InvoiceResponse {
  currency: string;
  dueDate: Date;
  issuedDate: Date;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Creates valid invoice input data for create/update mutations.
 */
export function createInvoiceInput(
  overrides: Partial<CreateInvoiceInput> = {},
): CreateInvoiceInput {
  return {
    customerId: overrides.customerId ?? testIds.customer(),
    status: 'DRAFT',
    issuedDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: 'AUD',
    gst: 10,
    discount: 0,
    items: [createInvoiceItemInput()],
    ...overrides,
  };
}

/**
 * Creates an invoice item input.
 */
export function createInvoiceItemInput(
  overrides: Partial<InvoiceItemInput> = {},
): InvoiceItemInput {
  return {
    description: 'Test Item',
    quantity: 1,
    unitPrice: 100,
    productId: null,
    ...overrides,
  };
}

/**
 * Creates a mock invoice response as returned by the repository.
 */
export function createInvoiceResponse(overrides: Partial<InvoiceResponse> = {}): InvoiceResponse {
  return {
    id: overrides.id ?? testIds.invoice(),
    invoiceNumber: overrides.invoiceNumber ?? 'INV-2024-0001',
    ...overrides,
  };
}

/**
 * Creates a mock invoice with customer data (for markAsPending, etc.).
 */
export function createInvoiceWithCustomer(
  overrides: Partial<InvoiceWithCustomer> = {},
): InvoiceWithCustomer {
  const customerId = overrides.customer?.id ?? testIds.customer();
  return {
    id: overrides.id ?? testIds.invoice(),
    invoiceNumber: overrides.invoiceNumber ?? 'INV-2024-0001',
    status: overrides.status ?? 'PENDING',
    amount: overrides.amount ?? 100,
    currency: overrides.currency ?? 'AUD',
    dueDate: overrides.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    issuedDate: overrides.issuedDate ?? new Date(),
    customer: {
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      ...overrides.customer,
    },
    ...overrides,
  };
}

/**
 * Creates record payment input data.
 */
export function createRecordPaymentInput(
  overrides: Partial<RecordPaymentInput> = {},
): RecordPaymentInput {
  return {
    id: overrides.id ?? testIds.invoice(),
    amount: 50,
    paidDate: new Date(),
    paymentMethod: 'Credit Card',
    ...overrides,
  };
}

/**
 * Creates cancel invoice input data.
 */
export function createCancelInvoiceInput(
  overrides: Partial<CancelInvoiceInput> = {},
): CancelInvoiceInput {
  return {
    id: overrides.id ?? testIds.invoice(),
    cancelledDate: new Date(),
    cancelReason: 'Customer request',
    ...overrides,
  };
}

/**
 * Creates mock invoice statistics.
 */
export function createInvoiceStatistics(overrides: Partial<Record<string, number>> = {}) {
  return {
    total: 100,
    draft: 15,
    pending: 25,
    paid: 40,
    partiallyPaid: 10,
    overdue: 8,
    cancelled: 2,
    totalAmount: 50000,
    paidAmount: 30000,
    overdueAmount: 8000,
    ...overrides,
  };
}

/**
 * Pre-built invoice factories for common test scenarios.
 */
export const mockInvoices = {
  /**
   * Creates a draft invoice input.
   */
  draftInput: (customerId?: string) => createInvoiceInput({ customerId, status: 'DRAFT' }),

  /**
   * Creates a pending invoice input.
   */
  pendingInput: (customerId?: string) => createInvoiceInput({ customerId, status: 'PENDING' }),

  /**
   * Creates an invoice response.
   */
  response: (id?: string, invoiceNumber?: string) => createInvoiceResponse({ id, invoiceNumber }),

  /**
   * Creates an invoice with customer data.
   */
  withCustomer: (id?: string, status?: InvoiceStatus) => createInvoiceWithCustomer({ id, status }),

  /**
   * Creates a paid invoice response.
   */
  paidResponse: (id?: string) =>
    createInvoiceResponse({
      id,
      status: 'PAID',
      receiptNumber: 'REC-2024-0001',
    }),
} as const;
