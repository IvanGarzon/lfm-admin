'use client';

import { useCallback, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import usePlacesAutocompleteService from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import { Command, CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';

interface AddressAutoCompleteInputProps {
  selectedPlaceId: string;
  onPlaceSelect: (placeId: string) => void;
  showInlineError?: boolean;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  placeholder?: string;
  showMapIcon?: boolean;
  mapIconClass?: string;
}

export function AddressAutoCompleteInput(props: AddressAutoCompleteInputProps) {
  const {
    selectedPlaceId,
    onPlaceSelect,
    showInlineError,
    searchInput,
    setSearchInput,
    placeholder,
    showMapIcon,
    mapIconClass,
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } =
    usePlacesAutocompleteService({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      debounce: 500,
      options: {
        componentRestrictions: { country: 'au' },
      },
    });

  const handleInputChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (value) {
        getPlacePredictions({ input: value });
      }
    },
    [setSearchInput, getPlacePredictions],
  );

  return (
    <Command shouldFilter={false} onKeyDown={handleKeyDown} className="overflow-visible">
      <div className="flex w-full items-center justify-between rounded-md border text-sm relative">
        {showMapIcon ? (
          <MapPin
            style={{ left: '6px' }}
            className={`absolute top-1 -translate-y-1 h-4 w-4 shrink-0 text-muted-foreground ${
              mapIconClass || ''
            }`}
          />
        ) : null}
        <CommandPrimitive.Input
          value={searchInput}
          onValueChange={handleInputChange}
          onBlur={close}
          onFocus={open}
          placeholder={placeholder || 'Enter address'}
          className={`w-full py-2 px-8 outline-none`}
        />
      </div>

      {searchInput !== '' && !isOpen && !selectedPlaceId && showInlineError && (
        <div className="pt-1 text-sm text-red-500">Select a valid address from the list</div>
      )}

      {isOpen ? (
        <div className="relative animate-in fade-in-0 zoom-in-95 h-auto">
          <CommandList>
            <div className="absolute top-1.5 z-50 w-full">
              <CommandGroup className="relative h-auto z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md bg-background">
                {isPlacePredictionsLoading ? (
                  <div className="h-28 flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {placePredictions.map((prediction) => (
                      <CommandPrimitive.Item
                        value={prediction.description}
                        onSelect={() => {
                          setSearchInput('');
                          onPlaceSelect(prediction.place_id);
                        }}
                        className="flex select-text flex-col cursor-pointer gap-0.5 h-max p-2 px-3 rounded-md text-sm aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground items-start"
                        key={prediction.place_id}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {prediction.description}
                      </CommandPrimitive.Item>
                    ))}
                  </>
                )}

                <CommandEmpty>
                  {!isPlacePredictionsLoading && placePredictions.length === 0 ? (
                    <div className="py-2 flex items-center justify-center">
                      {searchInput === '' ? 'Please enter an address' : 'No address found'}
                    </div>
                  ) : null}
                </CommandEmpty>
              </CommandGroup>
            </div>
          </CommandList>
        </div>
      ) : null}
    </Command>
  );
}
