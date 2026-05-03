// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { OrganizationStatusBadge } from '../organization-status-badge';

describe('OrganizationStatusBadge', () => {
  it('renders "Active" label for ACTIVE status', () => {
    render(<OrganizationStatusBadge status='ACTIVE' />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Inactive" label for INACTIVE status', () => {
    render(<OrganizationStatusBadge status='INACTIVE' />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
