// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CashFlowChart from '../analytics/cash-flow-chart';

// -- Mocks ------------------------------------------------------------------

// Recharts uses ResizeObserver which is not available in happy-dom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver;

// -- Tests ------------------------------------------------------------------

describe('CashFlowChart', () => {
  // -- Loading state --------------------------------------------------------

  it('renders a loading skeleton when isLoading is true', () => {
    const { container } = render(<CashFlowChart isLoading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('does not render chart content when isLoading', () => {
    render(<CashFlowChart isLoading={true} />);
    expect(screen.queryByText('Cash Flow')).not.toBeInTheDocument();
  });

  // -- Normal state ---------------------------------------------------------

  it('renders Cash Flow title', () => {
    render(<CashFlowChart isLoading={false} />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<CashFlowChart isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Go back in time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go forward in time' })).toBeInTheDocument();
  });

  it('forward button is disabled at current month (offset 0)', () => {
    render(<CashFlowChart isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Go forward in time' })).toBeDisabled();
  });

  it('enables forward button after navigating back', () => {
    render(<CashFlowChart isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go back in time' }));
    expect(screen.getByRole('button', { name: 'Go forward in time' })).not.toBeDisabled();
  });

  it('renders without data', () => {
    expect(() => render(<CashFlowChart isLoading={false} />)).not.toThrow();
  });
});
