'use client';

import * as React from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  value?: Date;
  formatString?: string;
  onChange?: (date: Date) => void;
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      startYear = getYear(new Date()) - 100,
      endYear = getYear(new Date()) + 10,
      value,
      formatString = 'PPP',
      onChange,
      ...props
    },
    ref,
  ) => {
    const [date, setDate] = React.useState<Date | undefined>(value);

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    React.useEffect(() => {
      if (value) {
        setDate(value);
      }
    }, [value]);

    const handleMonthChange = (month: string) => {
      if (date) {
        const newDate = setMonth(date, months.indexOf(month));
        setDate(newDate);
      }
    };

    const handleYearChange = (year: string) => {
      if (date) {
        const newDate = setYear(date, parseInt(year));
        setDate(newDate);
      }
    };

    const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        setDate(selectedDate);
        onChange?.(selectedDate); // Notify form about the change
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, formatString) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Box className="flex justify-between p-2">
            <Select
              onValueChange={handleMonthChange}
              value={date ? months[getMonth(date)] : undefined}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={handleYearChange}
              value={date ? getYear(date).toString() : undefined}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            month={date}
            onMonthChange={setDate}
            initialFocus
            {...props}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = 'DatePicker';
