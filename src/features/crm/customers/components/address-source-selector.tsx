'use client';

import { Building2, MapPin } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Organization } from '@/components/shared/organization-select';

function hasCompleteAddress(org: Organization | null): boolean {
  return Boolean(org?.address && org?.city);
}

function formatOrganizationAddress(org: Organization | null): string {
  if (!org) {
    return '';
  }

  const parts = [org.address, org.city, org.state, org.postcode, org.country].filter(Boolean);
  return parts.join(', ');
}

export function AddressSourceSelector({
  organization,
  useOrganizationAddress,
  onValueChange,
  disabled = false,
}: {
  organization: Organization | null;
  useOrganizationAddress: boolean;
  onValueChange: (useOrgAddress: boolean) => void;
  disabled?: boolean;
}) {
  const orgHasAddress = hasCompleteAddress(organization);

  return (
    <Box className="space-y-3">
      <Label className="text-sm font-medium">Address Source</Label>
      <RadioGroup
        value={useOrganizationAddress ? 'organization' : 'custom'}
        onValueChange={(value) => onValueChange(value === 'organization')}
        disabled={disabled}
        className="space-y-2"
      >
        {/* Organization Address Option */}
        <Box
          className={`flex items-start space-x-3 p-3 rounded-md border ${
            !orgHasAddress ? 'opacity-50' : ''
          }`}
        >
          <RadioGroupItem value="organization" id="address-org" disabled={!orgHasAddress} />
          <Box className="flex-1">
            <Label htmlFor="address-org" className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-4 w-4" />
              Use organization address
            </Label>
            {orgHasAddress ? (
              <p className="text-sm text-muted-foreground mt-1">
                {formatOrganizationAddress(organization)}
              </p>
            ) : (
              <p className="text-sm text-destructive mt-1">
                Organization has no address configured
              </p>
            )}
          </Box>
        </Box>

        {/* Custom Address Option */}
        <Box className="flex items-start space-x-3 p-3 rounded-md border">
          <RadioGroupItem value="custom" id="address-custom" />
          <Box className="flex-1">
            <Label htmlFor="address-custom" className="flex items-center gap-2 cursor-pointer">
              <MapPin className="h-4 w-4" />
              Use custom address
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a specific address for this customer
            </p>
          </Box>
        </Box>
      </RadioGroup>
    </Box>
  );
}
