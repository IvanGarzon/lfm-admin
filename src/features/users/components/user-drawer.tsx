'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, AlertCircle, Loader2, Mail, Camera } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useUser,
  useUpdateUser,
  useUpdateUserRole,
  useUploadUserAvatar,
} from '@/features/users/hooks/use-user-queries';
import { UserForm } from './user-form';
import { UserPermissionsForm } from './user-permissions-form';
import { UserSecurityForm } from './user-security-form';
import { UserStatusBadge } from './user-status-badge';
import { UserRoleBadge } from '@/features/admin/users/components/user-role-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useSession } from 'next-auth/react';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, userSearchParamsDefaults } from '@/filters/users/users-filters';
import type { UpdateUserInput, UpdateUserRoleInput } from '@/schemas/users';

type Tab = 'details' | 'permissions' | 'security';
const TABS: Tab[] = ['details', 'permissions', 'security'];

export function UserDrawer({
  id,
  open,
  onClose,
  tab = 'details',
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
  tab?: Tab;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPermissionsDirty, setIsPermissionsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === id;

  const { data: user, isLoading, error, isError } = useUser(id);
  const updateUser = useUpdateUser();
  const updateUserRole = useUpdateUserRole();
  const uploadAvatar = useUploadUserAvatar(id ?? '');

  const queryString = useQueryString(searchParams, userSearchParamsDefaults);
  const isOpen = id ? (pathname?.includes(`/users/${id}`) ?? false) : (open ?? false);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = TABS.find((tab) => tab === value);
      if (!tab) {
        return;
      }

      setActiveTab(tab);
      if (id) {
        const target = `/users/${id}/${tab}`;
        window.history.replaceState(null, '', queryString ? `${target}?${queryString}` : target);
      }
    },
    [id, queryString],
  );

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        setHasUnsavedChanges(false);

        if (id) {
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
          setIsPermissionsDirty(false);
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
            <Box className="-mx-6 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="flex items-start justify-between gap-x-4">
                <Box className="mt-1 flex flex-row items-start gap-4 flex-1">
                  <Box className="relative shrink-0">
                    <UserAvatar
                      user={{ name: `${user.firstName} ${user.lastName}`, image: user.avatarUrl }}
                      className="size-16 text-lg"
                    />
                    {isOwnProfile ? (
                      <>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          {uploadAvatar.isPending ? (
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                          ) : (
                            <Camera className="size-3 text-muted-foreground" />
                          )}
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadAvatar.mutate(file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </>
                    ) : null}
                  </Box>
                  <Box className="flex flex-col gap-1 min-w-0">
                    <Box className="flex items-center gap-2 flex-wrap">
                      <DrawerTitle className="text-xl font-semibold tracking-tight">
                        {user.firstName} {user.lastName}
                      </DrawerTitle>
                      <UserRoleBadge role={user.role} />
                      {hasUnsavedChanges ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                          <AlertCircle className="h-3 w-3" />
                          Unsaved changes
                        </span>
                      ) : null}
                    </Box>
                    {user.title ? (
                      <p className="text-sm text-muted-foreground">{user.title}</p>
                    ) : null}
                    <Box className="flex items-center gap-3 flex-wrap mt-0.5">
                      <UserStatusBadge status={user.status} />
                      {user.email ? (
                        <Box className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="size-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                </Box>

                <Button
                  variant="ghost"
                  className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10 shrink-0"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="size-5" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </Button>
              </Box>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex flex-col h-full"
              >
                <TabsList className="mx-6 mt-4 mb-2 w-fit">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <UserForm
                    user={user}
                    onUpdate={handleUpdate}
                    onDirtyStateChange={setHasUnsavedChanges}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="flex-1 overflow-hidden mt-0">
                  <UserPermissionsForm
                    user={user}
                    onUpdate={handleUpdateRole}
                    onDirtyChange={setIsPermissionsDirty}
                  />
                </TabsContent>

                <TabsContent value="security" className="flex-1 overflow-hidden mt-0">
                  <UserSecurityForm user={user} />
                </TabsContent>
              </Tabs>
            </DrawerBody>

            <DrawerFooter className="-mx-6 border-t px-6 py-4">
              <Button
                type="submit"
                form={activeTab === 'details' ? 'form-rhf-user' : 'form-permissions'}
                disabled={
                  activeTab === 'details'
                    ? updateUser.isPending || !hasUnsavedChanges
                    : updateUserRole.isPending || !isPermissionsDirty
                }
              >
                {updateUser.isPending || updateUserRole.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                Update user
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
