'use client';

import { useCallback, useState } from 'react';
import { Delete, Pencil, MapPin } from 'lucide-react';
import usePlacesAutocompleteService from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddressDialog from './address-dialog';
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

  const { placesService } = usePlacesAutocompleteService({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    debounce: 500,
    language: 'en',
    options: {
      componentRestrictions: { country: 'au' },
    },
  });

  const handlePlaceSelect = useCallback(
    (placeId: string) => {
      if (!placesService) return;

      setSelectedPlaceId(placeId);
      setIsLoading(true);

      placesService.getDetails(
        {
          placeId,
          fields: ['address_components', 'formatted_address', 'geometry', 'adr_address'],
        },
        (
          place: {
            address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
            formatted_address?: string;
            geometry?: { location?: { lat: () => number; lng: () => number } };
            adr_address?: string;
          } | null,
          status: string,
        ) => {
          setIsLoading(false);

          if (status === 'OK' && place) {
            const addressComponents = place.address_components || [];

            const getComponent = (
              type: string,
              nameType: 'long_name' | 'short_name' = 'long_name',
            ) => addressComponents.find((c) => c.types.includes(type))?.[nameType] || '';

            const streetNumber = getComponent('street_number');
            const route = getComponent('route');
            const subpremise = getComponent('subpremise');

            const mainAddress = `${streetNumber} ${route}`.trim();
            const fullAddress1 = subpremise ? `${subpremise}/${mainAddress}` : mainAddress;

            setAddress({
              address1: fullAddress1,
              address2: '',
              formattedAddress: place.formatted_address || '',
              city: getComponent('locality') || getComponent('sublocality'),
              region: getComponent('administrative_area_level_1', 'short_name'),
              postalCode: getComponent('postal_code'),
              country: getComponent('country'),
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            });

            setAdrAddress(place.adr_address || '');
            setIsOpen(true);
          }
        },
      );
    },
    [placesService, setAddress],
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
