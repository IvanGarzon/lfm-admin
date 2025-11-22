'use client';

import { useMemo, useCallback } from 'react';
import { searchParams } from '@/filters/employees/employee-filters';
import { useQueryState } from 'nuqs';

export function useEmployeeTableFilters() {
  const [page, setPage] = useQueryState('page', searchParams.page.withDefault(1));
  const [perPage, setPerPage] = useQueryState('perPage', searchParams.perPage.withDefault(20));
  const [sortBy, setSortBy] = useQueryState('sortBy', searchParams.sortBy.withDefault('asc'));

  const [search, setSearch] = useQueryState(
    'search',
    searchParams.search.withOptions({ shallow: false, throttleMs: 3000 }).withDefault(''),
  );

  const [alphabet, setAlphabet] = useQueryState(
    'alphabet',
    searchParams.alphabet.withOptions({ shallow: false }).withDefault(''),
  );

  const [gender, setGender] = useQueryState(
    'gender',
    searchParams.gender.withOptions({ shallow: false }),
  );

  const [status, setStatus] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setGender(null);
    setStatus(null);

    setPage(1);
  }, [setSearch, setGender, setStatus, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!search || !!gender || !!status;
  }, [search, gender, status]);

  return {
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    alphabet,
    setAlphabet,
    gender,
    setGender,
    status,
    setStatus,
    resetFilters,
    isAnyFilterActive,
  };
}
