import { describe, it, expect } from 'vitest';
import {
  InvoiceItemSchema,
  InvoiceSchema,
  RecordPaymentSchema,
  CancelInvoiceSchema,
  InvoiceFiltersSchema,
  UpdateInvoiceSchema,
  MarkInvoiceAsPendingSchema,
  SendInvoiceEmailSchema,
  SendReminderEmailSchema,
  SendReceiptEmailSchema,
} from './invoices';
import { testIds } from '@/lib/testing';

const TEST_INVOICE_ID = testIds.invoice();
const TEST_PRODUCT_ID = testIds.product();
const TEST_CUSTOMER_ID = testIds.customer();

describe('Invoice Schemas', () => {
  describe('InvoiceItemSchema', () => {
    it('validates a correct invoice item', () => {
      const validItem = {
        description: 'Web Development',
        quantity: 1,
        unitPrice: 100,
        productId: TEST_PRODUCT_ID,
      };

      const result = InvoiceItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('fails when description is missing', () => {
      const invalidItem = {
        quantity: 1,
        unitPrice: 100,
      };

      const result = InvoiceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('fails when quantity is non-positive', () => {
      const invalidItem = {
        description: 'Test',
        quantity: 0,
        unitPrice: 100,
      };

      const result = InvoiceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateInvoiceSchema', () => {
    const validInvoice = {
      customerId: TEST_CUSTOMER_ID,
      status: 'DRAFT',
      issuedDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      currency: 'AUD',
      gst: 10,
      discount: 0,
      items: [
        {
          description: 'Item 1',
          quantity: 1,
          unitPrice: 100,
          productId: null,
        },
      ],
    };

    it('validates a correct invoice', () => {
      const result = InvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('fails when due date is before issued date', () => {
      const invalidInvoice = {
        ...validInvoice,
        dueDate: new Date('2023-12-31'),
      };

      const result = InvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Due date must be on or after issued date');
      }
    });

    it('fails when no items are provided', () => {
      const invalidInvoice = {
        ...validInvoice,
        items: [],
      };

      const result = InvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateInvoiceSchema', () => {
    const validUpdate = {
      customerId: TEST_CUSTOMER_ID,
      status: 'DRAFT',
      issuedDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      currency: 'AUD',
      gst: 10,
      discount: 0,
      items: [
        {
          description: 'Item 1',
          quantity: 1,
          unitPrice: 100,
          productId: null,
        },
      ],
      id: TEST_INVOICE_ID,
    };

    it('validates a correct update payload', () => {
      const result = UpdateInvoiceSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const invalidUpdate = { ...validUpdate };
      delete (invalidUpdate as any).id;

      const result = UpdateInvoiceSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('fails when due date is before issued date', () => {
      const invalidUpdate = {
        ...validUpdate,
        dueDate: new Date('2023-12-31'),
      };

      const result = UpdateInvoiceSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('RecordPaymentSchema', () => {
    it('validates correct payment data', () => {
      const validPayment = {
        id: TEST_INVOICE_ID,
        amount: 50,
        paidDate: new Date(),
        paymentMethod: 'Credit Card',
      };

      const result = RecordPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('fails on invalid amount', () => {
      const invalidPayment = {
        id: TEST_INVOICE_ID,
        amount: -10,
        paidDate: new Date(),
        paymentMethod: 'Cash',
      };

      const result = RecordPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });

  describe('MarkInvoiceAsPendingSchema', () => {
    it('validates correct ID', () => {
      const validPending = {
        id: TEST_INVOICE_ID,
      };

      const result = MarkInvoiceAsPendingSchema.safeParse(validPending);
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const invalidPending = {};

      const result = MarkInvoiceAsPendingSchema.safeParse(invalidPending);
      expect(result.success).toBe(false);
    });
  });

  describe('CancelInvoiceSchema', () => {
    it('validates correct cancellation data', () => {
      const validCancel = {
        id: TEST_INVOICE_ID,
        cancelledDate: new Date(),
        cancelReason: 'Customer changed mind',
      };

      const result = CancelInvoiceSchema.safeParse(validCancel);
      expect(result.success).toBe(true);
    });
  });

  describe('InvoiceFiltersSchema', () => {
    it('transforms status string to array of parsed statuses', () => {
      const filters = {
        status: 'PENDING,PAID',
      };

      const result = InvoiceFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.status).toEqual(['PENDING', 'PAID']);
      }
    });

    it('handles empty status string', () => {
      const filters = {
        status: '',
      };

      const result = InvoiceFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.status).toBeUndefined();
      }
    });
  });

  describe('SendInvoiceEmailSchema', () => {
    const validEmail = {
      invoiceId: TEST_INVOICE_ID,
      to: 'test@example.com',
      invoiceData: {
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        amount: 100,
        currency: 'AUD',
        dueDate: new Date('2024-01-15'),
        issuedDate: new Date('2024-01-01'),
      },
      pdfUrl: 'https://example.com/invoice.pdf',
    };

    it('validates correct email data', () => {
      const result = SendInvoiceEmailSchema.safeParse(validEmail);
      expect(result.success).toBe(true);
    });

    it('fails on invalid email', () => {
      const invalidEmail = {
        ...validEmail,
        to: 'invalid-email',
      };

      const result = SendInvoiceEmailSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('fails on missing invoice data', () => {
      const invalidEmail = {
        ...validEmail,
        invoiceData: {},
      };

      const result = SendInvoiceEmailSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('SendReminderEmailSchema', () => {
    const validReminder = {
      invoiceId: TEST_INVOICE_ID,
      to: 'test@example.com',
      reminderData: {
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        amount: 100,
        currency: 'AUD',
        dueDate: new Date('2024-01-15'),
        daysOverdue: 5,
        amountPaid: 0,
        amountDue: 100,
      },
      pdfUrl: 'https://example.com/invoice.pdf',
    };

    it('validates correct reminder data', () => {
      const result = SendReminderEmailSchema.safeParse(validReminder);
      expect(result.success).toBe(true);
    });

    it('fails when days overdue is negative', () => {
      const invalidReminder = {
        ...validReminder,
        reminderData: {
          ...validReminder.reminderData,
          daysOverdue: -1,
        },
      };

      const result = SendReminderEmailSchema.safeParse(invalidReminder);
      expect(result.success).toBe(false);
    });
  });

  describe('SendReceiptEmailSchema', () => {
    const validReceipt = {
      invoiceId: TEST_INVOICE_ID,
      to: 'test@example.com',
      receiptData: {
        invoiceNumber: 'INV-001',
        receiptNumber: 'REC-001',
        customerName: 'Test Customer',
        amount: 100,
        currency: 'AUD',
        paidDate: new Date('2024-01-20'),
        paymentMethod: 'Credit Card',
      },
      pdfUrl: 'https://example.com/receipt.pdf',
    };

    it('validates correct receipt data', () => {
      const result = SendReceiptEmailSchema.safeParse(validReceipt);
      expect(result.success).toBe(true);
    });

    it('fails when amount is non-positive', () => {
      const invalidReceipt = {
        ...validReceipt,
        receiptData: {
          ...validReceipt.receiptData,
          amount: 0,
        },
      };

      const result = SendReceiptEmailSchema.safeParse(invalidReceipt);
      expect(result.success).toBe(false);
    });
  });
});
