'use client';

import { Button } from '@/components/ui/button';
import { useCallback, useTransition } from 'react';

interface DataTableSearchProps {
  alphabetQuery: string;
  setAlphabetQuery: (
    value: string | ((old: string) => string | null) | null,
    options?: any | undefined,
  ) => Promise<URLSearchParams>;
  setPage: <Shallow>(
    value: number | ((old: number) => number | null) | null,
    options?: any | undefined,
  ) => Promise<URLSearchParams>;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function DataTableAlphabeticalFilter({
  alphabetQuery,
  setAlphabetQuery,
  setPage,
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();

  // Memoized setAlphabetQuery and setPage to prevent unnecessary re-renders
  const handleLetterClick = useCallback(
    (letter: string) => {
      startTransition(() => {
        const newQuery = alphabetQuery === letter ? null : letter;
        setAlphabetQuery(newQuery);
        setPage(1);
      });
    },
    [alphabetQuery, setAlphabetQuery, setPage],
  );

  return (
    <div className="flex flex-wrap gap-1">
      {ALPHABET.map((letter) => {
        const isSelected = letter === alphabetQuery;
        return (
          <Button
            key={letter}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className={`h-8 w-8 p-0 ${isSelected ? 'bg-primary text-white' : ''}`}
            onClick={() => handleLetterClick(letter)}
            disabled={isLoading}
          >
            {letter}
          </Button>
        );
      })}
    </div>
  );
}
