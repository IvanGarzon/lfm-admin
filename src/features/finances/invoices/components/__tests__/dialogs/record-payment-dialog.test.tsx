// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { RecordPaymentDialog } from '../../dialogs/record-payment-dialog';

// -- Helpers ----------------------------------------------------------------

const INVOICE_ID = 'clxxxxxxxxxxxxxxxxxxxxxxx1';

function makeProps(overrides: Partial<React.ComponentProps<typeof RecordPaymentDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    invoiceId: INVOICE_ID,
    invoiceNumber: 'INV-010',
    amountDue: 500,
    invoiceTotal: 500,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('RecordPaymentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering -------------------------------------------------------------

  describe('rendering', () => {
    it('renders dialog title when open', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByRole('heading', { name: 'Record Payment' })).toBeInTheDocument();
    });

    it('renders invoice number in description', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByText('INV-010')).toBeInTheDocument();
    });

    it('renders Total label in description', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByText('Total:')).toBeInTheDocument();
    });

    it('renders amount, payment date, payment method, and notes fields', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(screen.getByText(/Payment Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Payment Method/i)).toBeInTheDocument();
      expect(screen.getByText(/Notes/i)).toBeInTheDocument();
    });

    it('renders percentage shortcut buttons', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: '25%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '75%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
    });

    it('renders Cancel and Record Payment buttons', () => {
      render(<RecordPaymentDialog {...makeProps()} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
    });

    it('shows balance when amountDue differs from invoiceTotal', () => {
      render(<RecordPaymentDialog {...makeProps({ amountDue: 250, invoiceTotal: 500 })} />);

      expect(screen.getByText('Balance:')).toBeInTheDocument();
    });

    it('does not show balance when amountDue equals invoiceTotal', () => {
      render(<RecordPaymentDialog {...makeProps({ amountDue: 500, invoiceTotal: 500 })} />);

      expect(screen.queryByText('Balance:')).not.toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<RecordPaymentDialog {...makeProps({ open: false })} />);

      expect(screen.queryByRole('heading', { name: 'Record Payment' })).not.toBeInTheDocument();
    });
  });

  // -- Loading state ---------------------------------------------------------

  describe('loading state', () => {
    it('disables both buttons when isPending is true', () => {
      render(<RecordPaymentDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /recording\.\.\./i })).toBeDisabled();
    });

    it('shows Recording... label on submit button when isPending', () => {
      render(<RecordPaymentDialog {...makeProps({ isPending: true })} />);

      expect(screen.getByRole('button', { name: /recording\.\.\./i })).toBeInTheDocument();
    });
  });

  // -- Interactions ----------------------------------------------------------

  describe('interactions', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<RecordPaymentDialog {...makeProps({ onOpenChange })} />);

      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onConfirm with form data on valid submission', async () => {
      const onConfirm = vi.fn();
      render(
        <RecordPaymentDialog {...makeProps({ onConfirm, amountDue: 500, invoiceTotal: 500 })} />
      );

      const form = document.getElementById('record-payment-form');
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: INVOICE_ID }));
      });
    });

    it('sets amount to 50% of amountDue when 50% button is clicked', () => {
      render(<RecordPaymentDialog {...makeProps({ amountDue: 400 })} />);

      fireEvent.click(screen.getByRole('button', { name: '50%' }));

      const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
      expect(Number(amountInput.value)).toBe(200);
    });

    it('sets amount to full amountDue when 100% button is clicked', () => {
      render(<RecordPaymentDialog {...makeProps({ amountDue: 300 })} />);

      fireEvent.click(screen.getByRole('button', { name: '100%' }));

      const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
      expect(Number(amountInput.value)).toBe(300);
    });
  });
});
