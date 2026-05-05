// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TopDebtorsList } from '../../analytics/top-debtors-list';
import type { TopCustomerDebtor } from '@/features/finances/invoices/types';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatCurrency: ({ number }: { number: number }) => `$${number.toFixed(2)}`
  };
});

// -- Helpers ----------------------------------------------------------------

function makeDebtor(overrides: Partial<TopCustomerDebtor> = {}): TopCustomerDebtor {
  return {
    customerId: 'cust-1',
    customerName: 'Alice Brown',
    amountDue: 1500,
    invoiceCount: 3,
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('TopDebtorsList', () => {
  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton rows when isLoading is true', () => {
      const { container } = render(<TopDebtorsList isLoading />);

      const skeletons = container.querySelectorAll('[class*="rounded-full"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the Top Debtors heading when loading', () => {
      render(<TopDebtorsList isLoading />);

      expect(screen.queryByText('Top Debtors')).not.toBeInTheDocument();
    });
  });

  // -- Empty state ----------------------------------------------------------

  describe('empty state', () => {
    it('renders no outstanding balances message when debtors is empty', () => {
      render(<TopDebtorsList debtors={[]} />);

      expect(screen.getByText('No outstanding balances!')).toBeInTheDocument();
    });

    it('renders the card title even when debtors is empty', () => {
      render(<TopDebtorsList debtors={[]} />);

      expect(screen.getByText('Top Debtors')).toBeInTheDocument();
    });

    it('renders no rows when debtors is undefined', () => {
      render(<TopDebtorsList />);

      expect(screen.queryByText('unpaid invoices')).not.toBeInTheDocument();
    });
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the card title', () => {
      render(<TopDebtorsList debtors={[makeDebtor()]} />);

      expect(screen.getByText('Top Debtors')).toBeInTheDocument();
    });

    it('renders the card description', () => {
      render(<TopDebtorsList debtors={[makeDebtor()]} />);

      expect(
        screen.getByText('Customers with the highest outstanding balances.')
      ).toBeInTheDocument();
    });

    it('renders debtor name', () => {
      render(<TopDebtorsList debtors={[makeDebtor()]} />);

      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    it('renders invoice count', () => {
      render(<TopDebtorsList debtors={[makeDebtor({ invoiceCount: 5 })]} />);

      expect(screen.getByText('5 unpaid invoices')).toBeInTheDocument();
    });

    it('renders formatted amount due', () => {
      render(<TopDebtorsList debtors={[makeDebtor({ amountDue: 2500 })]} />);

      expect(screen.getByText('$2500.00')).toBeInTheDocument();
    });

    it('renders avatar initials from debtor name', () => {
      render(<TopDebtorsList debtors={[makeDebtor({ customerName: 'Alice Brown' })]} />);

      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('renders multiple debtors', () => {
      const debtors = [
        makeDebtor({ customerId: 'cust-1', customerName: 'Alice Brown', invoiceCount: 2 }),
        makeDebtor({ customerId: 'cust-2', customerName: 'Bob Smith', invoiceCount: 4 })
      ];

      render(<TopDebtorsList debtors={debtors} />);

      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('renders single-word name with a single initial', () => {
      render(<TopDebtorsList debtors={[makeDebtor({ customerName: 'Madonna' })]} />);

      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });
});
