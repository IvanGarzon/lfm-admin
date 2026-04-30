'use client';

import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import type { EmployeeListItem } from '@/features/staff/employees/types';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { searchParams, employeeSearchParamsDefaults } from '@/filters/employees/employee-filters';
import { useQueryString } from '@/hooks/use-query-string';

export function EmployeeActions({
  employee,
  onDelete,
}: {
  employee: EmployeeListItem;
  onDelete: (id: string) => void;
}) {
  const queryString = useQueryString(searchParams, employeeSearchParamsDefaults);
  const basePath = `/staff/employees/${employee.id}`;
  const employeeUrl = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Box className="flex items-center gap-1 justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="h-8 w-8 p-0" aria-label="Open menu">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={employeeUrl}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Update Employee
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(employee.id)}
            className="text-destructive focus:text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" aria-hidden="true" />
            Delete employee
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
}
