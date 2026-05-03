/**
 * Customer Factory
 *
 * Creates customer input and list item fixtures for testing.
 */

import type { CreateCustomerInput } from '@/schemas/customers';
import type { CustomerListItem } from '@/features/crm/customers/types';

export function createCustomerInput(
  overrides: Partial<CreateCustomerInput> = {}
): CreateCustomerInput {
  return {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: null,
    gender: 'FEMALE',
    status: 'ACTIVE',
    organizationId: null,
    organizationName: null,
    useOrganizationAddress: false,
    address: {
      address1: '1 Test St',
      address2: '',
      city: 'Melbourne',
      region: 'VIC',
      postalCode: '3000',
      country: 'Australia',
      lat: 0,
      lng: 0,
      formattedAddress: '1 Test St, Melbourne VIC 3000'
    },
    ...overrides
  };
}

export function createCustomerListItem(
  overrides: Partial<CustomerListItem> = {}
): CustomerListItem {
  return {
    id: 'customer-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: null,
    gender: 'FEMALE',
    status: 'ACTIVE',
    organizationId: null,
    organizationName: null,
    useOrganizationAddress: false,
    address: null,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    invoicesCount: 0,
    quotesCount: 0,
    ...overrides
  };
}
