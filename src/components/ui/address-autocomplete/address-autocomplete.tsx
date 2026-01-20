'use client';

import { useCallback, useState } from 'react';
import { Delete, Pencil } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/use-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressDialog } from './address-dialog';
import { AddressAutoCompleteInput } from './address-autocomplete-input';
import { emptyAddress, type AddressInput } from '@/schemas/address';

interface AddressAutoCompleteProps {
  address: AddressInput;
  setAddress: (address: AddressInput) => void;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  dialogTitle: string;
  showInlineError?: boolean;
  placeholder?: string;
  showMapIcon?: boolean;
  mapIconClass?: string;
}

export function AddressAutoComplete(props: AddressAutoCompleteProps) {
  const {
    address,
    setAddress,
    dialogTitle,
    showInlineError = true,
    searchInput,
    setSearchInput,
    placeholder,
    showMapIcon = true,
    mapIconClass,
  } = props;

  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adrAddress, setAdrAddress] = useState('');

  const { isLoaded, getPlaceDetails } = useGoogleMaps();

  const handlePlaceSelect = useCallback(
    async (placeId: string) => {
      if (!isLoaded) return;

      setSelectedPlaceId(placeId);
      setIsLoading(true);

      try {
        const place = await getPlaceDetails(placeId);

        if (place) {
          const addressComponents = place.addressComponents || [];

          // Helper to get address component by type
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

          // Get location coordinates
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

          // Use adrFormatAddress from new API (may be undefined)
          setAdrAddress(place.adrFormatAddress || '');
          setIsOpen(true);
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
  }, [setAddress]);

  return (
    <>
      {selectedPlaceId !== '' || address.formattedAddress ? (
        <div className="flex items-center gap-2">
          <Input value={address?.formattedAddress} readOnly />
          <AddressDialog
            isLoading={isLoading}
            dialogTitle={dialogTitle}
            adrAddress={adrAddress}
            address={address}
            setAddress={setAddress}
            open={isOpen}
            setOpen={setIsOpen}
          >
            <Button disabled={isLoading} size="icon" variant="outline" className="shrink-0">
              <Pencil className="size-4" />
            </Button>
          </AddressDialog>
          <Button
            type="reset"
            onClick={handleClear}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Delete className="size-4" />
          </Button>
        </div>
      ) : (
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
      )}
    </>
  );
}
