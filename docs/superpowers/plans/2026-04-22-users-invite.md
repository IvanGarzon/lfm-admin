# Users — Invite User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Invite User" button to the tenant `/users` page that opens a 2-field modal (email + role) and sends an invitation email via the existing invite infrastructure.

**Architecture:** New `inviteUser` action in `src/actions/users/mutations.ts` wraps the invitation repo + email service under `withTenantPermission('canManageUsers')`. A `UserInviteModal` Dialog component handles the form. `users-list.tsx` gets a button that toggles the modal via local state.

**Tech Stack:** Next.js server actions, React Hook Form + Zod, TanStack Query, shadcn Dialog, existing `InvitationRepository` + `sendEmailNotification`.

---

## File Structure

| File                                                  | Change                                     |
| ----------------------------------------------------- | ------------------------------------------ |
| `src/schemas/users.ts`                                | Add `InviteUserSchema` + `InviteUserInput` |
| `src/actions/users/mutations.ts`                      | Add `inviteUser` action                    |
| `src/actions/users/__tests__/mutations.test.ts`       | Add `inviteUser` tests                     |
| `src/features/users/hooks/use-user-queries.ts`        | Add `useInviteUser` hook                   |
| `src/features/users/components/user-invite-modal.tsx` | Create new modal component                 |
| `src/features/users/components/users-list.tsx`        | Add button + dynamic modal import          |

---

### Task 1: Schema

**Files:**

- Modify: `src/schemas/users.ts`

- [ ] **Step 1: Add `InviteUserSchema` and `InviteUserInput` to the schema file**

Open `src/schemas/users.ts`. The file currently exports `UpdateUserSchema`, `UpdateUserRoleSchema`, `SoftDeleteUserSchema` and their inferred types. Add at the end:

```ts
export const InviteUserSchema = z.object({
  email: commonValidators.email(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep "schemas/users"
```

Expected: no output (no errors in that file).

- [ ] **Step 3: Commit**

```bash
git add src/schemas/users.ts
git commit -m "feat(users): add InviteUserSchema"
```

---

### Task 2: Action + Tests

**Files:**

- Modify: `src/actions/users/mutations.ts`
- Modify: `src/actions/users/__tests__/mutations.test.ts`

- [ ] **Step 1: Write the failing tests first**

Open `src/actions/users/__tests__/mutations.test.ts`. The file currently mocks `UserRepository`, `auth`, and `next/cache`. Add mocks for `InvitationRepository`, `TenantRepository`, `sendEmailNotification`, and `absoluteUrl`. Then add the `inviteUser` describe block.

Replace the top of the file (hoisted mocks + imports) with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUser, updateUserRole, softDeleteUser, inviteUser } from '../mutations';
import { testIds, mockSessions, createUpdateUserInput } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { UserDetail } from '@/features/users/types';

const { mockUserRepo, mockInvitationRepo, mockTenantRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    findTenantUserById: vi.fn(),
    updateTenantUser: vi.fn(),
    updateTenantUserRole: vi.fn(),
    softDeleteTenantUser: vi.fn(),
    getUserByEmail: vi.fn(),
    findById: vi.fn(),
  },
  mockInvitationRepo: {
    findPendingByEmail: vi.fn(),
    create: vi.fn(),
  },
  mockTenantRepo: {
    findTenantById: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/repositories/invitation-repository', () => ({
  InvitationRepository: vi.fn().mockImplementation(function () {
    return mockInvitationRepo;
  }),
}));

vi.mock('@/repositories/tenant-repository', () => ({
  TenantRepository: vi.fn().mockImplementation(function () {
    return mockTenantRepo;
  }),
}));

vi.mock('@/lib/email-service', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/utils', () => ({
  absoluteUrl: vi.fn((path: string) => `https://example.com${path}`),
  getPaginationMetadata: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
```

Keep the existing `TEST_USER_ID`, `mockUser`, `baseInput` constants and all existing describe blocks unchanged. Add this new block after the existing ones:

```ts
describe('inviteUser', () => {
  const mockInvitation = {
    id: 'inv-1',
    token: 'test-token-abc',
    role: 'USER' as const,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  };

  const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
  const mockInviter = { id: 'user-1', firstName: 'Jane', lastName: 'Admin' };

  beforeEach(() => {
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
    mockInvitationRepo.create.mockResolvedValue(mockInvitation);
    mockTenantRepo.findTenantById.mockResolvedValue(mockTenant);
    mockUserRepo.findById.mockResolvedValue(mockInviter);
    mockUserRepo.getUserByEmail.mockResolvedValue(null);
  });

  it('sends invitation and returns success', async () => {
    const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

    expect(result.success).toBe(true);
    expect(mockInvitationRepo.create).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/users');
  });

  it('returns error when pending invitation already exists', async () => {
    mockInvitationRepo.findPendingByEmail.mockResolvedValue(mockInvitation);

    const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/already pending/i);
    }
    expect(mockInvitationRepo.create).not.toHaveBeenCalled();
  });

  it('returns error when user with email already exists in tenant', async () => {
    mockUserRepo.getUserByEmail.mockResolvedValue({
      id: 'u-1',
      tenantId: mockSession.user.tenantId,
    });

    const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/already exists/i);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run src/actions/users/__tests__/mutations.test.ts 2>&1 | tail -20
```

Expected: FAIL — `inviteUser` is not exported from `../mutations`.

- [ ] **Step 3: Implement `inviteUser` action**

Open `src/actions/users/mutations.ts`. Add these imports after the existing ones:

```ts
import { prisma } from '@/lib/prisma';
import { InvitationRepository } from '@/repositories/invitation-repository';
import { TenantRepository } from '@/repositories/tenant-repository';
import { sendEmailNotification } from '@/lib/email-service';
import { absoluteUrl } from '@/lib/utils';
import { InviteUserSchema, type InviteUserInput } from '@/schemas/users';
```

Note: `prisma`, `UserRepository`, `withTenantPermission`, `handleActionError`, and `revalidatePath` are already imported. Add the `invitationRepo` and `tenantRepo` module-level instances after `const userRepo = new UserRepository(prisma);`:

```ts
const invitationRepo = new InvitationRepository(prisma);
const tenantRepo = new TenantRepository(prisma);
```

Then add the action at the end of the file:

```ts
/**
 * Sends an invitation email to a new user to join the tenant.
 */
export const inviteUser = withTenantPermission<InviteUserInput, void>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { email, role } = InviteUserSchema.parse(data);

      const existingUser = await userRepo.getUserByEmail(email);
      if (existingUser && existingUser.tenantId === ctx.tenantId) {
        return { success: false, error: 'A user with this email already exists' };
      }

      const existing = await invitationRepo.findPendingByEmail(email, ctx.tenantId);
      if (existing) {
        return { success: false, error: 'An invitation is already pending for this email' };
      }

      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const [invitation, tenant, inviter] = await Promise.all([
        invitationRepo.create({
          email,
          role,
          tenantId: ctx.tenantId,
          invitedBy: ctx.userId,
          expiresAt,
        }),
        tenantRepo.findTenantById(ctx.tenantId),
        userRepo.findById(ctx.userId),
      ]);

      if (!tenant || !inviter) {
        return { success: false, error: 'Failed to load invitation context' };
      }

      await sendEmailNotification({
        to: email,
        subject: `You've been invited to join ${tenant.name}`,
        template: 'invitation',
        props: {
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          tenantName: tenant.name,
          role: invitation.role,
          acceptUrl: absoluteUrl(`/invite/accept?token=${invitation.token}`),
          expiresAt: invitation.expiresAt,
        },
      });

      revalidatePath('/users');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to send invitation');
    }
  },
);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/actions/users/__tests__/mutations.test.ts 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/actions/users/mutations.ts src/actions/users/__tests__/mutations.test.ts
git commit -m "feat(users): add inviteUser action with tests"
```

---

### Task 3: Hook

**Files:**

- Modify: `src/features/users/hooks/use-user-queries.ts`

- [ ] **Step 1: Add `useInviteUser` to the hooks file**

Open `src/features/users/hooks/use-user-queries.ts`. Add `inviteUser` to the imports line:

```ts
import { updateUser, updateUserRole, softDeleteUser, inviteUser } from '@/actions/users/mutations';
```

Add `InviteUserInput` to the schema imports:

```ts
import type {
  UpdateUserInput,
  UpdateUserRoleInput,
  SoftDeleteUserInput,
  InviteUserInput,
} from '@/schemas/users';
```

Append this function at the end of the file:

```ts
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteUserInput) => {
      const result = await inviteUser(data);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Invitation sent');
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep "use-user-queries"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/hooks/use-user-queries.ts
git commit -m "feat(users): add useInviteUser hook"
```

---

### Task 4: UI — Modal + Button

**Files:**

- Create: `src/features/users/components/user-invite-modal.tsx`
- Modify: `src/features/users/components/users-list.tsx`

- [ ] **Step 1: Create `UserInviteModal` component**

Create `src/features/users/components/user-invite-modal.tsx`:

```tsx
'use client';

import { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { InviteUserSchema, type InviteUserInput } from '@/schemas/users';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { useInviteUser } from '@/features/users/hooks/use-user-queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const INVITABLE_ROLES = [
  { value: 'USER', label: USER_ROLE_LABELS.USER },
  { value: 'MANAGER', label: USER_ROLE_LABELS.MANAGER },
  { value: 'ADMIN', label: USER_ROLE_LABELS.ADMIN },
] as const;

export function UserInviteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inviteUser = useInviteUser();

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: { email: '', role: 'USER' },
  });

  const handleSubmit = useCallback(
    (data: InviteUserInput) => {
      inviteUser.mutate(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    },
    [inviteUser, form, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            An invitation email will be sent. The link expires in 72 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>Email</FieldLabel>
                    </FieldContent>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>Role</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITABLE_ROLES.map((opt) => (
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

            <Box className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={inviteUser.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Send Invite
              </Button>
            </Box>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Update `users-list.tsx` — add button and dynamic modal import**

Open `src/features/users/components/users-list.tsx`. Replace the entire file content with:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { userColumns } from '@/features/users/components/user-columns';
import type { UserPagination } from '@/features/users/types';

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  { ssr: false, loading: () => null },
);

const UserInviteModal = dynamic(
  () => import('@/features/users/components/user-invite-modal').then((mod) => mod.UserInviteModal),
  { ssr: false, loading: () => null },
);

export function UsersList({
  initialData,
  searchParams: serverSearchParams,
  openUserId,
}: {
  initialData: UserPagination;
  searchParams: SearchParams;
  openUserId?: string;
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const perPage = Number(serverSearchParams.perPage) || 20;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(() => userColumns, []);

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">Manage users and their access</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </Box>
      </Box>

      <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
        <DataTableToolbar table={table} />
        {initialData.items.length ? (
          <DataTable table={table} totalItems={initialData.pagination.totalItems} />
        ) : (
          <Box className="text-center py-12 text-muted-foreground">No users found.</Box>
        )}
      </Card>

      {openUserId ? <UserDrawer id={openUserId} /> : null}

      <UserInviteModal open={showInviteModal} onOpenChange={setShowInviteModal} />
    </Box>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "user-invite-modal|users-list"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/components/user-invite-modal.tsx src/features/users/components/users-list.tsx
git commit -m "feat(users): add invite user modal and button"
```
