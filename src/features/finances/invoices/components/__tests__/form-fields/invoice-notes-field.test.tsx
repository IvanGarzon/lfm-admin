// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { InvoiceNotesField } from '../../form-fields/invoice-notes-field';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';

// -- Helpers ----------------------------------------------------------------

function Wrapper({
  isLocked = false,
  defaultNotes = ''
}: {
  isLocked?: boolean;
  defaultNotes?: string;
}) {
  const methods = useForm<InvoiceFormInput>({
    defaultValues: {
      notes: defaultNotes
    } as Partial<InvoiceFormInput> as InvoiceFormInput
  });

  return (
    <FormProvider {...methods}>
      <InvoiceNotesField control={methods.control} isLocked={isLocked} />
    </FormProvider>
  );
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceNotesField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders Notes label', () => {
      render(<Wrapper />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('renders the textarea', () => {
      render(<Wrapper />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the placeholder text', () => {
      render(<Wrapper />);

      expect(
        screen.getByPlaceholderText('Add any additional comments or notes for this invoice...')
      ).toBeInTheDocument();
    });
  });

  // -- Initial value --------------------------------------------------------

  describe('initial value', () => {
    it('displays the default notes value', () => {
      render(<Wrapper defaultNotes='Pay within 14 days' />);

      expect(screen.getByRole('textbox')).toHaveValue('Pay within 14 days');
    });

    it('renders empty textarea when no default is provided', () => {
      render(<Wrapper />);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  // -- Locked state ---------------------------------------------------------

  describe('locked state', () => {
    it('disables the textarea when isLocked is true', () => {
      render(<Wrapper isLocked={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not disable the textarea when isLocked is false', () => {
      render(<Wrapper isLocked={false} />);

      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });
  });

  // -- Input interaction ----------------------------------------------------

  describe('input interaction', () => {
    it('accepts user input when not locked', () => {
      render(<Wrapper />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Please pay promptly.' } });

      expect(textarea).toHaveValue('Please pay promptly.');
    });
  });
});
