'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, AlertCircle, Edit2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  useEmployeeById,
  useUpdateEmployee,
  useCreateEmployee,
} from '@/features/staff/employees/hooks/use-employees';
import { EmployeeForm } from './employee-form';
import { EmployeeView } from './employee-view';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, employeeSearchParamsDefaults } from '@/filters/employees/employee-filters';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@/schemas/employees';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmployeeStatusBadge } from './employee-status-badge';
import { CopyButton } from '@/components/shared/copy-button';

type DrawerMode = 'edit' | 'create';

export function EmployeeDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isEditingView, setIsEditingView] = useState<boolean>(false);

  const { data: employee, isLoading, error, isError } = useEmployeeById(id);

  const updateEmployee = useUpdateEmployee();
  const createEmployee = useCreateEmployee();

  const queryString = useQueryString(searchParams, employeeSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/staff/employees/${id}`) ?? false) : (open ?? false);

  // Compute isEditing based on mode - create mode is always editing
  const isEditing = mode === 'create' || isEditingView;

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        // Reset to view mode when closing
        setIsEditingView(false);
        setHasUnsavedChanges(false);

        if (id) {
          // Navigate back to list preserving filters
          const basePath = '/staff/employees';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString],
  );

  const handleCreate = useCallback(
    (data: CreateEmployeeInput) => {
      createEmployee.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createEmployee, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateEmployeeInput) => {
      updateEmployee.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setIsEditingView(false);
          // If we were in a sub-route /id, we stay there but exit edit mode
        },
      });
    },
    [updateEmployee],
  );

  const { title, status } = useMemo(() => {
    if (mode === 'create') {
      return {
        title: 'New Employee',
        status: null,
      };
    }

    return {
      title: employee ? `${employee.firstName} ${employee.lastName}` : 'Employee Details',
      status: employee?.status ?? null,
    };
  }, [mode, employee?.firstName, employee?.lastName, employee?.status]);

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Employee Details</DrawerTitle>
            </DrawerHeader>
            <Box className="p-6">Loading...</Box>
          </>
        ) : null}

        {isError ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <Box className="p-6 text-destructive">
              <p className="mt-4">Could not load employee details: {error?.message}</p>
            </Box>
          </>
        ) : null}

        {(employee && !isLoading && !isError) || mode === 'create' ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1">
                {employee ? (
                  <UserAvatar
                    user={{
                      name: `${employee.firstName} ${employee.lastName}`,
                      image: employee.avatarUrl,
                    }}
                    className="size-12"
                  />
                ) : null}
                <Box className="flex flex-col">
                  <Box className="flex items-center gap-2">
                    <DrawerTitle className="text-xl font-semibold tracking-tight">
                      {title}
                    </DrawerTitle>
                    {mode === 'edit' && hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1">
                    {status ? <EmployeeStatusBadge status={status} /> : null}
                    {employee ? (
                      <Box className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <span className="font-mono">{employee.id}</span>
                        <CopyButton value={employee.id} className="size-4 p-0 border-none" />
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              </Box>

              <Box className="flex items-center gap-2">
                {mode === 'edit' && !isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditingView(true)}
                  >
                    <Edit2 className="size-4" />
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="size-5" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </Button>
              </Box>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden">
              {isEditing ? (
                <EmployeeForm
                  employee={employee ?? undefined}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  isCreating={createEmployee.isPending}
                  isUpdating={updateEmployee.isPending}
                  onDirtyStateChange={setHasUnsavedChanges}
                  onClose={mode === 'create' ? onClose : () => setIsEditingView(false)}
                />
              ) : employee ? (
                <EmployeeView employee={employee} />
              ) : null}
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
