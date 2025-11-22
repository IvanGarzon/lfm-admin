'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  format,
  isSameMonth,
  startOfToday,
} from 'date-fns';

export type StatsDateFilter = {
  startDate?: Date;
  endDate?: Date;
};

type InvoiceStatsFiltersProps = {
  onFilterChange: (filter: StatsDateFilter) => void;
};

function getMonthDisplay(date: Date): string {
  const now = startOfToday();

  if (isSameMonth(date, now)) {
    return 'This month';
  }

  if (isSameMonth(date, subMonths(now, 1))) {
    return 'Last month';
  }

  return format(date, 'MMMM yyyy');
}

function getCurrentLabel(date: Date): string {
  const now = startOfToday();

  if (isSameMonth(date, now)) {
    return `Current ${format(now, 'MMMM')}`;
  }

  return format(date, 'MMMM');
}

export function InvoiceStatsFilters({ onFilterChange }: InvoiceStatsFiltersProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => startOfMonth(startOfToday()));

  const updateFilter = useCallback(
    (date: Date) => {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      onFilterChange({ startDate, endDate });
    },
    [onFilterChange],
  );

  useEffect(() => {
    updateFilter(currentDate);
  }, [currentDate, updateFilter]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const isCurrentMonth = () => {
    return isSameMonth(currentDate, startOfToday());
  };

  return (
    <Box className="flex items-center justify-between p-4">
      <Box className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{getCurrentLabel(currentDate)}</span>
        <span className="text-sm font-medium">{getMonthDisplay(currentDate)}</span>
      </Box>

      <Box className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Box>
    </Box>
  );
}
