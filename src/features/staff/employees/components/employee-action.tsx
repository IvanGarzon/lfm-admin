'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EmployeeListItem } from '@/features/staff/employees/types';
import { Pencil, MoreHorizontal, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import { SearchParams } from 'nuqs/server';

export function EmployeeAction({
  employee,
  onDelete,
  isDeleting = false,
  searchParams,
}: {
  employee: EmployeeListItem;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  searchParams: SearchParams;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleClick = useCallback(
    (employeeId: string) => {
      startTransition(() => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });

        const url = `/staff/employees/${employeeId}?${params.toString()}`;
        router.push(url, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const handleDeleteRequest = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(employee.id);
  };

  return (
    <>
      <AlertModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="h-8 w-8 p-0" aria-label="Open menu">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleClick(employee.id)} className="cursor-pointer">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Update Employee
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteRequest}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" aria-hidden="true" />
            Delete Employee
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
