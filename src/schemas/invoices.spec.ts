import { describe, it, expect, vi } from 'vitest';
import {
  InvoiceItemSchema,
  InvoiceSchema,
  RecordPaymentSchema,
  CancelInvoiceSchema,
  InvoiceFiltersSchema,
} from './invoices';

describe('Invoice Schemas', () => {
  describe('InvoiceItemSchema', () => {
    it('validates a correct invoice item', () => {
      const validItem = {
        description: 'Web Development',
        quantity: 1,
        unitPrice: 100,
        productId: 'prod_123',
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

  describe('InvoiceSchema', () => {
    const validInvoice = {
      customerId: 'cust_123',
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

  describe('RecordPaymentSchema', () => {
    it('validates correct payment data', () => {
      const validPayment = {
        id: 'clv123456000008l28z3z4x5c', // valid cuid
        amount: 50,
        paidDate: new Date(),
        paymentMethod: 'Credit Card',
      };
      const result = RecordPaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('fails on invalid amount', () => {
      const invalidPayment = {
        id: 'clv123456000008l28z3z4x5c',
        amount: -10,
        paidDate: new Date(),
        paymentMethod: 'Cash',
      };
      const result = RecordPaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });

  describe('CancelInvoiceSchema', () => {
    it('validates correct cancellation data', () => {
      const validCancel = {
        id: 'clv123456000008l28z3z4x5c',
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
});
