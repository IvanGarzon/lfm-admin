/**
 * Vendor Factory
 *
 * Creates mock vendor objects and related data for testing.
 */

import { testIds } from '../id-generator';
import type { CreateVendorInput } from '@/schemas/vendors';
import type {
  VendorListItem,
  VendorWithDetails,
  VendorStatistics,
} from '@/features/inventory/vendors/types';

/**
 * Creates valid vendor input data for create mutations.
 */
export function createVendorInput(overrides: Partial<CreateVendorInput> = {}): CreateVendorInput {
  return {
    name: 'Acme Florals',
    email: 'contact@acme.com',
    phone: '0400000000',
    abn: '12345678901',
    status: 'ACTIVE',
    address: null,
    website: null,
    paymentTerms: 30,
    taxId: null,
    notes: null,
    ...overrides,
  };
}

/**
 * Creates a mock vendor list item as returned by searchAndPaginate.
 */
export function createVendorListItem(overrides: Partial<VendorListItem> = {}): VendorListItem {
  return {
    id: testIds.vendor(),
    vendorCode: 'VEN-2026-0001',
    name: 'Acme Florals',
    email: 'contact@acme.com',
    phone: '0400000000',
    status: 'ACTIVE',
    paymentTerms: 30,
    transactionCount: 0,
    ...overrides,
  };
}

/**
 * Creates a mock vendor with full details as returned by findByIdWithDetails.
 */
export function createVendorWithDetails(
  overrides: Partial<VendorWithDetails> = {},
): VendorWithDetails {
  return {
    id: testIds.vendor(),
    vendorCode: 'VEN-2026-0001',
    name: 'Acme Florals',
    email: 'contact@acme.com',
    phone: '0400000000',
    abn: '12345678901',
    status: 'ACTIVE',
    address: null,
    website: null,
    paymentTerms: 30,
    taxId: null,
    notes: null,
    transactionCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Creates mock vendor statistics.
 */
export function createVendorStatistics(
  overrides: Partial<VendorStatistics> = {},
): VendorStatistics {
  return {
    total: 50,
    active: 40,
    inactive: 8,
    suspended: 2,
    ...overrides,
  };
}
