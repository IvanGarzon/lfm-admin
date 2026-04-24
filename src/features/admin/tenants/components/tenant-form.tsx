'use client';

import { useCallback } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { CreateTenantSchema, type CreateTenantInput } from '@/schemas/tenants';
import { useCreateTenant } from '@/features/admin/tenants/hooks/use-tenant-queries';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

export function TenantForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const createTenant = useCreateTenant();

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(CreateTenantSchema),
    defaultValues: { name: '', slug: '', adminEmail: '' },
  });

  const handleNameChange = useCallback(
    (value: string) => {
      form.setValue('name', value);
      form.setValue(
        'slug',
        value
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      );
    },
    [form],
  );

  const handleSubmit: SubmitHandler<CreateTenantInput> = useCallback(
    (data: CreateTenantInput) => {
      createTenant.mutate(data, {
        onSuccess: (result) => {
          if (result.success) {
            onSuccess();
          }
        },
      });
    },
    [createTenant, onSuccess],
  );

  return (
    <Form {...form}>
      <form id="form-rhf-tenant" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel>Name</FieldLabel>
                </FieldContent>
                <Input
                  {...field}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Florist"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={fieldState.error ? [fieldState.error] : []} />
                ) : null}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel>Slug</FieldLabel>
                </FieldContent>
                <Input {...field} placeholder="acme-florist" aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? (
                  <FieldError errors={fieldState.error ? [fieldState.error] : []} />
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="adminEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel>Admin Email</FieldLabel>
                </FieldContent>
                <Input
                  type="email"
                  {...field}
                  placeholder="admin@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={fieldState.error ? [fieldState.error] : []} />
                ) : null}
                <p className="text-xs text-muted-foreground">
                  An invitation will be sent to this address with the Admin role.
                </p>
              </Field>
            )}
          />
        </FieldGroup>

        <Box className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createTenant.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTenant.isPending}>
            {createTenant.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create Tenant
          </Button>
        </Box>
      </form>
    </Form>
  );
}
