// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createVendorColumns } from '../vendor-columns';
import { createVendorListItem } from '@/lib/testing/factories/vendor.factory';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/inventory/vendors/hooks/use-vendor-href', () => ({
  useVendorHref: (id: string) => `/inventory/vendors/${id}`
}));

vi.mock('@/features/inventory/vendors/components/vendor-status-badge', () => ({
  VendorStatusBadge: ({ status }: { status: string }) => (
    <span data-testid='vendor-status-badge'>{status}</span>
  )
}));

vi.mock('@/features/inventory/vendors/components/vendor-actions', () => ({
  VendorActions: ({
    vendor,
    onDelete
  }: {
    vendor: { id: string; name: string; vendorCode: string };
    onDelete: (id: string, vendorCode: string, name: string) => void;
  }) => (
    <button onClick={() => onDelete(vendor.id, vendor.vendorCode, vendor.name)}>
      delete-{vendor.id}
    </button>
  )
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

vi.mock('@/components/shared/tableV3/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <span>{title}</span>
}));

// -- Helpers ----------------------------------------------------------------

function renderCell(
  columns: ReturnType<typeof createVendorColumns>,
  columnId: string,
  vendor: ReturnType<typeof createVendorListItem>
) {
  const col = columns.find(
    (c) => c.id === columnId || (c as { accessorKey?: string }).accessorKey === columnId
  );
  if (!col || !('cell' in col) || typeof col.cell !== 'function') return null;

  const row = {
    getValue: (key: string) => (vendor as Record<string, unknown>)[key],
    original: vendor
  };

  const rendered = (col.cell as (params: { row: typeof row }) => React.ReactNode)({ row });
  const { container } = render(<>{rendered}</>);
  return container;
}

// -- Tests ------------------------------------------------------------------

describe('createVendorColumns', () => {
  const onDelete = vi.fn();
  const vendor = createVendorListItem({
    id: 'v1',
    vendorCode: 'VEN-001',
    name: 'Acme Florals',
    email: 'acme@example.com',
    phone: '0400000000',
    status: 'ACTIVE',
    paymentTerms: 30,
    transactionCount: 5
  });
  const columns = createVendorColumns({ onDelete });

  it('returns 8 columns', () => {
    expect(columns).toHaveLength(8);
  });

  // -- vendorCode -----------------------------------------------------------

  it('renders vendorCode in monospace', () => {
    renderCell(columns, 'vendorCode', vendor);
    expect(screen.getByText('VEN-001')).toBeInTheDocument();
  });

  // -- name -----------------------------------------------------------------

  it('renders vendor name as a link', () => {
    renderCell(columns, 'search', vendor);
    expect(screen.getByRole('link', { name: 'Acme Florals' })).toHaveAttribute(
      'href',
      '/inventory/vendors/v1'
    );
  });

  // -- email ----------------------------------------------------------------

  it('renders email', () => {
    renderCell(columns, 'email', vendor);
    expect(screen.getByText('acme@example.com')).toBeInTheDocument();
  });

  // -- phone ----------------------------------------------------------------

  it('renders phone when present', () => {
    renderCell(columns, 'phone', vendor);
    expect(screen.getByText('0400000000')).toBeInTheDocument();
  });

  it('renders "-" when phone is null', () => {
    const noPhone = createVendorListItem({ ...vendor, phone: null });
    renderCell(columns, 'phone', noPhone);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  // -- status ---------------------------------------------------------------

  it('renders VendorStatusBadge with correct status', () => {
    renderCell(columns, 'status', vendor);
    expect(screen.getByTestId('vendor-status-badge')).toHaveTextContent('ACTIVE');
  });

  // -- paymentTerms ---------------------------------------------------------

  it('renders payment terms in days', () => {
    renderCell(columns, 'paymentTerms', vendor);
    expect(screen.getByText('30 days')).toBeInTheDocument();
  });

  it('renders "-" when paymentTerms is null', () => {
    const noTerms = createVendorListItem({ ...vendor, paymentTerms: null });
    renderCell(columns, 'paymentTerms', noTerms);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  // -- transactionCount -----------------------------------------------------

  it('renders transaction count', () => {
    renderCell(columns, 'transactionCount', vendor);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders 0 when transactionCount is undefined', () => {
    const noCount = createVendorListItem({ ...vendor, transactionCount: undefined });
    renderCell(columns, 'transactionCount', noCount);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // -- actions --------------------------------------------------------------

  it('calls onDelete with correct args when delete is triggered', () => {
    renderCell(columns, 'actions', vendor);
    screen.getByRole('button', { name: /delete-v1/i }).click();
    expect(onDelete).toHaveBeenCalledWith('v1', 'VEN-001', 'Acme Florals');
  });
});
