// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { InvoicePaymentFields } from '../../form-fields/invoice-payment-fields';
import type { RecordPaymentInput } from '@/schemas/invoices';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid='calendar' />
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({
    children,
    className,
    align
  }: {
    children: React.ReactNode;
    className?: string;
    align?: string;
  }) => <div data-align={align}>{children}</div>
}));

// -- Helpers ----------------------------------------------------------------

function makeDefaultValues(): Partial<RecordPaymentInput> {
  return {
    id: 'cuid-invoice-1',
    amount: 0,
    paidDate: new Date('2024-06-01'),
    paymentMethod: '',
    notes: ''
  };
}

function Wrapper({
  showPercentageButtons = false,
  onPercentageClick
}: {
  showPercentageButtons?: boolean;
  onPercentageClick?: (pct: number) => void;
}) {
  const methods = useForm<RecordPaymentInput>({
    defaultValues: makeDefaultValues() as RecordPaymentInput
  });

  return (
    <FormProvider {...methods}>
      <InvoicePaymentFields
        control={methods.control}
        showPercentageButtons={showPercentageButtons}
        onPercentageClick={onPercentageClick}
      />
    </FormProvider>
  );
}

// -- Tests ------------------------------------------------------------------

describe('InvoicePaymentFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders Amount label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('renders amount input with number type', () => {
      render(<Wrapper />);

      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('renders Payment Date label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Payment Date')).toBeInTheDocument();
    });

    it('renders Payment Method label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });

    it('renders Notes (Optional) label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Notes (Optional)')).toBeInTheDocument();
    });

    it('renders the notes textarea', () => {
      render(<Wrapper />);

      expect(
        screen.getByPlaceholderText('Additional notes about this payment...')
      ).toBeInTheDocument();
    });
  });

  // -- Percentage buttons ---------------------------------------------------

  describe('percentage buttons', () => {
    it('does not render percentage buttons by default', () => {
      render(<Wrapper />);

      expect(screen.queryByRole('button', { name: '25%' })).not.toBeInTheDocument();
    });

    it('does not render percentage buttons when showPercentageButtons is false', () => {
      render(<Wrapper showPercentageButtons={false} />);

      expect(screen.queryByRole('button', { name: '50%' })).not.toBeInTheDocument();
    });

    it('renders 25%, 50%, 75%, 100% buttons when showPercentageButtons is true', () => {
      const onPercentageClick = vi.fn();
      render(<Wrapper showPercentageButtons={true} onPercentageClick={onPercentageClick} />);

      expect(screen.getByRole('button', { name: '25%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '75%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
    });

    it('calls onPercentageClick with correct percentage when a button is clicked', () => {
      const onPercentageClick = vi.fn();
      render(<Wrapper showPercentageButtons={true} onPercentageClick={onPercentageClick} />);

      fireEvent.click(screen.getByRole('button', { name: '50%' }));

      expect(onPercentageClick).toHaveBeenCalledWith(50);
    });

    it('calls onPercentageClick with 100 when 100% button is clicked', () => {
      const onPercentageClick = vi.fn();
      render(<Wrapper showPercentageButtons={true} onPercentageClick={onPercentageClick} />);

      fireEvent.click(screen.getByRole('button', { name: '100%' }));

      expect(onPercentageClick).toHaveBeenCalledWith(100);
    });

    it('does not render percentage buttons when showPercentageButtons is true but onPercentageClick is not provided', () => {
      render(<Wrapper showPercentageButtons={true} />);

      expect(screen.queryByRole('button', { name: '25%' })).not.toBeInTheDocument();
    });
  });

  // -- Amount input ---------------------------------------------------------

  describe('amount input', () => {
    it('renders amount input with placeholder 0.00', () => {
      render(<Wrapper />);

      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('updates amount on change', () => {
      render(<Wrapper />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '150.50' } });

      expect(input).toHaveValue(150.5);
    });
  });
});
