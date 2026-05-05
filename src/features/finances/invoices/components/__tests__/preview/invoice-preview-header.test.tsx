// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoicePreviewHeader } from '../../preview/invoice-preview-header';

// -- Mocks ------------------------------------------------------------------

const mockUseTenantBranding = vi.fn();

vi.mock('@/components/providers/TenantBrandingProvider', () => ({
  useTenantBranding: () => mockUseTenantBranding()
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  )
}));

// -- Helpers ----------------------------------------------------------------

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

describe('InvoicePreviewHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenantBranding.mockReturnValue(makeBranding());
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders Invoice heading', () => {
      render(<InvoicePreviewHeader invoiceNumber='INV-001' />);

      expect(screen.getByRole('heading', { name: 'Invoice' })).toBeInTheDocument();
    });

    it('renders invoice number with hash prefix', () => {
      render(<InvoicePreviewHeader invoiceNumber='INV-042' />);

      expect(screen.getByText('Invoice Number #INV-042')).toBeInTheDocument();
    });

    it('renders a different invoice number correctly', () => {
      render(<InvoicePreviewHeader invoiceNumber='2025-0099' />);

      expect(screen.getByText('Invoice Number #2025-0099')).toBeInTheDocument();
    });
  });

  // -- Logo -----------------------------------------------------------------

  describe('logo', () => {
    it('uses branding name as image alt text', () => {
      mockUseTenantBranding.mockReturnValue(makeBranding({ name: 'Acme Studio' }));

      render(<InvoicePreviewHeader invoiceNumber='INV-001' />);

      expect(screen.getByAltText('Acme Studio')).toBeInTheDocument();
    });

    it('falls back to "Logo" alt text when branding is null', () => {
      mockUseTenantBranding.mockReturnValue(null);

      render(<InvoicePreviewHeader invoiceNumber='INV-001' />);

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('renders the static logo image src', () => {
      render(<InvoicePreviewHeader invoiceNumber='INV-001' />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/static/logo-green-800.png');
    });
  });
});
