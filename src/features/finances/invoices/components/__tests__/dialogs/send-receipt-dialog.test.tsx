// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { SendReceiptDialog } from '../../dialogs/send-receipt-dialog';
import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/invoices/components/receipt-preview', () => ({
  ReceiptPreview: () => <div data-testid='receipt-preview' />
}));

// -- Helpers ----------------------------------------------------------------

function makeProps(overrides: Partial<React.ComponentProps<typeof SendReceiptDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    invoice: createInvoiceMetadata({
      invoiceNumber: 'INV-030',
      status: 'PAID',
      customer: {
        id: 'cust-2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        organization: null
      }
    }),
    onDownload: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('SendReceiptDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<SendReceiptDialog {...makeProps()} />);

      expect(screen.getByText('Payment Receipt')).toBeInTheDocument();
    });

    it('renders invoice number in description', () => {
      render(<SendReceiptDialog {...makeProps()} />);

      expect(
        screen.getByText(/Receipt for invoice #INV-030 - Payment received/i)
      ).toBeInTheDocument();
    });

    it('renders customer email in footer', () => {
      render(<SendReceiptDialog {...makeProps()} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders Download and Send Receipt buttons', () => {
      render(<SendReceiptDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send receipt/i })).toBeInTheDocument();
    });

    it('renders ReceiptPreview', () => {
      render(<SendReceiptDialog {...makeProps()} />);

      expect(screen.getByTestId('receipt-preview')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<SendReceiptDialog {...makeProps({ open: false })} />);

      expect(screen.queryByText('Payment Receipt')).not.toBeInTheDocument();
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
      render(<SendReceiptDialog {...makeProps({ onDownload })} />);

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
      render(<SendReceiptDialog {...makeProps({ onSendEmail })} />);

      fireEvent.click(screen.getByRole('button', { name: /send receipt/i }));

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
      render(<SendReceiptDialog {...makeProps({ onDownload })} />);

      fireEvent.click(screen.getByRole('button', { name: /download/i }));

      await waitFor(() => {
        expect(onDownload).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSendEmail and closes dialog on successful send', async () => {
      const onOpenChange = vi.fn();
      const onSendEmail = vi.fn().mockResolvedValue(undefined);
      render(<SendReceiptDialog {...makeProps({ onOpenChange, onSendEmail })} />);

      fireEvent.click(screen.getByRole('button', { name: /send receipt/i }));

      await waitFor(() => {
        expect(onSendEmail).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('does not close dialog when onSendEmail is not provided', async () => {
      const onOpenChange = vi.fn();
      render(<SendReceiptDialog {...makeProps({ onOpenChange, onSendEmail: undefined })} />);

      fireEvent.click(screen.getByRole('button', { name: /send receipt/i }));

      await waitFor(() => {
        expect(onOpenChange).not.toHaveBeenCalled();
      });
    });
  });
});
