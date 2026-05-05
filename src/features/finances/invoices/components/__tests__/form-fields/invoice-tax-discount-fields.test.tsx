// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { InvoiceTaxDiscountFields } from '../../form-fields/invoice-tax-discount-fields';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';

// -- Helpers ----------------------------------------------------------------

function Wrapper({
  isLocked = false,
  defaultGst = 10,
  defaultDiscount = 0
}: {
  isLocked?: boolean;
  defaultGst?: number;
  defaultDiscount?: number;
}) {
  const methods = useForm<InvoiceFormInput>({
    defaultValues: {
      gst: defaultGst,
      discount: defaultDiscount
    } as Partial<InvoiceFormInput> as InvoiceFormInput
  });

  return (
    <FormProvider {...methods}>
      <InvoiceTaxDiscountFields control={methods.control} isLocked={isLocked} />
    </FormProvider>
  );
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceTaxDiscountFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders GST label', () => {
      render(<Wrapper />);

      expect(screen.getByText('GST')).toBeInTheDocument();
    });

    it('renders Discount label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Discount')).toBeInTheDocument();
    });

    it('renders two number inputs', () => {
      render(<Wrapper />);

      const spinbuttons = screen.getAllByRole('spinbutton');
      expect(spinbuttons).toHaveLength(2);
    });
  });

  // -- Initial values -------------------------------------------------------

  describe('initial values', () => {
    it('displays the default GST value', () => {
      render(<Wrapper defaultGst={10} />);

      const gstInput = screen.getByPlaceholderText('Enter GST percentage');
      expect(gstInput).toHaveValue(10);
    });

    it('displays the default discount value', () => {
      render(<Wrapper defaultDiscount={25} />);

      const discountInput = screen.getByPlaceholderText('Enter discount amount');
      expect(discountInput).toHaveValue(25);
    });

    it('renders GST placeholder text', () => {
      render(<Wrapper />);

      expect(screen.getByPlaceholderText('Enter GST percentage')).toBeInTheDocument();
    });

    it('renders discount placeholder text', () => {
      render(<Wrapper />);

      expect(screen.getByPlaceholderText('Enter discount amount')).toBeInTheDocument();
    });
  });

  // -- Locked state ---------------------------------------------------------

  describe('locked state', () => {
    it('disables both inputs when isLocked is true', () => {
      render(<Wrapper isLocked={true} />);

      const spinbuttons = screen.getAllByRole('spinbutton');
      spinbuttons.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it('does not disable inputs when isLocked is false', () => {
      render(<Wrapper isLocked={false} />);

      const spinbuttons = screen.getAllByRole('spinbutton');
      spinbuttons.forEach((input) => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  // -- Input interaction ----------------------------------------------------

  describe('input interaction', () => {
    it('updates GST value on change', () => {
      render(<Wrapper />);

      const gstInput = screen.getByPlaceholderText('Enter GST percentage');
      fireEvent.change(gstInput, { target: { value: '15', valueAsNumber: 15 } });

      expect(gstInput).toHaveValue(15);
    });

    it('updates discount value on change', () => {
      render(<Wrapper />);

      const discountInput = screen.getByPlaceholderText('Enter discount amount');
      fireEvent.change(discountInput, { target: { value: '50', valueAsNumber: 50 } });

      expect(discountInput).toHaveValue(50);
    });
  });
});
