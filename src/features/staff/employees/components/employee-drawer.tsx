'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  AlertCircle,
  Mail,
  Phone,
  Edit2,
  Calendar,
  DollarSign,
  Cake,
  ExternalLink,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        // Reset to view mode when closing
        setIsEditing(false);
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
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
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
                <Box className="p-6 space-y-6 overflow-y-auto">
                  {/* Compensation Highlight Card */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                      <Box className="flex items-center justify-between">
                        <Box>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Hourly Rate
                          </p>
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('en-AU', {
                              style: 'currency',
                              currency: 'AUD',
                            }).format(employee?.rate ?? 0)}
                          </p>
                        </Box>
                        <Box className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                          <DollarSign className="size-6 text-emerald-600 dark:text-emerald-400" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Contact Information Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Mail className="size-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <Box className="flex items-center gap-3">
                          <Box className="p-2 rounded-lg bg-muted">
                            <Mail className="size-4 text-muted-foreground" />
                          </Box>
                          <Box>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Email
                            </p>
                            <a
                              href={`mailto:${employee?.email}`}
                              className="text-sm font-medium hover:text-primary transition-colors"
                            >
                              {employee?.email}
                            </a>
                          </Box>
                        </Box>
                        <Button variant="ghost" size="icon" asChild className="size-8">
                          <a href={`mailto:${employee?.email}`}>
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      </Box>

                      {employee?.phone && (
                        <Box className="flex items-center justify-between py-2">
                          <Box className="flex items-center gap-3">
                            <Box className="p-2 rounded-lg bg-muted">
                              <Phone className="size-4 text-muted-foreground" />
                            </Box>
                            <Box>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                Phone
                              </p>
                              <a
                                href={`tel:${employee.phone}`}
                                className="text-sm font-medium hover:text-primary transition-colors"
                              >
                                {employee.phone}
                              </a>
                            </Box>
                          </Box>
                          <Button variant="ghost" size="icon" asChild className="size-8">
                            <a href={`tel:${employee.phone}`}>
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Details Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Gender</span>
                        <span className="text-sm font-medium capitalize">
                          {employee?.gender?.toLowerCase() ?? 'Not specified'}
                        </span>
                      </Box>
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={employee?.status as any} />
                      </Box>
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Date of Birth</span>
                        <Box className="flex items-center gap-2 text-sm font-medium">
                          <Cake className="size-3.5 text-muted-foreground" />
                          {employee?.dob
                            ? format(new Date(employee.dob), 'MMM d, yyyy')
                            : 'Not specified'}
                        </Box>
                      </Box>
                      <Box className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Employee since</span>
                        <Box className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          {employee?.createdAt
                            ? format(new Date(employee.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
