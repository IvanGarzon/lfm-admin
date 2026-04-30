'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  AlertCircle,
  Mail,
  Phone,
  Edit2,
  Building2,
  MapPin,
  FileText,
  Receipt,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import {
  useCustomer,
  useUpdateCustomer,
  useCreateCustomer,
} from '@/features/crm/customers/hooks/use-customer-queries';
import { CustomerForm } from './customer-form';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, customerSearchParamsDefaults } from '@/filters/customers/customers-filters';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/schemas/customers';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CustomerStatusBadge } from './customer-status-badge';
import { CopyButton } from '@/components/shared/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DrawerMode = 'edit' | 'create';

export function CustomerDrawer({
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

  const { data: customer, isLoading, error, isError } = useCustomer(id);

  const updateCustomer = useUpdateCustomer();
  const createCustomer = useCreateCustomer();

  const queryString = useQueryString(searchParams, customerSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/crm/customers/${id}`) ?? false) : (open ?? false);

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
          const basePath = '/crm/customers';
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
    (data: CreateCustomerInput) => {
      createCustomer.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createCustomer, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateCustomerInput) => {
      updateCustomer.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setIsEditingView(false);
        },
      });
    },
    [updateCustomer],
  );

  const getDrawerHeader = () => {
    if (mode === 'create') {
      return {
        title: 'New Customer',
        status: null,
      };
    }

    return {
      title: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer Details',
      status: customer?.status ?? null,
    };
  };

  const { title, status } = getDrawerHeader();

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden pb-0!">
        {isLoading ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Customer Details</DrawerTitle>
              <VisuallyHidden>
                <DrawerDescription>Loading customer details</DrawerDescription>
              </VisuallyHidden>
            </DrawerHeader>
            <Box className="p-6">Loading...</Box>
          </>
        ) : null}

        {isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
              <VisuallyHidden>
                <DrawerDescription>An error occurred whilst loading the customer</DrawerDescription>
              </VisuallyHidden>
            </DrawerHeader>
            <Box className="p-6 text-destructive">
              <p className="mt-4">Could not load customer details: {error?.message}</p>
            </Box>
          </Box>
        ) : null}

        {(customer && !isLoading && !isError) || mode === 'create' ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-border px-6 pb-4">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1">
                {customer ? (
                  <UserAvatar
                    user={{
                      name: `${customer.firstName} ${customer.lastName}`,
                      image: null,
                    }}
                    className="size-12"
                  />
                ) : null}
                <Box className="flex flex-col">
                  <VisuallyHidden>
                    <DrawerDescription>
                      {mode === 'create'
                        ? 'Create a new customer'
                        : 'View or edit customer details'}
                    </DrawerDescription>
                  </VisuallyHidden>
                  <Box className="flex items-center gap-2">
                    <DrawerTitle className="text-xl font-semibold tracking-tight">
                      {title}
                    </DrawerTitle>
                    {mode === 'edit' && hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1">
                    {status && <CustomerStatusBadge status={status} />}
                    {customer && (
                      <Box className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <span className="font-mono">{customer.id}</span>
                        <CopyButton value={customer.id} className="size-4 p-0 border-none" />
                      </Box>
                    )}
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
                    <Edit2 className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="aspect-square p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => handleOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </Box>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden">
              {isEditing ? (
                <CustomerForm
                  customer={customer}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  isCreating={createCustomer.isPending}
                  isUpdating={updateCustomer.isPending}
                  onDirtyStateChange={setHasUnsavedChanges}
                  onClose={mode === 'create' ? onClose : () => setIsEditingView(false)}
                />
              ) : (
                <Box className="p-6 space-y-6 overflow-y-auto">
                  {/* Quick Stats */}
                  <Box className="grid grid-cols-2 gap-4">
                    <Link href={`/finances/invoices?customerId=${customer?.id}`}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <Box className="flex items-center justify-between">
                            <Box>
                              <p className="text-2xl font-bold">{customer?.invoicesCount ?? 0}</p>
                              <p className="text-sm text-muted-foreground">Invoices</p>
                            </Box>
                            <Box className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                              <FileText
                                className="size-5 text-blue-600 dark:text-blue-400"
                                aria-hidden="true"
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link href={`/finances/quotes?customerId=${customer?.id}`}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <Box className="flex items-center justify-between">
                            <Box>
                              <p className="text-2xl font-bold">{customer?.quotesCount ?? 0}</p>
                              <p className="text-sm text-muted-foreground">Quotes</p>
                            </Box>
                            <Box className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                              <Receipt
                                className="size-5 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Link>
                  </Box>

                  {/* Contact Information Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Mail className="size-4" aria-hidden="true" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <Box className="flex items-center gap-3">
                          <Box className="p-2 rounded-lg bg-muted">
                            <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                          </Box>
                          <Box>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Email
                            </p>
                            <a
                              href={`mailto:${customer?.email}`}
                              className="text-sm font-medium hover:text-primary transition-colors"
                            >
                              {customer?.email}
                            </a>
                          </Box>
                        </Box>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="size-8"
                          aria-label={`Send email to ${customer?.email}`}
                        >
                          <a href={`mailto:${customer?.email}`}>
                            <ExternalLink className="size-4" aria-hidden="true" />
                          </a>
                        </Button>
                      </Box>

                      {customer?.phone && (
                        <Box className="flex items-center justify-between py-2">
                          <Box className="flex items-center gap-3">
                            <Box className="p-2 rounded-lg bg-muted">
                              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                            </Box>
                            <Box>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                Phone
                              </p>
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-sm font-medium hover:text-primary transition-colors"
                              >
                                {customer.phone}
                              </a>
                            </Box>
                          </Box>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8"
                            aria-label={`Call ${customer.phone}`}
                          >
                            <a href={`tel:${customer.phone}`}>
                              <ExternalLink className="size-4" aria-hidden="true" />
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
                          {customer?.gender?.toLowerCase() ?? 'Not specified'}
                        </span>
                      </Box>
                      <Box className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Status</span>
                        {customer?.status && <CustomerStatusBadge status={customer.status} />}
                      </Box>
                      <Box className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Customer since</span>
                        <Box className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          {customer?.createdAt
                            ? format(new Date(customer.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Organization Card */}
                  {customer?.organizationName ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Building2 className="size-4" aria-hidden="true" />
                          Organization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Box className="flex items-center gap-3">
                          <Box className="p-3 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                            <Building2
                              className="size-5 text-violet-600 dark:text-violet-400"
                              aria-hidden="true"
                            />
                          </Box>
                          <Box className="flex-1">
                            <p className="font-medium">{customer.organizationName}</p>
                            {customer.useOrganizationAddress && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Using organization address for billing
                              </p>
                            )}
                          </Box>
                          {customer.organizationId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/crm/organizations/${customer.organizationId}`}>
                                View
                                <ExternalLink className="size-3.5 ml-1.5" />
                              </Link>
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Address Card */}
                  {customer?.address && !customer.useOrganizationAddress ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <MapPin className="size-4" aria-hidden="true" />
                          Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Box className="flex items-start gap-3">
                          <Box className="p-3 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                            <MapPin
                              className="size-5 text-orange-600 dark:text-orange-400"
                              aria-hidden="true"
                            />
                          </Box>
                          <Box className="flex-1">
                            <p className="text-sm leading-relaxed">
                              {customer.address.formattedAddress}
                            </p>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ) : null}
                </Box>
              )}
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
