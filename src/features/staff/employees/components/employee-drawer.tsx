'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Save, AlertCircle, Mail, Phone, Edit2, Check } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useEmployeeById,
  useUpdateEmployee,
  useCreateEmployee,
} from '@/features/staff/employees/hooks/use-employees';
import { EmployeeForm } from './employee-form';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, employeeSearchParamsDefaults } from '@/filters/employees/employee-filters';
import type { CreateEmployeeFormValues, UpdateEmployeeFormValues } from '@/schemas/employees';
import { UserAvatar } from '@/components/shared/user-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { CopyButton } from '@/components/shared/copy-button';
import { format } from 'date-fns';

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
  const [isEditing, setIsEditing] = useState<boolean>(!id);

  const { data: employee, isLoading, error, isError } = useEmployeeById(id);

  const updateEmployee = useUpdateEmployee();
  const createEmployee = useCreateEmployee();

  const queryString = useQueryString(searchParams, employeeSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/staff/employees/${id}`) ?? false) : (open ?? false);

  // Sync isEditing with mode change
  useEffect(() => {
    setIsEditing(!id);
  }, [id]);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
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
    (data: CreateEmployeeFormValues) => {
      createEmployee.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createEmployee, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateEmployeeFormValues) => {
      updateEmployee.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setIsEditing(false);
          // If we were in a sub-route /id, we stay there but exit edit mode
        },
      });
    },
    [updateEmployee],
  );

  const getDrawerHeader = () => {
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
  };

  const { title, status } = getDrawerHeader();

  return (
    <Drawer key={id} open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? <Box className="p-6">Loading...</Box> : null}

        {isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load employee details: {error?.message}</p>
          </Box>
        ) : null}

        {(employee && !isLoading && !isError) || mode === 'create' ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1">
                {employee && (
                  <UserAvatar
                    user={{
                      name: `${employee.firstName} ${employee.lastName}`,
                      image: employee.avatarUrl,
                    }}
                    className="size-12"
                  />
                )}
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
                    {status && <StatusBadge status={status as any} />}
                    {employee && (
                      <Box className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <span className="font-mono">{employee.id}</span>
                        <CopyButton value={employee.id} className="size-4 p-0 border-none" />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box className="flex items-center gap-2">
                {mode === 'edit' && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="size-4" />
                    Edit
                  </Button>
                )}
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
              {isEditing || mode === 'create' ? (
                <EmployeeForm
                  employee={employee}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  isCreating={createEmployee.isPending}
                  isUpdating={updateEmployee.isPending}
                  onDirtyStateChange={setHasUnsavedChanges}
                  onClose={mode === 'create' ? onClose : () => setIsEditing(false)}
                />
              ) : (
                <Box className="p-6 space-y-8">
                  <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Box className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Contact Information
                      </h3>
                      <Box className="space-y-3">
                        <Box className="flex items-center gap-3 text-sm">
                          <Mail className="size-4 text-muted-foreground" />
                          <a href={`mailto:${employee?.email}`} className="hover:underline">
                            {employee?.email}
                          </a>
                        </Box>
                        {employee?.phone && (
                          <Box className="flex items-center gap-3 text-sm">
                            <Phone className="size-4 text-muted-foreground" />
                            <a href={`tel:${employee.phone}`} className="hover:underline">
                              {employee.phone}
                            </a>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Box className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Basic Information
                      </h3>
                      <Box className="space-y-3">
                        <Box className="flex justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Gender</span>
                          <span className="font-medium capitalize">
                            {employee?.gender?.toLowerCase() ?? 'N/A'}
                          </span>
                        </Box>
                        <Box className="flex justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Date of Birth</span>
                          <span className="font-medium">
                            {employee?.dob ? format(new Date(employee.dob), 'PPPP') : 'N/A'}
                          </span>
                        </Box>
                        <Box className="flex justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Hourly Rate</span>
                          <span className="font-medium text-primary">
                            {new Intl.NumberFormat('en-AU', {
                              style: 'currency',
                              currency: 'AUD',
                            }).format(employee?.rate ?? 0)}
                          </span>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
