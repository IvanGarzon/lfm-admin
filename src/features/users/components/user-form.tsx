'use client';

import { useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UpdateUserSchema, type UpdateUserInput } from '@/schemas/users';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { hasPermission } from '@/lib/permissions';
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
    username: user.username ?? null,
    title: user.title ?? null,
    bio: user.bio ?? null,
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
  const { data: session } = useSession();
  const canManageUsers = hasPermission(session?.user, 'canManageUsers');

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: mapUserToFormValues(user),
  });

  useUnsavedChanges(form.formState.isDirty);

  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const handleSubmit = useCallback(
    (data: UpdateUserInput) => {
      onUpdate(data);
    },
    [onUpdate],
  );

  return (
    <Form {...form}>
      <form
        id="form-rhf-user"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col h-full"
      >
        <Box className="flex-1 overflow-y-auto p-6 space-y-4">
          <Card>
            <CardHeader className="px-6 pt-4 pb-4">
              <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
              <p className="text-xs text-muted-foreground">
                Update your personal details and profile information.
              </p>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-4 space-y-4">
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

              <Box className="grid grid-cols-1 gap-4">
                <FieldGroup>
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldContent>
                          <FieldLabel>Username</FieldLabel>
                        </FieldContent>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          placeholder="e.g. john.doe"
                          aria-invalid={fieldState.invalid}
                        />
                        <p className="text-xs text-muted-foreground">
                          This is your public display name. It can be your real name or a pseudonym.
                          You can only change this once every 30 days.
                        </p>
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </Box>

              <Box className="grid grid-cols-2 gap-4">
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
              </Box>

              <Box className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldContent>
                          <FieldLabel>Job title</FieldLabel>
                        </FieldContent>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          placeholder="e.g. Senior Barista"
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!canManageUsers}
                        >
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
              </Box>

              <FieldGroup>
                <Controller
                  name="bio"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel>Bio</FieldLabel>
                      </FieldContent>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="A short bio visible to your team"
                        rows={3}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
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
