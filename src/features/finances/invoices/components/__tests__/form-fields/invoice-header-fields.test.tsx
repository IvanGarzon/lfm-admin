// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { InvoiceHeaderFields } from '../../form-fields/invoice-header-fields';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';
import type { CustomerSelectItem } from '@/features/crm/customers/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/shared/customer-select', () => ({
  CustomerSelect: ({
    label,
    disabled,
    isLocked
  }: {
    label?: string;
    disabled?: boolean;
    isLocked?: boolean;
  }) => (
    <div
      data-testid='customer-select'
      data-label={label}
      data-disabled={disabled}
      data-locked={isLocked}
    />
  )
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid='calendar' />
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode; className?: string }) => (
    <div>{children}</div>
  )
}));

// -- Helpers ----------------------------------------------------------------

const SAMPLE_CUSTOMER: CustomerSelectItem = {
  id: 'cuid-customer-1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: null,
  organization: null
};

function makeDefaultValues(): Partial<InvoiceFormInput> {
  return {
    customerId: '',
    currency: 'AUD',
    issuedDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    gst: 10,
    discount: 0,
    items: []
  };
}

function Wrapper({
  mode = 'create',
  invoice = null,
  customers = [],
  isLoadingCustomers = false,
  isLocked = false
}: {
  mode?: 'create' | 'update';
  invoice?: Parameters<typeof InvoiceHeaderFields>[0]['invoice'];
  customers?: CustomerSelectItem[];
  isLoadingCustomers?: boolean;
  isLocked?: boolean;
}) {
  const methods = useForm<InvoiceFormInput>({
    defaultValues: makeDefaultValues() as InvoiceFormInput
  });

  return (
    <FormProvider {...methods}>
      <InvoiceHeaderFields
        control={methods.control}
        mode={mode}
        invoice={invoice}
        customers={customers}
        isLoadingCustomers={isLoadingCustomers}
        isLocked={isLocked}
      />
    </FormProvider>
  );
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceHeaderFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- CustomerSelect -------------------------------------------------------

  describe('customer select', () => {
    it('renders CustomerSelect', () => {
      render(<Wrapper />);

      expect(screen.getByTestId('customer-select')).toBeInTheDocument();
    });

    it('renders CustomerSelect with Bill to label', () => {
      render(<Wrapper />);

      expect(screen.getByTestId('customer-select')).toHaveAttribute('data-label', 'Bill to');
    });

    it('disables CustomerSelect when isLoadingCustomers is true', () => {
      render(<Wrapper isLoadingCustomers={true} />);

      expect(screen.getByTestId('customer-select')).toHaveAttribute('data-disabled', 'true');
    });

    it('disables CustomerSelect when isLocked is true', () => {
      render(<Wrapper isLocked={true} />);

      expect(screen.getByTestId('customer-select')).toHaveAttribute('data-locked', 'true');
    });
  });

  // -- Currency field -------------------------------------------------------

  describe('currency field', () => {
    it('renders Currency label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Currency')).toBeInTheDocument();
    });
  });

  // -- Date fields ----------------------------------------------------------

  describe('date fields', () => {
    it('renders Issued Date label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Issued Date')).toBeInTheDocument();
    });

    it('renders Due Date label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });
  });

  // -- Invoice number (update mode) -----------------------------------------

  describe('invoice number in update mode', () => {
    it('renders Invoice Number field when mode is update and invoiceNumber is present', () => {
      render(
        <Wrapper
          mode='update'
          invoice={{
            id: 'inv-1',
            invoiceNumber: 'INV-0042',
            status: 'DRAFT',
            amount: 100,
            gst: 10,
            discount: 0,
            currency: 'AUD',
            issuedDate: new Date('2024-01-01'),
            dueDate: new Date('2024-01-31'),
            amountPaid: 0,
            amountDue: 100,
            customer: {
              id: 'cuid-customer-1',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: null,
              organization: null
            },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }}
        />
      );

      expect(screen.getByLabelText('Invoice Number')).toBeInTheDocument();
      expect(screen.getByDisplayValue('INV-0042')).toBeInTheDocument();
    });

    it('does not render Invoice Number field in create mode', () => {
      render(<Wrapper mode='create' />);

      expect(screen.queryByLabelText('Invoice Number')).not.toBeInTheDocument();
    });

    it('does not render Invoice Number field when update mode has no invoice', () => {
      render(<Wrapper mode='update' invoice={null} />);

      expect(screen.queryByLabelText('Invoice Number')).not.toBeInTheDocument();
    });
  });

  // -- Customers prop -------------------------------------------------------

  describe('with customers list', () => {
    it('renders without crashing when customers array is populated', () => {
      render(<Wrapper customers={[SAMPLE_CUSTOMER]} />);

      expect(screen.getByTestId('customer-select')).toBeInTheDocument();
    });
  });
});
