'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Employee } from '@/prisma/client';
import { Edit, Ellipsis, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import { SearchParams } from 'nuqs/server';

export function EmployeeAction({
  employee,
  onDelete,
  onSendEmail,
  isDeleting = false,
  isSending = false,
  searchParams,
}: {
  employee: Employee;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
  isDeleting?: boolean;
  isSending?: boolean;
  searchParams: SearchParams;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(
    (employeeId: string) => {
      startTransition(() => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });

        const url = `/employees/${employeeId}?${params.toString()}`;
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
    // setShowDeleteConfirm(false);
  };

  const stopPropagation = (e: React.MouseEvent | Event) => e.stopPropagation();
  const isActionPending = isDeleting || isSending;

  return (
    <>
      <AlertModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild onClick={stopPropagation}>
          <Button
            variant="ghost"
            className="group aspect-square p-1.5 h-8 w-8 data-[state=open]:border-gray-300 data-[state=open]:bg-gray-50 hover:dark:border-gray-700 data-[state=open]:dark:border-gray-700 data-[state=open]:dark:bg-gray-900"
          >
            <span className="sr-only">Open menu</span>
            <Ellipsis
              className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-data-[state=open]:text-gray-700 group-hover:dark:text-gray-300 group-data-[state=open]:dark:text-gray-300"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleClick(employee.id)} className="cursor-pointer">
            <Edit className="mr-2 size-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteRequest}
            disabled={isDeleting}
            className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
          >
            <Trash className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
