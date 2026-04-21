'use client';

import { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { UpdateUserSchema, type UpdateUserInput } from '@/schemas/users';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { UserDetail } from '@/features/users/types';

const StatusOptions = UserStatusSchema.options.map((s) => ({
  value: s,
  label: s.charAt(0) + s.slice(1).toLowerCase(),
}));

function mapUserToFormValues(user: UserDetail): UpdateUserInput {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? '',
    phone: user.phone ?? null,
    status: user.status,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  };
}

export function UserForm({
  user,
  onUpdate,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserInput) => void;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: mapUserToFormValues(user),
  });

  useUnsavedChanges(form.formState.isDirty);

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    onDirtyStateChange?.(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const handleSubmit = useCallback(
    (data: UpdateUserInput) => {
      onUpdate(data);
    },
    [onUpdate],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
        <Box className="flex-1 overflow-y-auto p-6 space-y-4">
          <Box className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>First name</FieldLabel>
                    </FieldContent>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>Last name</FieldLabel>
                    </FieldContent>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>Email</FieldLabel>
                  </FieldContent>
                  <Input type="email" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>Phone</FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel>Status</FieldLabel>
                  </FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {StatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="isTwoFactorEnabled"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Box className="flex items-center justify-between">
                    <FieldLabel>Two-factor authentication</FieldLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </Box>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
        </Box>

        <Box className="border-t p-4 flex items-center justify-end gap-3">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
            {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </Box>
      </form>
    </Form>
  );
}
