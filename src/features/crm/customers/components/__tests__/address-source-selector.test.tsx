// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AddressSourceSelector } from '../address-source-selector';
import type { Organization } from '@/components/shared/organization-select';

// -- Mocks ------------------------------------------------------------------

// Stub Radix RadioGroup to avoid portal/focus complexity in happy-dom.
const mockGroupOnValueChange = vi.fn();

vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({
    onValueChange,
    disabled,
    children,
    className
  }: {
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
  }) => {
    mockGroupOnValueChange.mockImplementation(onValueChange);
    return (
      <div aria-disabled={disabled} className={className}>
        {children}
      </div>
    );
  },
  RadioGroupItem: ({ value, id, disabled }: { value: string; id: string; disabled?: boolean }) => (
    <button
      type='button'
      role='radio'
      id={id}
      disabled={disabled}
      onClick={() => mockGroupOnValueChange(value)}
    />
  )
}));

// -- Helpers ----------------------------------------------------------------

const orgWithAddress: Organization = {
  id: 'org-1',
  name: 'ACME',
  address: '1 Collins St',
  city: 'Melbourne',
  state: 'VIC',
  postcode: '3000',
  country: 'Australia'
};

const orgWithoutAddress: Organization = {
  id: 'org-2',
  name: 'NoAddr Co',
  address: null,
  city: null
};

// -- Tests ------------------------------------------------------------------

describe('AddressSourceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('organisation with complete address', () => {
    it('shows the formatted organisation address', () => {
      render(
        <AddressSourceSelector
          organization={orgWithAddress}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
        />
      );
      expect(screen.getByText('1 Collins St, Melbourne, VIC, 3000, Australia')).toBeInTheDocument();
    });

    it('organisation radio is enabled', () => {
      render(
        <AddressSourceSelector
          organization={orgWithAddress}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
        />
      );
      expect(screen.getByRole('radio', { name: /use organization address/i })).not.toBeDisabled();
    });

    it('calls onValueChange(true) when the organisation radio is clicked', () => {
      const onValueChange = vi.fn();
      render(
        <AddressSourceSelector
          organization={orgWithAddress}
          useOrganizationAddress={false}
          onValueChange={onValueChange}
        />
      );
      const [orgRadio] = screen.getAllByRole('radio');
      fireEvent.click(orgRadio);
      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('calls onValueChange(false) when the custom radio is clicked', () => {
      const onValueChange = vi.fn();
      render(
        <AddressSourceSelector
          organization={orgWithAddress}
          useOrganizationAddress={true}
          onValueChange={onValueChange}
        />
      );
      const [, customRadio] = screen.getAllByRole('radio');
      fireEvent.click(customRadio);
      expect(onValueChange).toHaveBeenCalledWith(false);
    });
  });

  describe('organisation without complete address', () => {
    it('shows the "no address configured" message', () => {
      render(
        <AddressSourceSelector
          organization={orgWithoutAddress}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
        />
      );
      expect(screen.getByText('Organization has no address configured')).toBeInTheDocument();
    });

    it('disables the organisation radio', () => {
      render(
        <AddressSourceSelector
          organization={orgWithoutAddress}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
        />
      );
      const [orgRadio] = screen.getAllByRole('radio');
      expect(orgRadio).toBeDisabled();
    });
  });

  describe('null organisation', () => {
    it('shows the "no address configured" message', () => {
      render(
        <AddressSourceSelector
          organization={null}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
        />
      );
      expect(screen.getByText('Organization has no address configured')).toBeInTheDocument();
    });
  });

  describe('disabled prop', () => {
    it('passes disabled to the RadioGroup', () => {
      render(
        <AddressSourceSelector
          organization={orgWithAddress}
          useOrganizationAddress={false}
          onValueChange={vi.fn()}
          disabled
        />
      );
      const group = screen.getByText('Use organization address').closest('[aria-disabled]');
      expect(group).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
