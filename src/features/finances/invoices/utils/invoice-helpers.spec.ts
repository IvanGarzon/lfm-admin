import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before any imports that might use it
vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    absoluteUrl: (path: string) => `http://localhost:3000${path}`,
  };
});

vi.mock('@/templates/invoice-template', () => ({
  InvoiceDocument: vi.fn(),
}));

vi.mock('@/templates/receipt-template', () => ({
  ReceiptDocument: vi.fn(),
}));

vi.mock('@/lib/pdf', () => ({
  generatePdfBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

import { 
  generateInvoiceFilename, 
  generateReceiptFilename,
  canTransitionInvoiceStatus,
  getValidNextInvoiceStatuses,
  isTerminalInvoiceStatus,
  validateInvoiceStatusTransition,
  daysUntilDue,
  isOverdue,
  getOverdueDays,
  needsReminder,
  getUrgency,
  calculateContentHash
} from './invoice-helpers';
import { InvoiceStatus } from '@/prisma/client';
import { addDays, subDays } from 'date-fns';
import type { InvoiceListItem, InvoiceWithDetails } from '../types';

describe('invoice-helpers', () => {
  describe('PDF Filename Generation', () => {
    it('generates invoice filename correctly', () => {
      expect(generateInvoiceFilename('INV-2025-0001')).toBe('INV-2025-0001.pdf');
    });

    it('generates receipt filename correctly', () => {
      expect(generateReceiptFilename('RCP-A1B2C3D4')).toBe('RCP-A1B2C3D4.pdf');
    });
  });

  describe('Status Transitions', () => {
    it('allows same status transition', () => {
      expect(canTransitionInvoiceStatus(InvoiceStatus.DRAFT, InvoiceStatus.DRAFT)).toBe(true);
    });

    it('allows valid transition from DRAFT to PENDING', () => {
      expect(canTransitionInvoiceStatus(InvoiceStatus.DRAFT, InvoiceStatus.PENDING)).toBe(true);
    });

    it('disallows invalid transition from PAID to DRAFT', () => {
      expect(canTransitionInvoiceStatus(InvoiceStatus.PAID, InvoiceStatus.DRAFT)).toBe(false);
    });

    it('identifies terminal statuses', () => {
      expect(isTerminalInvoiceStatus(InvoiceStatus.PAID)).toBe(true);
      expect(isTerminalInvoiceStatus(InvoiceStatus.CANCELLED)).toBe(true);
      expect(isTerminalInvoiceStatus(InvoiceStatus.DRAFT)).toBe(false);
    });

    it('gets valid next statuses', () => {
      const next = getValidNextInvoiceStatuses(InvoiceStatus.DRAFT);
      expect(next).toContain(InvoiceStatus.PENDING);
      expect(next).toContain(InvoiceStatus.CANCELLED);
    });

    it('validates transition and throws if invalid', () => {
      expect(() => validateInvoiceStatusTransition(InvoiceStatus.PAID, InvoiceStatus.PENDING))
        .toThrow(/terminal state/);
      
      expect(() => validateInvoiceStatusTransition(InvoiceStatus.DRAFT, InvoiceStatus.PAID))
        .toThrow(/Invalid status transition/);
      
      expect(() => validateInvoiceStatusTransition(InvoiceStatus.DRAFT, InvoiceStatus.PENDING))
        .not.toThrow();
    });
  });

  describe('Due Date & Overdue Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
    });

    it('calculates days until due correctly', () => {
      const dueDate = new Date('2025-01-15T12:00:00Z');
      expect(daysUntilDue(dueDate)).toBe(5);
    });

    it('identifies overdue invoices', () => {
      const pastDue = subDays(new Date(), 1);
      const futureDue = addDays(new Date(), 1);

      const overdueInvoice = { status: InvoiceStatus.PENDING, dueDate: pastDue } as InvoiceListItem;
      const notOverdueInvoice = { status: InvoiceStatus.PENDING, dueDate: futureDue } as InvoiceListItem;
      const paidInvoice = { status: InvoiceStatus.PAID, dueDate: pastDue } as InvoiceListItem;

      expect(isOverdue(overdueInvoice)).toBe(true);
      expect(isOverdue(notOverdueInvoice)).toBe(false);
      expect(isOverdue(paidInvoice)).toBe(false); // Paid never overdue
    });

    it('calculates overdue days correctly', () => {
      const pastDue = subDays(new Date(), 3);
      expect(getOverdueDays(pastDue)).toBe(3);
      
      const futureDue = addDays(new Date(), 1);
      expect(getOverdueDays(futureDue)).toBe(0);
    });

    it('determines if reminder is needed', () => {
      const overdueInvoice = { status: InvoiceStatus.PENDING, dueDate: subDays(new Date(), 1) } as InvoiceListItem;
      const soonDueInvoice = { status: InvoiceStatus.PENDING, dueDate: addDays(new Date(), 2) } as InvoiceListItem;
      const farDueInvoice = { status: InvoiceStatus.PENDING, dueDate: addDays(new Date(), 10) } as InvoiceListItem;

      expect(needsReminder(overdueInvoice)).toBe(true);
      expect(needsReminder(soonDueInvoice)).toBe(true); // default threshold is often 3-7 days
      expect(needsReminder(farDueInvoice)).toBe(false);
    });

    it('gets urgency levels', () => {
      const farDue = { status: InvoiceStatus.PENDING, dueDate: addDays(new Date(), 30) } as InvoiceListItem;
      const mediumDue = { status: InvoiceStatus.PENDING, dueDate: addDays(new Date(), 7) } as InvoiceListItem;
      const highDue = { status: InvoiceStatus.PENDING, dueDate: addDays(new Date(), 2) } as InvoiceListItem;
      const overdue = { status: InvoiceStatus.PENDING, dueDate: subDays(new Date(), 1) } as InvoiceListItem;

      expect(getUrgency(farDue)).toBe('low');
      expect(getUrgency(mediumDue)).toBe('medium');
      expect(getUrgency(highDue)).toBe('high');
      expect(getUrgency(overdue)).toBe('critical');
    });
  });

  describe('calculateContentHash', () => {
    const mockInvoice = {
      invoiceNumber: 'INV-1',
      amount: 100,
      discount: 0,
      gst: 10,
      issuedDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-15'),
      customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 }],
      amountPaid: 0,
      amountDue: 110,
      payments: []
    } as unknown as InvoiceWithDetails;

    it('generates a consistent hash', () => {
      const hash1 = calculateContentHash(mockInvoice);
      const hash2 = calculateContentHash(mockInvoice);
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA-256 hex
    });

    it('generates different hash when data changes', () => {
      const hash1 = calculateContentHash(mockInvoice);
      const modifiedInvoice = { ...mockInvoice, amount: 200 } as unknown as InvoiceWithDetails;
      const hash2 = calculateContentHash(modifiedInvoice);
      expect(hash1).not.toBe(hash2);
    });
  });
});
