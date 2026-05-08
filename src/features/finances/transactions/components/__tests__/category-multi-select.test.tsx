// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryMultiSelect } from '../category-multi-select';

// -- Mocks ------------------------------------------------------------------

vi.mock('@/actions/finances/transactions/mutations', () => ({
  createTransactionCategory: vi.fn().mockResolvedValue({ success: false })
}));

// -- Helpers ----------------------------------------------------------------

const categories = [
  { id: 'cat-1', name: 'Food', description: null },
  { id: 'cat-2', name: 'Transport', description: 'Travel costs' }
];

function openDropdown() {
  fireEvent.click(screen.getByRole('combobox'));
}

// -- Tests ------------------------------------------------------------------

describe('CategoryMultiSelect', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Closed state ---------------------------------------------------------

  it('shows placeholder when no categories are selected', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    expect(screen.getByText('Select categories...')).toBeInTheDocument();
  });

  it('shows selected category badge', () => {
    render(
      <CategoryMultiSelect categories={categories} selectedIds={['cat-1']} onChange={onChange} />
    );
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <CategoryMultiSelect
        categories={categories}
        selectedIds={[]}
        onChange={onChange}
        disabled={true}
      />
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  // -- Open state -----------------------------------------------------------

  it('opens the popover and shows all categories', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    openDropdown();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows category description when present', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    openDropdown();
    expect(screen.getByText('Travel costs')).toBeInTheDocument();
  });

  it('calls onChange with added id when an unselected category is clicked', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    openDropdown();
    fireEvent.click(screen.getByText('Food'));
    expect(onChange).toHaveBeenCalledWith(['cat-1']);
  });

  it('calls onChange without id when a selected category is clicked (deselect)', () => {
    render(
      <CategoryMultiSelect categories={categories} selectedIds={['cat-1']} onChange={onChange} />
    );
    openDropdown();
    // Food appears in both the badge and the list; click the list item
    const foodItems = screen.getAllByText('Food');
    fireEvent.click(foodItems[foodItems.length - 1]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  // -- Search and create ----------------------------------------------------

  it('shows create option when search text does not match any category', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    openDropdown();
    fireEvent.change(screen.getByPlaceholderText('Search or create category...'), {
      target: { value: 'NewCategory' }
    });
    expect(screen.getByText(/create "newcategory"/i)).toBeInTheDocument();
  });

  it('does not show create option when search matches an existing category', () => {
    render(<CategoryMultiSelect categories={categories} selectedIds={[]} onChange={onChange} />);
    openDropdown();
    fireEvent.change(screen.getByPlaceholderText('Search or create category...'), {
      target: { value: 'Food' }
    });
    expect(screen.queryByText(/create "food"/i)).not.toBeInTheDocument();
  });
});
