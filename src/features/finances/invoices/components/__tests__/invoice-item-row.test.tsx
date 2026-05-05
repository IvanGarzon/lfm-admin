// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { InvoiceItemRow } from '../invoice-item-row';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';
import type { ActiveProduct } from '@/features/inventory/products/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  Reorder: {
    Item: ({
      children,
      className
    }: {
      children: React.ReactNode;
      value: unknown;
      dragControls: unknown;
      dragListener: boolean;
      style: unknown;
      layout: string;
      transition: unknown;
      className?: string;
      onDragStart: () => void;
      onDragEnd: () => void;
    }) => <div className={className}>{children}</div>
  },
  useDragControls: () => ({ start: vi.fn() }),
  useMotionValue: () => 0
}));

vi.mock('@/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => false
}));

vi.mock('@/components/shared/product-search-dialog', () => ({
  ProductSearchDialog: ({
    open,
    onProductSelect,
    onOpenChange
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: unknown[];
    isLoadingProducts: boolean;
    selectedProductId: string | null;
    onProductSelect: (id: string) => void;
  }) =>
    open ? (
      <div data-testid='product-search-dialog'>
        <button onClick={() => onProductSelect('product-1')}>Select product</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | false)[]) => args.filter(Boolean).join(' '),
  formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(0)}`
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({
    children,
    className,
    onPointerDown
  }: {
    children?: React.ReactNode;
    className?: string;
    onPointerDown?: React.PointerEventHandler;
  }) => (
    <div className={className} onPointerDown={onPointerDown}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
    variant?: string;
    className?: string;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={props['aria-label']}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({
    disabled,
    onChange,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { disabled?: boolean }) => (
    <input data-testid='quantity-input' disabled={disabled} onChange={onChange} {...props} />
  )
}));

vi.mock('@/components/ui/input-group', () => ({
  InputGroup: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  InputGroupInput: ({
    disabled,
    placeholder,
    name,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { disabled?: boolean }) => (
    <input
      data-testid={name?.includes('description') ? 'description-input' : 'unit-price-input'}
      disabled={disabled}
      placeholder={placeholder}
      name={name}
      {...props}
    />
  ),
  InputGroupAddon: ({ children }: { children?: React.ReactNode; align?: string }) => (
    <div>{children}</div>
  ),
  InputGroupButton: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
    size?: string;
    className?: string;
    title?: string;
    'aria-label'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={props['aria-label']}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormField: ({
    name,
    render
  }: {
    control: unknown;
    name: string;
    render: (props: { field: React.InputHTMLAttributes<HTMLInputElement> }) => React.ReactNode;
  }) =>
    render({
      field: {
        value: '',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name
      }
    }),
  FormItem: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

// -- Helpers ----------------------------------------------------------------

const SAMPLE_PRODUCTS: ActiveProduct[] = [
  {
    id: 'product-1',
    name: 'Test Product',
    price: 99.99
  }
];

function makeField() {
  return {
    id: 'field-1',
    description: '',
    quantity: 1,
    unitPrice: 0,
    productId: null
  };
}

function Wrapper({
  products = [],
  isLoadingProducts = false,
  canRemove = true,
  onRemove = vi.fn(),
  isLocked = false
}: {
  products?: ActiveProduct[];
  isLoadingProducts?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
  isLocked?: boolean;
}) {
  const form = useForm<InvoiceFormInput>({
    defaultValues: {
      customerId: 'customer-1',
      currency: 'AUD',
      issuedDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
      gst: 10,
      discount: 0,
      items: [
        {
          description: '',
          quantity: 1,
          unitPrice: 50,
          productId: null
        }
      ]
    } as InvoiceFormInput
  });

  return (
    <FormProvider {...form}>
      <InvoiceItemRow
        index={0}
        field={makeField() as ReturnType<typeof makeField> & { id: string }}
        form={form}
        products={products}
        isLoadingProducts={isLoadingProducts}
        canRemove={canRemove}
        onRemove={onRemove}
        isLocked={isLocked}
      />
    </FormProvider>
  );
}

// -- Tests ------------------------------------------------------------------

describe('InvoiceItemRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the description input', () => {
      render(<Wrapper />);

      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    it('renders the quantity input', () => {
      render(<Wrapper />);

      expect(screen.getByTestId('quantity-input')).toBeInTheDocument();
    });

    it('renders the formatted total based on form values', () => {
      render(<Wrapper />);

      // quantity=1, unitPrice=50 from defaultValues → total = $50
      expect(screen.getByText('$50')).toBeInTheDocument();
    });
  });

  // -- Remove button --------------------------------------------------------

  describe('remove button', () => {
    it('renders the remove button when canRemove is true', () => {
      render(<Wrapper canRemove={true} />);

      expect(screen.getByRole('button', { name: /remove item/i })).toBeInTheDocument();
    });

    it('does not render the remove button when canRemove is false', () => {
      render(<Wrapper canRemove={false} />);

      expect(screen.queryByRole('button', { name: /remove item/i })).not.toBeInTheDocument();
    });

    it('calls onRemove when the remove button is clicked', () => {
      const onRemove = vi.fn();
      render(<Wrapper canRemove={true} onRemove={onRemove} />);

      fireEvent.click(screen.getByRole('button', { name: /remove item/i }));

      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('disables the remove button when isLocked is true', () => {
      render(<Wrapper canRemove={true} isLocked={true} />);

      expect(screen.getByRole('button', { name: /remove item/i })).toBeDisabled();
    });
  });

  // -- Product browse button ------------------------------------------------

  describe('product browse button', () => {
    it('renders the Browse products button when products are available', () => {
      render(<Wrapper products={SAMPLE_PRODUCTS} />);

      expect(screen.getByRole('button', { name: /browse products/i })).toBeInTheDocument();
    });

    it('does not render the Browse products button when products list is empty', () => {
      render(<Wrapper products={[]} />);

      expect(screen.queryByRole('button', { name: /browse products/i })).not.toBeInTheDocument();
    });

    it('opens the product search dialog when Browse products is clicked', () => {
      render(<Wrapper products={SAMPLE_PRODUCTS} />);

      fireEvent.click(screen.getByRole('button', { name: /browse products/i }));

      expect(screen.getByTestId('product-search-dialog')).toBeInTheDocument();
    });

    it('closes the product search dialog when dialog onOpenChange(false) is called', () => {
      render(<Wrapper products={SAMPLE_PRODUCTS} />);

      fireEvent.click(screen.getByRole('button', { name: /browse products/i }));
      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(screen.queryByTestId('product-search-dialog')).not.toBeInTheDocument();
    });
  });

  // -- Locked state ---------------------------------------------------------

  describe('locked state', () => {
    it('disables the description input when isLocked is true', () => {
      render(<Wrapper isLocked={true} />);

      expect(screen.getByTestId('description-input')).toBeDisabled();
    });

    it('disables the quantity input when isLocked is true', () => {
      render(<Wrapper isLocked={true} />);

      expect(screen.getByTestId('quantity-input')).toBeDisabled();
    });
  });
});
