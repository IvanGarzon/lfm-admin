// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { createInvoiceColumns } from '../invoice-columns';
import type { InvoiceListItem } from '@/features/finances/invoices/types';
import { createInvoiceListItem } from '@/lib/testing/factories/invoice.factory';
import type { ColumnDef, Row, Table } from '@tanstack/react-table';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/features/finances/invoices/utils/invoice-helpers', () => ({
  daysUntilDue: vi.fn(() => 10),
  getOverdueDays: vi.fn(() => 0),
  getUrgency: vi.fn(() => 'low'),
  isOverdue: vi.fn(() => false),
  needsReminder: vi.fn(() => false)
}));

vi.mock('@/hooks/use-query-string', () => ({
  useQueryString: () => ''
}));

vi.mock('@/filters/invoices/invoices-filters', () => ({
  invoiceSearchParamsDefaults: {},
  searchParams: {}
}));

vi.mock('@/features/finances/invoices/components/invoice-status-badge', () => ({
  InvoiceStatusBadge: ({ status }: { status: string }) => (
    <div data-testid='invoice-status-badge'>{status}</div>
  )
}));

vi.mock('@/features/finances/invoices/components/invoice-actions', () => ({
  InvoiceActions: ({
    onDelete,
    onSendReminder,
    onMarkAsPending,
    onRecordPayment,
    onCancel,
    onDownloadPdf,
    onMarkAsDraft,
    invoice
  }: {
    invoice: InvoiceListItem;
    onDelete: (id: string, invoiceNumber: string) => void;
    onSendReminder: (id: string) => void;
    onMarkAsPending: (id: string, invoiceNumber: string) => void;
    onRecordPayment: (id: string, invoiceNumber: string) => void;
    onCancel: (id: string, invoiceNumber: string) => void;
    onDownloadPdf: (id: string) => void;
    onMarkAsDraft: (id: string) => void;
    onDuplicate: (id: string) => void;
    onSendReceipt?: (id: string) => void;
  }) => (
    <div data-testid='invoice-actions'>
      <button onClick={() => onDelete(invoice.id, invoice.invoiceNumber)}>delete</button>
      <button onClick={() => onSendReminder(invoice.id)}>reminder</button>
      <button onClick={() => onMarkAsPending(invoice.id, invoice.invoiceNumber)}>pending</button>
      <button onClick={() => onRecordPayment(invoice.id, invoice.invoiceNumber)}>payment</button>
      <button onClick={() => onCancel(invoice.id, invoice.invoiceNumber)}>cancel</button>
      <button onClick={() => onDownloadPdf(invoice.id)}>pdf</button>
      <button onClick={() => onMarkAsDraft(invoice.id)}>draft</button>
    </div>
  )
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

vi.mock('@/components/shared/user-avatar', () => ({
  UserAvatar: ({ user }: { user: { name: string; image: null } }) => (
    <div data-testid='user-avatar'>{user.name}</div>
  )
}));

vi.mock('@/components/shared/tableV3/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <div>{title}</div>
}));

vi.mock('@/components/ui/box', () => ({
  Box: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  )
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel
  }: {
    checked: boolean | 'indeterminate';
    onCheckedChange: (value: boolean) => void;
    'aria-label'?: string;
  }) => (
    <input
      type='checkbox'
      aria-label={ariaLabel}
      checked={Boolean(checked)}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  )
}));

// -- Helpers ----------------------------------------------------------------

function makeCallbacks() {
  return {
    onDelete: vi.fn(),
    onSendReminder: vi.fn(),
    onMarkAsPending: vi.fn(),
    onRecordPayment: vi.fn(),
    onCancel: vi.fn(),
    onDownloadPdf: vi.fn(),
    onMarkAsDraft: vi.fn(),
    onSendReceipt: vi.fn(),
    onDuplicate: vi.fn()
  };
}

type CellContext = {
  row: Partial<Row<InvoiceListItem>> & {
    original: InvoiceListItem;
    getValue: <TValue = unknown>(key: string) => TValue;
  };
};

function getCellRenderer(columns: ColumnDef<InvoiceListItem>[], id: string) {
  const col = columns.find(
    (c) =>
      (c as { id?: string; accessorKey?: string }).id === id ||
      (c as { accessorKey?: string }).accessorKey === id
  );
  if (!col || !('cell' in col) || typeof col.cell !== 'function') {
    throw new Error(`No cell renderer found for column "${id}"`);
  }
  return col.cell as (ctx: CellContext) => React.ReactNode;
}

function makeCellContext(invoice: InvoiceListItem): CellContext {
  return {
    row: {
      original: invoice,
      getValue: <TValue = unknown,>(key: string): TValue =>
        invoice[key as keyof InvoiceListItem] as TValue,
      getIsSelected: () => false,
      toggleSelected: vi.fn()
    }
  };
}

function makeTableContext() {
  return {
    table: {
      getIsAllPageRowsSelected: () => false,
      getIsSomePageRowsSelected: () => false,
      toggleAllPageRowsSelected: vi.fn()
    } as unknown as Table<InvoiceListItem>
  };
}

// -- Tests ------------------------------------------------------------------

describe('createInvoiceColumns', () => {
  let columns: ColumnDef<InvoiceListItem>[];
  let cbs: ReturnType<typeof makeCallbacks>;

  beforeEach(() => {
    vi.clearAllMocks();
    cbs = makeCallbacks();
    columns = createInvoiceColumns(
      cbs.onDelete,
      cbs.onSendReminder,
      cbs.onMarkAsPending,
      cbs.onRecordPayment,
      cbs.onCancel,
      cbs.onDownloadPdf,
      cbs.onMarkAsDraft,
      cbs.onSendReceipt,
      cbs.onDuplicate
    );
  });

  // -- Column shape ---------------------------------------------------------

  it('returns 8 columns', () => {
    expect(columns).toHaveLength(8);
  });

  it('includes expected column ids', () => {
    const ids = columns.map(
      (c) =>
        (c as { id?: string; accessorKey?: string }).id ??
        (c as { accessorKey?: string }).accessorKey
    );
    expect(ids).toContain('select');
    expect(ids).toContain('search');
    expect(ids).toContain('status');
    expect(ids).toContain('customer');
    expect(ids).toContain('amount');
    expect(ids).toContain('issuedDate');
    expect(ids).toContain('dueDate');
    expect(ids).toContain('actions');
  });

  // -- search (invoiceNumber) column ----------------------------------------

  describe('search column', () => {
    it('renders a link with the invoice number', () => {
      const cell = getCellRenderer(columns, 'search');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByRole('link', { name: 'INV-2024-0001' })).toBeInTheDocument();
    });
  });

  // -- status column --------------------------------------------------------

  describe('status column', () => {
    it('renders InvoiceStatusBadge with the row status', () => {
      const cell = getCellRenderer(columns, 'status');
      const invoice = createInvoiceListItem({ status: 'OVERDUE' });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByTestId('invoice-status-badge')).toHaveTextContent('OVERDUE');
    });
  });

  // -- customer column -------------------------------------------------------

  describe('customer column', () => {
    it('renders the customer name', () => {
      const cell = getCellRenderer(columns, 'customer');
      const invoice = createInvoiceListItem({ customerName: 'Alice Brown' });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getAllByText('Alice Brown').length).toBeGreaterThan(0);
    });

    it('renders the customer email', () => {
      const cell = getCellRenderer(columns, 'customer');
      const invoice = createInvoiceListItem({ customerEmail: 'alice@example.com' });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  // -- amount column ---------------------------------------------------------

  describe('amount column', () => {
    it('renders formatted amount', () => {
      const cell = getCellRenderer(columns, 'amount');
      const invoice = createInvoiceListItem({ amount: 2200, amountPaid: 0, amountDue: 2200 });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText(/2,200/)).toBeInTheDocument();
    });

    it('renders amount due when partial payment has been made', () => {
      const cell = getCellRenderer(columns, 'amount');
      const invoice = createInvoiceListItem({ amount: 2200, amountPaid: 500, amountDue: 1700 });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText(/1,700/)).toBeInTheDocument();
    });
  });

  // -- issuedDate column -----------------------------------------------------

  describe('issuedDate column', () => {
    it('renders the issued date formatted as MMM dd, yyyy', () => {
      const cell = getCellRenderer(columns, 'issuedDate');
      const invoice = createInvoiceListItem({ issuedDate: new Date('2024-03-15') });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
    });
  });

  // -- dueDate column --------------------------------------------------------

  describe('dueDate column', () => {
    it('renders a plain date for a paid invoice', () => {
      const cell = getCellRenderer(columns, 'dueDate');
      const invoice = createInvoiceListItem({ status: 'PAID', dueDate: new Date('2024-06-01') });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText('Jun 01, 2024')).toBeInTheDocument();
    });

    it('renders a plain date for a cancelled invoice', () => {
      const cell = getCellRenderer(columns, 'dueDate');
      const invoice = createInvoiceListItem({
        status: 'CANCELLED',
        dueDate: new Date('2024-06-01')
      });

      render(<>{cell(makeCellContext(invoice))}</>);

      expect(screen.getByText('Jun 01, 2024')).toBeInTheDocument();
    });
  });

  // -- actions column --------------------------------------------------------

  describe('actions column', () => {
    it('calls onDelete with invoice id and number', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'delete' }).click();

      expect(cbs.onDelete).toHaveBeenCalledWith('inv-001', 'INV-2024-0001');
    });

    it('calls onSendReminder with invoice id', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'reminder' }).click();

      expect(cbs.onSendReminder).toHaveBeenCalledWith('inv-001');
    });

    it('calls onMarkAsPending with invoice id and number', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'pending' }).click();

      expect(cbs.onMarkAsPending).toHaveBeenCalledWith('inv-001', 'INV-2024-0001');
    });

    it('calls onRecordPayment with invoice id and number', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'payment' }).click();

      expect(cbs.onRecordPayment).toHaveBeenCalledWith('inv-001', 'INV-2024-0001');
    });

    it('calls onCancel with invoice id and number', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'cancel' }).click();

      expect(cbs.onCancel).toHaveBeenCalledWith('inv-001', 'INV-2024-0001');
    });

    it('calls onDownloadPdf with invoice id', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'pdf' }).click();

      expect(cbs.onDownloadPdf).toHaveBeenCalledWith('inv-001');
    });

    it('calls onMarkAsDraft with invoice id', () => {
      const cell = getCellRenderer(columns, 'actions');
      const invoice = createInvoiceListItem();

      render(<>{cell(makeCellContext(invoice))}</>);

      screen.getByRole('button', { name: 'draft' }).click();

      expect(cbs.onMarkAsDraft).toHaveBeenCalledWith('inv-001');
    });
  });

  // -- select column ---------------------------------------------------------

  describe('select column', () => {
    it('renders a select-all checkbox in the header', () => {
      const col = columns.find((c) => (c as { id?: string }).id === 'select');
      if (!col || !('header' in col) || typeof col.header !== 'function') throw new Error();

      render(
        <>
          {col.header({
            table: makeTableContext().table,
            column: undefined as never,
            header: undefined as never
          })}
        </>
      );

      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    it('renders a select-row checkbox in the cell', () => {
      const col = columns.find((c) => (c as { id?: string }).id === 'select');
      if (!col || !('cell' in col) || typeof col.cell !== 'function') throw new Error();

      const ctx = {
        row: {
          original: createInvoiceListItem(),
          getValue: vi.fn(),
          getIsSelected: () => false,
          toggleSelected: vi.fn()
        }
      };

      render(<>{col.cell(ctx as never)}</>);

      expect(screen.getByRole('checkbox', { name: /select row/i })).toBeInTheDocument();
    });
  });
});
