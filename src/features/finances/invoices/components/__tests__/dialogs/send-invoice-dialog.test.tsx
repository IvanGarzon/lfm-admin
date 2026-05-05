// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { SendInvoiceDialog } from '../../dialogs/send-invoice-dialog';
import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/invoices/components/invoice-preview', () => ({
  InvoicePreview: () => <div data-testid='invoice-preview' />
}));

// -- Helpers ----------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof SendInvoiceDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    invoice: createInvoiceMetadata({ invoiceNumber: 'INV-020' }),
    onDownload: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('SendInvoiceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<SendInvoiceDialog {...makeProps()} />);

      expect(screen.getByRole('heading', { name: 'Send Invoice' })).toBeInTheDocument();
    });

    it('renders invoice number in description', () => {
      render(<SendInvoiceDialog {...makeProps()} />);

      expect(screen.getByText(/Preview and send invoice #INV-020/i)).toBeInTheDocument();
    });

    it('renders customer email in footer', () => {
      render(<SendInvoiceDialog {...makeProps()} />);

      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders Download and Send Invoice buttons', () => {
      render(<SendInvoiceDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send invoice/i })).toBeInTheDocument();
    });

    it('renders InvoicePreview', () => {
      render(<SendInvoiceDialog {...makeProps()} />);

      expect(screen.getByTestId('invoice-preview')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<SendInvoiceDialog {...makeProps({ open: false })} />);

      expect(screen.queryByRole('heading', { name: 'Send Invoice' })).not.toBeInTheDocument();
    });
  });

  // -- Loading state ---------------------------------------------------------

  describe('loading state', () => {
    it('shows Downloading... label while download is in progress', async () => {
      let resolveDownload!: () => void;
      const onDownload = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveDownload = resolve;
          })
      );
      render(<SendInvoiceDialog {...makeProps({ onDownload })} />);

      fireEvent.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /downloading\.\.\./i })).toBeInTheDocument();
      });

      resolveDownload();
    });

    it('shows Sending... label while email send is in progress', async () => {
      let resolveSend!: () => void;
      const onSendEmail = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSend = resolve;
          })
      );
      render(<SendInvoiceDialog {...makeProps({ onSendEmail })} />);

      fireEvent.click(screen.getByRole('button', { name: /send invoice/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending\.\.\./i })).toBeInTheDocument();
      });

      resolveSend();
    });
  });

  // -- Interactions ----------------------------------------------------------

  describe('interactions', () => {
    it('calls onDownload when Download button is clicked', async () => {
      const onDownload = vi.fn().mockResolvedValue(undefined);
      render(<SendInvoiceDialog {...makeProps({ onDownload })} />);

      fireEvent.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => {
        expect(onDownload).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSendEmail and closes dialog on successful send', async () => {
      const onOpenChange = vi.fn();
      const onSendEmail = vi.fn().mockResolvedValue(undefined);
      render(<SendInvoiceDialog {...makeProps({ onOpenChange, onSendEmail })} />);

      fireEvent.click(screen.getByRole('button', { name: /send invoice/i }));

      await waitFor(() => {
        expect(onSendEmail).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not close dialog when onSendEmail is not provided', async () => {
      const onOpenChange = vi.fn();
      render(<SendInvoiceDialog {...makeProps({ onOpenChange, onSendEmail: undefined })} />);

      fireEvent.click(screen.getByRole('button', { name: /send invoice/i }));

      await waitFor(() => {
        expect(onOpenChange).not.toHaveBeenCalled();
      });
    });
  });
});
