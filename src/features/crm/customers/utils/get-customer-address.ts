import type { AddressInput } from '@/schemas/address';

interface OrganizationAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface CustomerAddressInfo {
  address: AddressInput | null;
  useOrganizationAddress: boolean;
  organization?: OrganizationAddress | null;
}

/**
 * Get the effective address for a customer.
 * Returns the organization address if useOrganizationAddress is true,
 * otherwise returns the customer's own address.
 */
export function getEffectiveAddress(customer: CustomerAddressInfo): string {
  if (customer.useOrganizationAddress && customer.organization) {
    const org = customer.organization;
    const parts = [org.address, org.city, org.state, org.postcode, org.country].filter(Boolean);
    return parts.join(', ');
  }

  return customer.address?.formattedAddress || '';
}

/**
 * Determine the source of a customer's address.
 */
export function getAddressSource(
  customer: CustomerAddressInfo,
): 'organization' | 'custom' | 'none' {
  if (customer.useOrganizationAddress && customer.organization) {
    return 'organization';
  }
  if (customer.address?.formattedAddress) {
    return 'custom';
  }
  return 'none';
}

/**
 * Check if a customer has a valid address (either own or organization's).
 */
export function hasValidAddress(customer: CustomerAddressInfo): boolean {
  if (customer.useOrganizationAddress) {
    return Boolean(customer.organization?.address && customer.organization?.city);
  }
  return Boolean(customer.address?.formattedAddress);
}
