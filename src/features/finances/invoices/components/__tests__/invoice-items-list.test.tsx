// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';

import { InvoiceItemsList } from '../invoice-items-list';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  Reorder: {
    Group: ({
      children,
      as: Tag = 'div'
    }: {
      children: React.ReactNode;
      values: unknown[];
      onReorder: (v: unknown[]) => void;
      as?: string;
    }) => <Tag>{children}</Tag>
  }
}));

vi.mock('@/features/finances/invoices/components/invoice-item-row', () => ({
  InvoiceItemRow: ({
    index,
    onRemove,
    canRemove
  }: {
    field: unknown;
    index: number;
    form: unknown;
    isLocked?: boolean;
    products: unknown;
    isLoadingProducts: boolean;
    canRemove: boolean;
    onRemove: () => void;
  }) => (
    <div data-testid={`invoice-item-row-${index}`}>
      {canRemove && (
        <button onClick={onRemove} aria-label={`Remove item ${index}`}>
          Remove
        </button>
      )}
    </div>
  )
}));

// -- Helpers ----------------------------------------------------------------

function makeField(id: string) {
  return { id };
}

function makeForm(setFocusMock = vi.fn()): UseFormReturn<InvoiceFormInput> {
  return { setFocus: setFocusMock } as unknown as UseFormReturn<InvoiceFormInput>;
}

function makeFieldArray(
  fields: { id: string }[],
  overrides: Partial<UseFieldArrayReturn<InvoiceFormInput, 'items', 'id'>> = {}
): UseFieldArrayReturn<InvoiceFormInput, 'items', 'id'> {
  return {
    fields,
    append: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
    ...overrides
  } as unknown as UseFieldArrayReturn<InvoiceFormInput, 'items', 'id'>;
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceItemsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders a row for each field', () => {
      const fields = [makeField('f-1'), makeField('f-2'), makeField('f-3')];

      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray(fields)}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      expect(screen.getByTestId('invoice-item-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-item-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-item-row-2')).toBeInTheDocument();
    });

    it('renders the Items details heading', () => {
      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray([makeField('f-1')])}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      expect(screen.getByText('Items details')).toBeInTheDocument();
    });

    it('renders the Add Item button', () => {
      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray([makeField('f-1')])}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    it('disables Add Item button when isLocked is true', () => {
      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray([makeField('f-1')])}
          products={undefined}
          isLoadingProducts={false}
          isLocked={true}
        />
      );

      expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
    });
  });

  // -- Add item -------------------------------------------------------------

  describe('adding items', () => {
    it('calls append with a blank item when Add Item is clicked', () => {
      const append = vi.fn();

      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray([makeField('f-1')], { append })}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add item/i }));

      expect(append).toHaveBeenCalledWith(
        { description: '', quantity: 1, unitPrice: 0, productId: null },
        { shouldFocus: false }
      );
    });
  });

  // -- Remove item ----------------------------------------------------------

  describe('removing items', () => {
    it('calls remove with the correct index when a row Remove button is clicked', () => {
      const remove = vi.fn();
      const fields = [makeField('f-1'), makeField('f-2')];

      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray(fields, { remove })}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      fireEvent.click(screen.getByLabelText('Remove item 0'));

      expect(remove).toHaveBeenCalledWith(0);
    });

    it('does not show Remove button when there is only one item', () => {
      render(
        <InvoiceItemsList
          form={makeForm()}
          fieldArray={makeFieldArray([makeField('f-1')])}
          products={undefined}
          isLoadingProducts={false}
        />
      );

      expect(screen.queryByLabelText(/remove item/i)).not.toBeInTheDocument();
    });
  });
});
