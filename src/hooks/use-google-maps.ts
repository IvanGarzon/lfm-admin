'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { env } from '@/env';

type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type UseGoogleMapsReturn = {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  getPlacePredictions: (input: string) => Promise<PlacePrediction[]>;
  getPlaceDetails: (placeId: string) => Promise<google.maps.places.Place | null>;
};

type PlacesLibrary = google.maps.PlacesLibrary;

// Track if options have been set
let optionsSet = false;
let placesLibraryPromise: Promise<PlacesLibrary> | null = null;

function ensureOptions(): void {
  if (!optionsSet) {
    setOptions({
      key: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      v: 'weekly',
    });
    optionsSet = true;
  }
}

async function loadPlacesLibrary(): Promise<PlacesLibrary> {
  if (!placesLibraryPromise) {
    ensureOptions();
    placesLibraryPromise = importLibrary('places');
  }
  return placesLibraryPromise;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const placesLibraryRef = useRef<PlacesLibrary | null>(null);

  useEffect(() => {
    let mounted = true;

    loadPlacesLibrary()
      .then((placesLibrary) => {
        if (mounted) {
          placesLibraryRef.current = placesLibrary;
          setIsLoaded(true);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load Google Maps'));
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getPlacePredictions = useCallback(
    async (input: string): Promise<PlacePrediction[]> => {
      if (!isLoaded || !placesLibraryRef.current || !input.trim()) {
        return [];
      }

      try {
        // Use the new AutocompleteSuggestion API
        const { suggestions } =
          await placesLibraryRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            includedRegionCodes: ['au'],
          });

        const results: PlacePrediction[] = [];
        for (const suggestion of suggestions) {
          // Check if this is a place prediction (has placePrediction property)
          if (suggestion.placePrediction) {
            const pred = suggestion.placePrediction;
            results.push({
              placeId: pred.placeId,
              description: pred.text.text,
              mainText: pred.mainText?.text || '',
              secondaryText: pred.secondaryText?.text || '',
            });
          }
        }
        return results;
      } catch (err) {
        console.error('Failed to fetch predictions:', err);
        return [];
      }
    },
    [isLoaded],
  );

  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<google.maps.places.Place | null> => {
      if (!isLoaded || !placesLibraryRef.current) {
        return null;
      }

      try {
        // Use the new Place API
        const place = new placesLibraryRef.current.Place({
          id: placeId,
        });

        await place.fetchFields({
          fields: [
            'addressComponents',
            'formattedAddress',
            'location',
            'adrFormatAddress',
            'displayName',
          ],
        });

        return place;
      } catch (err) {
        console.error('Failed to fetch place details:', err);
        return null;
      }
    },
    [isLoaded],
  );

  return {
    isLoaded,
    isLoading,
    error,
    getPlacePredictions,
    getPlaceDetails,
  };
}
