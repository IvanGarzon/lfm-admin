'use client';

import { useCallback, useState, useEffect } from 'react';
import { Delete, Loader2, Search } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/use-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { AddressAutoCompleteInput } from './address-autocomplete-input';
import { emptyAddress, type AddressInput } from '@/schemas/address';
import { updateAndFormatAddress } from './address-utils';

interface AddressInlineFieldsProps {
  address: AddressInput;
  setAddress: (address: AddressInput) => void;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  showInlineError?: boolean;
  placeholder?: string;
  showMapIcon?: boolean;
  mapIconClass?: string;
  disabled?: boolean;
}

export function AddressInlineFields(props: AddressInlineFieldsProps) {
  const {
    address,
    setAddress,
    showInlineError = true,
    searchInput,
    setSearchInput,
    placeholder,
    showMapIcon = true,
    mapIconClass,
    disabled = false,
  } = props;

  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adrAddress, setAdrAddress] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(!address.formattedAddress);

  const { isLoaded, getPlaceDetails } = useGoogleMaps();

  // Sync search mode with address state
  useEffect(() => {
    if (!address.formattedAddress) {
      setIsSearchMode(true);
    }
  }, [address.formattedAddress]);

  const handlePlaceSelect = useCallback(
    async (placeId: string) => {
      if (!isLoaded) return;

      setSelectedPlaceId(placeId);
      setIsLoading(true);

      try {
        const place = await getPlaceDetails(placeId);

        if (place) {
          const addressComponents = place.addressComponents || [];

          const getComponent = (
            type: string,
            nameType: 'longText' | 'shortText' = 'longText',
          ): string => {
            const component = addressComponents.find((c) => c.types.includes(type));
            return component?.[nameType] || '';
          };

          const streetNumber = getComponent('street_number');
          const route = getComponent('route');
          const subpremise = getComponent('subpremise');

          const mainAddress = `${streetNumber} ${route}`.trim();
          const fullAddress1 = subpremise ? `${subpremise}/${mainAddress}` : mainAddress;

          const lat = place.location?.lat() || 0;
          const lng = place.location?.lng() || 0;

          setAddress({
            address1: fullAddress1,
            address2: '',
            formattedAddress: place.formattedAddress || '',
            city: getComponent('locality') || getComponent('sublocality'),
            region: getComponent('administrative_area_level_1', 'shortText'),
            postalCode: getComponent('postal_code'),
            country: getComponent('country'),
            lat,
            lng,
          });

          setAdrAddress(place.adrFormatAddress || '');
          setIsSearchMode(false);
        }
      } catch (error) {
        console.error('Failed to fetch place details:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoaded, getPlaceDetails, setAddress],
  );

  const handleClear = useCallback(() => {
    setSelectedPlaceId('');
    setAdrAddress('');
    setAddress(emptyAddress);
    setSearchInput('');
    setIsSearchMode(true);
  }, [setAddress, setSearchInput]);

  const handleFieldChange = useCallback(
    (field: keyof AddressInput, value: string) => {
      const newAddress = { ...address, [field]: value };

      // Update formatted address when address fields change
      if (['address1', 'address2', 'city', 'region', 'postalCode'].includes(field)) {
        const newFormattedAddress = updateAndFormatAddress(adrAddress, {
          'street-address': newAddress.address1 || '',
          address2: newAddress.address2 || '',
          locality: newAddress.city || '',
          region: newAddress.region || '',
          'postal-code': newAddress.postalCode || '',
        });
        newAddress.formattedAddress = newFormattedAddress;
      }

      setAddress(newAddress);
    },
    [address, adrAddress, setAddress],
  );

  const handleSearchAgain = useCallback(() => {
    setIsSearchMode(true);
    setSearchInput('');
  }, [setSearchInput]);

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading address details...</span>
      </Box>
    );
  }

  // Show search input if no address is selected
  if (isSearchMode) {
    return (
      <AddressAutoCompleteInput
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        selectedPlaceId={selectedPlaceId}
        onPlaceSelect={handlePlaceSelect}
        showInlineError={showInlineError}
        placeholder={placeholder}
        showMapIcon={showMapIcon}
        mapIconClass={mapIconClass}
      />
    );
  }

  // Show inline address fields after selection
  return (
    <Box className="space-y-4 w-full overflow-hidden">
      {/* Header with formatted address and actions */}
      <Box className="flex items-center gap-1 p-3 bg-muted/50 rounded-md border min-w-0">
        <Box className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium truncate">{address.formattedAddress}</p>
          <p className="text-xs text-muted-foreground truncate">
            Edit the fields below to correct any details
          </p>
        </Box>
        <Button
          type="button"
          onClick={handleSearchAgain}
          size="icon"
          variant="outline"
          className="shrink-0"
          disabled={disabled}
          title="Search again"
        >
          <Search className="size-4" />
        </Button>
        <Button
          type="button"
          onClick={handleClear}
          size="icon"
          variant="outline"
          className="shrink-0"
          disabled={disabled}
          title="Clear address"
        >
          <Delete className="size-4" />
        </Button>
      </Box>

      {/* Address fields */}
      <FieldGroup>
        <Field>
          <FieldContent>
            <FieldLabel htmlFor="inline-address1">Address line 1 *</FieldLabel>
          </FieldContent>
          <Input
            id="inline-address1"
            value={address.address1}
            onChange={(e) => handleFieldChange('address1', e.target.value)}
            placeholder="Street address"
            disabled={disabled}
          />
          {!address.address1 && <FieldError errors={[{ message: 'Address line 1 is required' }]} />}
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldContent>
            <FieldLabel htmlFor="inline-address2">
              Address line 2 <span className="text-xs text-muted-foreground">(Optional)</span>
            </FieldLabel>
          </FieldContent>
          <Input
            id="inline-address2"
            value={address.address2 ?? ''}
            onChange={(e) => handleFieldChange('address2', e.target.value)}
            placeholder="Apartment, suite, unit, etc."
            disabled={disabled}
          />
        </Field>
      </FieldGroup>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="inline-city">City *</FieldLabel>
            </FieldContent>
            <Input
              id="inline-city"
              value={address.city ?? ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="City"
              disabled={disabled}
            />
            {!address.city && <FieldError errors={[{ message: 'City is required' }]} />}
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="inline-region">State / Region *</FieldLabel>
            </FieldContent>
            <Input
              id="inline-region"
              value={address.region ?? ''}
              onChange={(e) => handleFieldChange('region', e.target.value)}
              placeholder="State or region"
              disabled={disabled}
            />
            {!address.region && <FieldError errors={[{ message: 'State/Region is required' }]} />}
          </Field>
        </FieldGroup>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="inline-postalCode">Postal Code *</FieldLabel>
            </FieldContent>
            <Input
              id="inline-postalCode"
              value={address.postalCode ?? ''}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              placeholder="Postal code"
              disabled={disabled}
            />
            {!address.postalCode && (
              <FieldError errors={[{ message: 'Postal code is required' }]} />
            )}
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="inline-country">Country</FieldLabel>
            </FieldContent>
            <Input
              id="inline-country"
              value={address.country ?? ''}
              disabled
              placeholder="Country"
            />
          </Field>
        </FieldGroup>
      </Box>
    </Box>
  );
}
