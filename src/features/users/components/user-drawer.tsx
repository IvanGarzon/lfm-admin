'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, AlertCircle } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useUpdateUser, useUpdateUserRole } from '@/features/users/hooks/use-user-queries';
import { UserForm } from './user-form';
import { UserPermissionsForm } from './user-permissions-form';
import { UserStatusBadge } from './user-status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CopyButton } from '@/components/shared/copy-button';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, userSearchParamsDefaults } from '@/filters/users/users-filters';
import type { UpdateUserInput, UpdateUserRoleInput } from '@/schemas/users';

export function UserDrawer({
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: user, isLoading, error, isError } = useUser(id);
  const updateUser = useUpdateUser();
  const updateUserRole = useUpdateUserRole();

  const queryString = useQueryString(searchParams, userSearchParamsDefaults);
  const isOpen = id ? (pathname?.includes(`/users/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        // Reset to view mode when closing
        setHasUnsavedChanges(false);

        if (id) {
          // Navigate back to list preserving filters
          const basePath = '/users';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString],
  );

  const handleUpdate = useCallback(
    (data: UpdateUserInput) => {
      updateUser.mutate(data, {
        onSuccess: () => setHasUnsavedChanges(false),
      });
    },
    [updateUser],
  );

  const handleUpdateRole = useCallback(
    (data: UpdateUserRoleInput) => {
      updateUserRole.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [updateUserRole, onClose],
  );

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? (
          <>
            <DrawerHeader>
              <DrawerTitle>User Details</DrawerTitle>
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
              Could not load user details: {error?.message}
            </Box>
          </>
        ) : null}

        {user && !isLoading && !isError ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1">
                <UserAvatar
                  user={{ name: `${user.firstName} ${user.lastName}`, image: null }}
                  className="size-12"
                />
                <Box className="flex flex-col">
                  <Box className="flex items-center gap-2">
                    <DrawerTitle className="text-xl font-semibold tracking-tight">
                      {user.firstName} {user.lastName}
                    </DrawerTitle>
                    {hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1">
                    <UserStatusBadge status={user.status} />
                    <Box className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <span className="font-mono">{user.id}</span>
                      <CopyButton value={user.id} className="size-4 p-0 border-none" />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Button
                variant="ghost"
                className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                onClick={() => handleOpenChange(false)}
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden">
              <Tabs defaultValue="details" className="flex flex-col h-full">
                <TabsList className="mx-6 mt-4 w-fit">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <UserForm
                    user={user}
                    onUpdate={handleUpdate}
                    isUpdating={updateUser.isPending}
                    onDirtyStateChange={setHasUnsavedChanges}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="flex-1 overflow-hidden mt-0">
                  <UserPermissionsForm
                    user={user}
                    onUpdate={handleUpdateRole}
                    isUpdating={updateUserRole.isPending}
                  />
                </TabsContent>
              </Tabs>
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
