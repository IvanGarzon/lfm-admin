// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InvoiceStatusBadge } from '../invoice-status-badge';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/features/finances/shared/components/status-badge', () => ({
  StatusBadge: ({
    status,
    className
  }: {
    status: string;
    config: Record<string, unknown>;
    className?: string;
  }) => (
    <span data-testid='status-badge' data-status={status} data-classname={className}>
      {status}
    </span>
  )
}));

// -- Tests ------------------------------------------------------------------

describe('InvoiceStatusBadge', () => {
  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders a badge for DRAFT status', () => {
      render(<InvoiceStatusBadge status='DRAFT' />);

      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'DRAFT');
    });

    it('renders a badge for PENDING status', () => {
      render(<InvoiceStatusBadge status='PENDING' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PENDING');
    });

    it('renders a badge for PAID status', () => {
      render(<InvoiceStatusBadge status='PAID' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAID');
    });

    it('renders a badge for PARTIALLY_PAID status', () => {
      render(<InvoiceStatusBadge status='PARTIALLY_PAID' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PARTIALLY_PAID');
    });

    it('renders a badge for OVERDUE status', () => {
      render(<InvoiceStatusBadge status='OVERDUE' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'OVERDUE');
    });

    it('renders a badge for CANCELLED status', () => {
      render(<InvoiceStatusBadge status='CANCELLED' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'CANCELLED');
    });
  });

  // -- className prop -------------------------------------------------------

  describe('className prop', () => {
    it('forwards className to StatusBadge', () => {
      render(<InvoiceStatusBadge status='PAID' className='custom-class' />);

      expect(screen.getByTestId('status-badge')).toHaveAttribute('data-classname', 'custom-class');
    });

    it('renders without className when not provided', () => {
      render(<InvoiceStatusBadge status='DRAFT' />);

      expect(screen.getByTestId('status-badge')).not.toHaveAttribute(
        'data-classname',
        expect.stringContaining('custom')
      );
    });
  });
});
