// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorSelect } from '../vendor-select';

// -- Tests ------------------------------------------------------------------

const vendors = [
  { id: 'v1', vendorCode: 'VEN-001', name: 'Acme Florals' },
  { id: 'v2', vendorCode: 'VEN-002', name: 'Bloom Co' }
];

describe('VendorSelect', () => {
  // -- Label ----------------------------------------------------------------

  it('renders the default "Vendor" label', () => {
    render(<VendorSelect />);
    expect(screen.getByText('Vendor')).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    render(<VendorSelect label='Supplier' />);
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  // -- Placeholder ----------------------------------------------------------

  it('shows the default placeholder when no value is selected', () => {
    render(<VendorSelect vendors={vendors} />);
    expect(screen.getByText('Select a vendor')).toBeInTheDocument();
  });

  it('shows a custom placeholder when provided', () => {
    render(<VendorSelect vendors={vendors} placeholder='Pick a supplier' />);
    expect(screen.getByText('Pick a supplier')).toBeInTheDocument();
  });

  it('shows "Loading vendors..." when isLoading is true', () => {
    render(<VendorSelect isLoading={true} />);
    expect(screen.getByText('Loading vendors...')).toBeInTheDocument();
  });

  // -- Selected value -------------------------------------------------------

  it('displays the selected vendor name when value matches', () => {
    render(<VendorSelect vendors={vendors} value='v1' />);
    expect(screen.getByText('Acme Florals')).toBeInTheDocument();
  });

  it('displays the selected vendor code when value matches', () => {
    render(<VendorSelect vendors={vendors} value='v1' />);
    expect(screen.getByText('VEN-001')).toBeInTheDocument();
  });

  // -- Disabled state -------------------------------------------------------

  it('disables the trigger button when disabled is true', () => {
    render(<VendorSelect vendors={vendors} disabled={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('disables the trigger button when isLoading is true', () => {
    render(<VendorSelect vendors={vendors} isLoading={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
