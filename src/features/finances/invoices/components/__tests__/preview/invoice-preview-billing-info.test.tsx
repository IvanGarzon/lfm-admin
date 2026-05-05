// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreviewBillingInfo } from '../../preview/invoice-preview-billing-info';

// -- Mocks ------------------------------------------------------------------

const mockUseTenantBranding = vi.fn();

vi.mock('@/components/providers/TenantBrandingProvider', () => ({
  useTenantBranding: () => mockUseTenantBranding()
}));

vi.mock('date-fns', () => ({
  format: (_date: Date, _fmt: string) => 'January 15, 2025'
}));

// -- Helpers ----------------------------------------------------------------

import type { InvoiceMetadata } from '@/features/finances/invoices/types';
import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';

function makeInvoice(overrides: Partial<InvoiceMetadata['customer']> = {}): InvoiceMetadata {
  return createInvoiceMetadata({
    customer: {
      id: 'cust-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: null,
      organization: null,
      ...overrides
    }
  });
}

function makeBranding(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Las Flores Melbourne',
    accountName: null,
    phone: null,
    email: null,
    abn: null,
    logoUrl: null,
    website: null,
    bankName: null,
    bsb: null,
    accountNumber: null,
    address: null,
    city: null,
    state: null,
    postcode: null,
    country: null,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('InvoicePreviewBillingInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenantBranding.mockReturnValue(makeBranding());
  });

  // -- Billed by ------------------------------------------------------------

  describe('billed by', () => {
    it('renders accountName when present', () => {
      mockUseTenantBranding.mockReturnValue(
        makeBranding({ accountName: 'LFM Pty Ltd', name: 'Las Flores' })
      );

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('LFM Pty Ltd')).toBeInTheDocument();
    });

    it('falls back to name when accountName is null', () => {
      mockUseTenantBranding.mockReturnValue(
        makeBranding({ accountName: null, name: 'Las Flores Melbourne' })
      );

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('Las Flores Melbourne')).toBeInTheDocument();
    });

    it('renders phone when present', () => {
      mockUseTenantBranding.mockReturnValue(makeBranding({ phone: '+61 3 9000 0000' }));

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('+61 3 9000 0000')).toBeInTheDocument();
    });

    it('does not render phone when absent', () => {
      mockUseTenantBranding.mockReturnValue(makeBranding({ phone: null }));

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.queryByText(/\+61/)).not.toBeInTheDocument();
    });

    it('renders email when present', () => {
      mockUseTenantBranding.mockReturnValue(makeBranding({ email: 'hello@lasflores.com.au' }));

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('hello@lasflores.com.au')).toBeInTheDocument();
    });

    it('renders ABN with prefix when present', () => {
      mockUseTenantBranding.mockReturnValue(makeBranding({ abn: '12 345 678 901' }));

      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('AU ABN 12 345 678 901')).toBeInTheDocument();
    });

    it('does not render ABN when absent', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.queryByText(/AU ABN/)).not.toBeInTheDocument();
    });
  });

  // -- Billed to ------------------------------------------------------------

  describe('billed to', () => {
    it('renders customer full name', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders customer email', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });

    it('renders customer phone when present', () => {
      render(
        <InvoicePreviewBillingInfo
          invoice={makeInvoice({ phone: '+61 412 000 000' } as Parameters<typeof makeInvoice>[0])}
        />
      );

      expect(screen.getByText('+61 412 000 000')).toBeInTheDocument();
    });

    it('renders organisation name when present', () => {
      render(
        <InvoicePreviewBillingInfo
          invoice={makeInvoice({
            organization: { id: 'org-1', name: 'Acme Corp' }
          } as Parameters<typeof makeInvoice>[0])}
        />
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('does not render organisation when absent', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    });
  });

  // -- Dates ----------------------------------------------------------------

  describe('dates', () => {
    it('renders Date Issued label', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('Date Issued:')).toBeInTheDocument();
    });

    it('renders Due Date label', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      expect(screen.getByText('Due Date:')).toBeInTheDocument();
    });

    it('renders formatted dates', () => {
      render(<InvoicePreviewBillingInfo invoice={makeInvoice()} />);

      const dateCells = screen.getAllByText('January 15, 2025');
      expect(dateCells).toHaveLength(2);
    });
  });
});
