'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { EmployeeForm } from '@/features/employees/employee-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useEmployeeById, useUpdateEmployee } from '@/hooks/use-employees';
import { UpdateEmployeeFormValues } from '@/schemas/employees';
import { formatPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { UserAvatar } from '@/components/shared/user-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { CopyButton } from '@/components/shared/copy-button';
import { Mail, Phone } from 'lucide-react';
import { truncate } from '@/lib/utils';

const formatPhoneDisplay = (phone: string): string => {
  if (!phone) {
    return '';
  }

  if (phone.startsWith('+')) {
    return formatPhoneNumber(phone) || phone;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, 'AU');
    return phoneNumber ? formatPhoneNumber(phoneNumber.format('E.164')) || phone : phone;
  } catch {
    if (phone.startsWith('0')) {
      const e164 = '+61' + phone.substring(1);
      return formatPhoneNumber(e164) || phone;
    }
    return phone;
  }
};

export function EmployeeDrawer({ id }: { id: string | undefined }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [, startTransition] = useTransition();

  // Don't render anything if there's no ID
  if (!id) {
    return null;
  }

  const {
    data: employee,
    isLoading,
    error,
    isError,
  } = useQuery({
    ...useEmployeeById(id),
  });

  const {
    mutate: updateEmployeeMutation,
    isPending: isPendingEmployeeUpdate,
    variables,
  } = useMutation({
    ...useUpdateEmployee(),
    onSuccess: () => {
      toast.success('Employee has been updated', {
        description: format(new Date(), "EEEE, MMMM dd, yyyy 'at' h:mm a"),
      });
      router.refresh();
    },
  });

  const isEmployeeUpdating = useCallback(
    (id: string) => {
      return isPendingEmployeeUpdate && variables?.id === id;
    },
    [isPendingEmployeeUpdate, variables],
  );

  const handleUpdateEmployee = useCallback(
    (updatedEmployee: UpdateEmployeeFormValues) => {
      updateEmployeeMutation({ ...updatedEmployee });
    },
    [updateEmployeeMutation],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setIsEditing(false);
        startTransition(() => {
          router.back();
        });
      }
    },
    [router],
  );

  return (
    <Drawer defaultOpen={true} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925">
        {isLoading && <DrawerSkeleton />}

        {isError && (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load employee details: {error?.message}</p>
          </Box>
        )}

        {employee && !isLoading && !isError && (
          <EmployeeDrawerContent
            employee={employee}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleUpdateEmployee={handleUpdateEmployee}
            isEmployeeUpdating={isEmployeeUpdating}
            isPendingEmployeeUpdate={isPendingEmployeeUpdate}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function EmployeeDrawerContent({
  employee,
  isEditing,
  setIsEditing,
  handleUpdateEmployee,
  isEmployeeUpdating,
  isPendingEmployeeUpdate,
}: {
  employee: any;
  isEditing: boolean;
  setIsEditing: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleUpdateEmployee: (data: any) => void;
  isEmployeeUpdating: (id: string) => boolean;
  isPendingEmployeeUpdate: boolean;
}) {
  return (
    <>
      <DrawerHeader className="w-full mt-0 gap-y-0">
        <DrawerTitle>
          {employee.firstName} {employee.lastName}
        </DrawerTitle>
        <DrawerDescription>View and edit employee information</DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="!py-0 -mx-6 h-full overflow-y-auto">
        <Box className="flex flex-col px-6 py-4 space-y-4 bg-white-50 border-b dark:border-gray-800">
          <Box className="flex items-center gap-4">
            <UserAvatar
              className="h-14 w-14 rounded-full border object-cover"
              user={{
                name: `${employee.firstName} ${employee.lastName}`,
                image: employee.avatarUrl || null,
              }}
            />
            <Box className="flex flex-col">
              <h2 className="text-lg font-semibold">
                {employee.firstName} {employee.lastName}
              </h2>
              <Box className="flex items-center gap-2">
                <StatusBadge status={employee.status} />
              </Box>
            </Box>
          </Box>

          <Box className="flex items-center justify-between gap-4 w-full">
            <Box className="flex gap-2 w-full">
              <Box className="group flex items-center justify-between gap-2 flex-1 border rounded-md px-2 py-1 text-md font-medium text-gray-700 dark:text-gray-200">
                <Box className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{truncate(employee.email, 25)}</span>
                </Box>
                <CopyButton
                  value={employee.email}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </Box>
              <Box className="group flex items-center justify-between gap-2 flex-1 border rounded-md px-2 py-1 text-md font-medium text-gray-700 dark:text-gray-200">
                <Box className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{formatPhoneDisplay(employee.phone)}</span>
                </Box>
                <CopyButton
                  value={employee.phone}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="flex items-center m-6">
          <Card className="w-full">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Box className="space-y-4">
                {isEditing ? (
                  <EmployeeForm
                    employee={employee}
                    onUpdate={handleUpdateEmployee}
                    isUpdating={isEmployeeUpdating(employee.id)}
                  />
                ) : (
                  <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { label: 'First Name', value: employee.firstName },
                      { label: 'Last Name', value: employee.lastName },
                      { label: 'Email', value: employee.email },
                      { label: 'Gender', value: employee.gender },
                      { label: 'Phone', value: formatPhoneDisplay(employee.phone) },
                      {
                        label: 'Date of birth',
                        value: employee.dob ? format(employee.dob, 'MMMM d, yyyy') : 'N/A',
                      },
                      { label: 'Rate', value: `$${employee.rate}` },
                      { label: 'Status', value: employee.status },
                    ].map(({ label, value }) => (
                      <Box key={label}>
                        <Box className="text-sm font-medium dark:text-gray-500">{label}</Box>
                        <Box className="text-sm">{value}</Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </DrawerBody>

      <DrawerFooter className="-mx-6 -mb-2 gap-0 bg-white px-6 dark:bg-gray-925">
        <Button
          variant="outline"
          onClick={() => setIsEditing((prev) => !prev)}
          disabled={isPendingEmployeeUpdate}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </DrawerFooter>
    </>
  );
}

function DrawerSkeleton() {
  return (
    <>
      <DrawerHeader className="-px-6 w-full">
        <DrawerTitle className="flex w-full items-center justify-between px-6">
          <Skeleton className="h-8 w-1/3" />
        </DrawerTitle>
        <DrawerDescription />
      </DrawerHeader>

      <DrawerBody className="p-6 space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Box key={index}>
            <Box>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Box>

            <Box className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Box>
          </Box>
        ))}
      </DrawerBody>

      <DrawerFooter className="-mx-6 -mb-2 gap-2 bg-white px-6 dark:bg-gray-925">
        <Skeleton className="h-10 w-20" />
      </DrawerFooter>
    </>
  );
}
