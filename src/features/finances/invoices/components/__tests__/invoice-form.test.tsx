// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { InvoiceForm } from '../invoice-form';
import type { InvoiceMetadata } from '@/features/finances/invoices/types';
import { createInvoiceMetadata } from '@/lib/testing/factories/invoice.factory';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';

// -- Mocks ------------------------------------------------------------------

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: unknown) => ({ values, errors: {} })
}));

vi.mock('@/features/crm/customers/hooks/use-customer-queries', () => ({
  useActiveCustomers: () => ({ data: [], isLoading: false })
}));

vi.mock('@/features/inventory/products/hooks/use-products-queries', () => ({
  useActiveProducts: () => ({ data: [], isLoading: false })
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: () => undefined
}));

vi.mock('@/hooks/use-form-reset', () => ({
  useFormReset: () => undefined
}));

vi.mock('@/features/finances/invoices/components/invoice-items-list', () => ({
  InvoiceItemsList: () => <div data-testid='invoice-items-list' />
}));

vi.mock('@/features/finances/invoices/components/form-fields/invoice-header-fields', () => ({
  InvoiceHeaderFields: ({
    mode,
    invoice
  }: {
    mode: string;
    invoice?: InvoiceMetadata | null;
    customers: unknown[];
    isLoadingCustomers: boolean;
    isLocked: boolean;
    control: unknown;
  }) => (
    <div data-testid='invoice-header-fields' data-mode={mode} data-invoice-id={invoice?.id ?? ''} />
  )
}));

vi.mock('@/features/finances/invoices/components/form-fields/invoice-tax-discount-fields', () => ({
  InvoiceTaxDiscountFields: () => <div data-testid='invoice-tax-discount-fields' />
}));

vi.mock('@/features/finances/invoices/components/form-fields/invoice-notes-field', () => ({
  InvoiceNotesField: () => <div data-testid='invoice-notes-field' />
}));

vi.mock('@/features/finances/invoices/components/form-fields/invoice-total-summary', () => ({
  InvoiceTotalSummary: ({
    subtotal,
    total
  }: {
    subtotal: number;
    gst: number;
    gstAmount: number;
    discount: number;
    total: number;
  }) => <div data-testid='invoice-total-summary' data-subtotal={subtotal} data-total={total} />
}));

// -- Helpers ----------------------------------------------------------------

// -- Tests ------------------------------------------------------------------

describe('InvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Create mode ----------------------------------------------------------

  describe('create mode', () => {
    it('renders the form element', () => {
      render(<InvoiceForm />);

      expect(document.getElementById('form-rhf-invoice')).toBeInTheDocument();
    });

    it('renders header fields in create mode', () => {
      render(<InvoiceForm />);

      expect(screen.getByTestId('invoice-header-fields')).toHaveAttribute('data-mode', 'create');
    });

    it('renders items list', () => {
      render(<InvoiceForm />);

      expect(screen.getByTestId('invoice-items-list')).toBeInTheDocument();
    });

    it('renders tax and discount fields', () => {
      render(<InvoiceForm />);

      expect(screen.getByTestId('invoice-tax-discount-fields')).toBeInTheDocument();
    });

    it('renders notes field', () => {
      render(<InvoiceForm />);

      expect(screen.getByTestId('invoice-notes-field')).toBeInTheDocument();
    });

    it('renders the total summary', () => {
      render(<InvoiceForm />);

      expect(screen.getByTestId('invoice-total-summary')).toBeInTheDocument();
    });

    it('does not show the locked banner', () => {
      render(<InvoiceForm />);

      expect(screen.queryByText(/cannot be edited/i)).not.toBeInTheDocument();
    });

    it('does not show the creating/updating banner when idle', () => {
      render(<InvoiceForm isCreating={false} isUpdating={false} />);

      expect(screen.queryByText(/creating invoice/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/updating invoice/i)).not.toBeInTheDocument();
    });

    it('shows the creating banner when isCreating is true', () => {
      render(<InvoiceForm isCreating={true} />);

      expect(screen.getByText(/creating invoice/i)).toBeInTheDocument();
    });

    it('calls onCreate when the form is submitted', async () => {
      const onCreate = vi.fn();

      render(<InvoiceForm onCreate={onCreate} />);

      fireEvent.submit(document.getElementById('form-rhf-invoice')!);

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledTimes(1);
      });
    });

    it('passes CreateInvoiceInput shape to onCreate', async () => {
      const onCreate = vi.fn();

      render(<InvoiceForm onCreate={onCreate} />);

      fireEvent.submit(document.getElementById('form-rhf-invoice')!);

      await waitFor(() => {
        const [arg] = onCreate.mock.calls[0] as [CreateInvoiceInput];
        expect(arg).toHaveProperty('customerId');
        expect(arg).toHaveProperty('status', 'DRAFT');
        expect(arg).toHaveProperty('currency', 'AUD');
        expect(arg).toHaveProperty('items');
      });
    });
  });

  // -- Edit mode ------------------------------------------------------------

  describe('edit mode', () => {
    it('renders header fields in update mode', () => {
      const invoice = createInvoiceMetadata();

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByTestId('invoice-header-fields')).toHaveAttribute('data-mode', 'update');
    });

    it('passes invoice id to header fields', () => {
      const invoice = createInvoiceMetadata({ id: 'inv-XYZ' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByTestId('invoice-header-fields')).toHaveAttribute(
        'data-invoice-id',
        'inv-XYZ'
      );
    });

    it('shows the updating banner when isUpdating is true', () => {
      const invoice = createInvoiceMetadata();

      render(<InvoiceForm invoice={invoice} isUpdating={true} />);

      expect(screen.getByText(/updating invoice/i)).toBeInTheDocument();
    });

    it('calls onUpdate when the form is submitted', async () => {
      const onUpdate = vi.fn();
      const invoice = createInvoiceMetadata({ status: 'DRAFT' });

      render(<InvoiceForm invoice={invoice} onUpdate={onUpdate} />);

      fireEvent.submit(document.getElementById('form-rhf-invoice')!);

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it('passes UpdateInvoiceInput shape with invoice id to onUpdate', async () => {
      const onUpdate = vi.fn();
      const invoice = createInvoiceMetadata({ id: 'inv-001', status: 'DRAFT' });

      render(<InvoiceForm invoice={invoice} onUpdate={onUpdate} />);

      fireEvent.submit(document.getElementById('form-rhf-invoice')!);

      await waitFor(() => {
        const [arg] = onUpdate.mock.calls[0] as [UpdateInvoiceInput];
        expect(arg).toHaveProperty('id', 'inv-001');
      });
    });
  });

  // -- Locked state ---------------------------------------------------------

  describe('locked state', () => {
    it('shows locked banner for PAID invoices', () => {
      const invoice = createInvoiceMetadata({ status: 'PAID' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
    });

    it('shows locked banner for CANCELLED invoices', () => {
      const invoice = createInvoiceMetadata({ status: 'CANCELLED' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
    });

    it('shows locked banner for PENDING invoices', () => {
      const invoice = createInvoiceMetadata({ status: 'PENDING' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
    });

    it('shows locked banner for OVERDUE invoices', () => {
      const invoice = createInvoiceMetadata({ status: 'OVERDUE' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
    });

    it('does not show locked banner for DRAFT invoices', () => {
      const invoice = createInvoiceMetadata({ status: 'DRAFT' });

      render(<InvoiceForm invoice={invoice} />);

      expect(screen.queryByText(/cannot be edited/i)).not.toBeInTheDocument();
    });

    it('does not call onUpdate when locked and form is submitted', async () => {
      const onUpdate = vi.fn();
      const invoice = createInvoiceMetadata({ status: 'PAID' });

      render(<InvoiceForm invoice={invoice} onUpdate={onUpdate} />);

      fireEvent.submit(document.getElementById('form-rhf-invoice')!);

      await waitFor(() => {
        expect(onUpdate).not.toHaveBeenCalled();
      });
    });
  });

  // -- Loading items --------------------------------------------------------

  describe('loading items', () => {
    it('shows a loading spinner instead of items list when isLoadingItems is true', () => {
      render(<InvoiceForm isLoadingItems={true} />);

      expect(screen.getByText(/loading invoice items/i)).toBeInTheDocument();
      expect(screen.queryByTestId('invoice-items-list')).not.toBeInTheDocument();
    });

    it('renders items list when isLoadingItems is false', () => {
      render(<InvoiceForm isLoadingItems={false} />);

      expect(screen.getByTestId('invoice-items-list')).toBeInTheDocument();
    });
  });
});
