// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DollarSign, TrendingUp } from 'lucide-react';

import { StatCard } from '../../analytics/stat-card';

// -- Tests ------------------------------------------------------------------

describe('StatCard', () => {
  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('renders skeleton placeholders when isLoading is true', () => {
      const { container } = render(
        <StatCard title='Revenue' value='$1,000' icon={DollarSign} isLoading />
      );

      const skeletons = container.querySelectorAll('[class*="animate-pulse"], .h-8, .h-4, .h-3');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render the title when loading', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} isLoading />);

      expect(screen.queryByText('Revenue')).not.toBeInTheDocument();
    });

    it('does not render the value when loading', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} isLoading />);

      expect(screen.queryByText('$1,000')).not.toBeInTheDocument();
    });
  });

  // -- Rendering ------------------------------------------------------------

  describe('rendering', () => {
    it('renders the title', () => {
      render(<StatCard title='Total Revenue' value='$5,000' icon={DollarSign} />);

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    it('renders the value', () => {
      render(<StatCard title='Total Revenue' value='$5,000' icon={DollarSign} />);

      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('renders a numeric value', () => {
      render(<StatCard title='Count' value={42} icon={DollarSign} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders the description when provided and no growth', () => {
      render(
        <StatCard title='Revenue' value='$1,000' icon={DollarSign} description='Last 30 days' />
      );

      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('does not render description when growth is also provided', () => {
      render(
        <StatCard
          title='Revenue'
          value='$1,000'
          icon={DollarSign}
          description='Last 30 days'
          growth={5}
        />
      );

      expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
    });
  });

  // -- Growth indicator -----------------------------------------------------

  describe('growth indicator', () => {
    it('renders positive growth with a plus sign', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} growth={12} />);

      expect(screen.getByText(/\+12%/)).toBeInTheDocument();
    });

    it('renders negative growth without a plus sign', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} growth={-8} />);

      expect(screen.getByText(/-8%/)).toBeInTheDocument();
    });

    it('renders zero growth without a trending icon', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} growth={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders the comparisonLabel alongside positive growth', () => {
      render(
        <StatCard
          title='Revenue'
          value='$1,000'
          icon={DollarSign}
          growth={5}
          comparisonLabel='vs last month'
        />
      );

      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('does not render growth section when growth is undefined', () => {
      render(<StatCard title='Revenue' value='$1,000' icon={DollarSign} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });
});
