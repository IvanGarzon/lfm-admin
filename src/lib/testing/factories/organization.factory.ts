/**
 * Organization Factory
 *
 * Creates organization input fixtures and mock response objects for testing.
 */

import { testIds } from '../id-generator';
import type { CreateOrganizationInput } from '@/schemas/organizations';
import type { OrganizationListItem } from '@/features/crm/organizations/types';

export function createOrganizationInput(
  overrides: Partial<CreateOrganizationInput> = {},
): CreateOrganizationInput {
  return {
    name: 'Acme Florals',
    phone: null,
    email: null,
    website: null,
    address: null,
    city: null,
    state: null,
    postcode: null,
    country: 'Australia',
    abn: null,
    status: 'ACTIVE',
    ...overrides,
  };
}

/**
 * Creates a mock OrganizationListItem as returned by the repository.
 */
export function createOrganizationResponse(
  overrides: Partial<OrganizationListItem> = {},
): OrganizationListItem {
  return {
    id: overrides.id ?? testIds.organization(),
    name: 'Acme Florals',
    address: null,
    city: null,
    state: null,
    postcode: null,
    country: 'Australia',
    phone: null,
    email: null,
    website: null,
    abn: null,
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    customersCount: 0,
    ...overrides,
  };
}
