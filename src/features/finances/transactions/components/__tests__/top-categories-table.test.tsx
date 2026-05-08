// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopCategoriesTable } from '../analytics/top-categories-table';
import { createTopCategory } from '@/lib/testing/factories/transaction.factory';

// -- Tests ------------------------------------------------------------------

describe('TopCategoriesTable', () => {
  // -- Loading state --------------------------------------------------------

  describe('loading state', () => {
    it('does not show the Top Categories heading while loading', () => {
      render(<TopCategoriesTable isLoading={true} />);
      expect(screen.queryByText('Top Categories')).not.toBeInTheDocument();
    });

    it('does not show category data while loading', () => {
      render(<TopCategoriesTable isLoading={true} />);
      expect(screen.queryByText(/Office Supplies/i)).not.toBeInTheDocument();
    });
  });

  // -- Normal state ---------------------------------------------------------

  describe('normal state', () => {
    it('shows the Top Categories heading', () => {
      render(<TopCategoriesTable categories={[]} isLoading={false} />);
      expect(screen.getByText('Top Categories')).toBeInTheDocument();
    });

    it('shows "No category data available" when categories is empty', () => {
      render(<TopCategoriesTable categories={[]} isLoading={false} />);
      expect(screen.getByText('No category data available')).toBeInTheDocument();
    });

    it('renders each category name', () => {
      const categories = [
        createTopCategory({ categoryName: 'Food & Dining', categoryId: 'cat-1' }),
        createTopCategory({ categoryName: 'Transport', categoryId: 'cat-2' })
      ];
      render(<TopCategoriesTable categories={categories} isLoading={false} />);
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    });

    it('renders rank numbers for each category', () => {
      const categories = [
        createTopCategory({ categoryId: 'cat-1', categoryName: 'Food' }),
        createTopCategory({ categoryId: 'cat-2', categoryName: 'Travel' })
      ];
      render(<TopCategoriesTable categories={categories} isLoading={false} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('does not show "No category data available" when categories exist', () => {
      const categories = [createTopCategory({ categoryId: 'cat-1', categoryName: 'Food' })];
      render(<TopCategoriesTable categories={categories} isLoading={false} />);
      expect(screen.queryByText('No category data available')).not.toBeInTheDocument();
    });
  });

  // -- Undefined categories -------------------------------------------------

  it('renders without crashing when categories is undefined', () => {
    expect(() => render(<TopCategoriesTable isLoading={false} />)).not.toThrow();
  });
});
