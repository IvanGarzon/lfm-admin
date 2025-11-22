'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { SearchParams } from 'nuqs/server';

import { EmployeesTable } from '@/features/employees/employees-table';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Modal } from '@/components/ui/modal';
import { EmployeeForm } from '@/features/employees/employee-form';
import { EmployeesListSkeleton } from '@/features/employees/employees-list-skeleton';
import { useCreateEmployee, useDeleteEmployee } from '@/hooks/use-employees';
import type { CreateEmployeeFormValues } from '@/schemas/employees';

import { baseColumns, createActionsColumn } from '@/features/employees/employees-table/columns';
import { EmployeePagination } from '@/types/employee';

export function EmployeesList({
  data,
  searchParams: serverSearchParams,
}: {
  data: EmployeePagination;
  searchParams: SearchParams;
}) {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const router = useRouter();

  const { mutate: createEmployeeMutation, isPending: isPendingEmployeeCreate } = useMutation({
    ...useCreateEmployee(),
    onSuccess: () => {
      toast.success('Employee has been created', {
        description: format(new Date(), "EEEE, MMMM dd, yyyy 'at' h:mm a"),
      });

      // Refresh the server-side data
      router.refresh();
    },
  });

  const {
    mutate: deleteEmployeeMutation,
    isPending: isPendingDelete,
    variables: deleteVariables,
  } = useMutation({
    ...useDeleteEmployee(),
    onSuccess: () => {
      toast.success('Employee has been deleted', {
        description: format(new Date(), "EEEE, MMMM dd, yyyy 'at' h:mm a"),
      });

      // Refresh the server-side data
      router.refresh();
    },
  });

  const handleCreateEmployee = useCallback(
    (data: CreateEmployeeFormValues) => {
      createEmployeeMutation(data);
      setOpenModal(false);
    },
    [createEmployeeMutation],
  );

  const handleAddEmployeeModal = useCallback(() => {
    setOpenModal((prev) => !prev);
  }, []);

  const handleDeleteEmployee = useCallback(
    (id: string) => {
      deleteEmployeeMutation(id);
    },
    [deleteEmployeeMutation],
  );

  const handleSendEmail = useCallback((id: string) => {
    console.log('Send email to employee:', id);
    // TODO: Implement email sending logic
  }, []);

  const isEmployeeDeleting = useCallback(
    (id: string) => {
      return isPendingDelete && deleteVariables === id;
    },
    [isPendingDelete, deleteVariables],
  );

  const isEmployeeSending = useCallback((id: string) => {
    // TODO: Implement email sending status check
    return false;
  }, []);

  const columns = useMemo(
    () => [
      ...baseColumns,
      createActionsColumn({
        onDelete: handleDeleteEmployee,
        onSendEmail: handleSendEmail,
        isDeleting: isEmployeeDeleting,
        isSending: isEmployeeSending,
        searchParams: serverSearchParams,
      }),
    ],
    [
      handleDeleteEmployee,
      handleSendEmail,
      isEmployeeDeleting,
      isEmployeeSending,
      serverSearchParams,
    ],
  );

  return (
    <>
      <Box className="space-y-4">
        <Box className="flex items-center justify-between">
          <Heading title="Employees list" description="Manage employees" />
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={handleAddEmployeeModal}
            isLoading={false}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add employee</span>
          </Button>
        </Box>

        <Separator />

        <Card>
          {data && (
            <EmployeesTable
              columns={columns}
              data={data.items}
              totalItems={data.pagination.totalItems}
            />
          )}
        </Card>
      </Box>

      <Modal
        title="Are you sure?"
        description="This action cannot be undone."
        isOpen={openModal}
        onClose={handleAddEmployeeModal}
      >
        <Box className="flex w-full items-center justify-end space-x-2 pt-6">
          <EmployeeForm onCreate={handleCreateEmployee} isUpdating={isPendingEmployeeCreate} />
        </Box>
      </Modal>
    </>
  );
}
