# Users — Invite User Design

**Date:** 2026-04-22
**Status:** Approved

## Overview

Adds an "Invite User" flow to the tenant `/users` page. An ADMIN clicks a button, fills in email + role in a modal, and the system sends an invitation email using the existing invite infrastructure. The invited user follows the link to set their own password via the existing `/invite/accept` page.

---

## Scope

**In scope:**

- `InviteUserSchema` added to `src/schemas/users.ts`
- `inviteUser` action in `src/actions/users/mutations.ts`
- `useInviteUser` hook in `src/features/users/hooks/use-user-queries.ts`
- `UserInviteModal` component
- "Invite User" button in `users-list.tsx`

**Out of scope:**

- Resend / cancel pending invites from the users list
- The accept flow (`/invite/accept`) — already built

---

## Schema (`src/schemas/users.ts`)

```ts
export const InviteUserSchema = z.object({
  email: commonValidators.email(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
```

---

## Action (`src/actions/users/mutations.ts`)

`inviteUser` — wrapped in `withTenantPermission('canManageUsers')`.

Steps:

1. Parse input with `InviteUserSchema`
2. Check no pending invitation exists for that email + tenantId (via invitation repo)
3. Create invitation record with 72hr TTL
4. Send invitation email via `sendEmailNotification`
5. `revalidatePath('/users')`
6. Return `ActionResult<void>`

No new repository methods required — existing `InvitationRepository` methods cover all steps.

---

## Hook (`src/features/users/hooks/use-user-queries.ts`)

`useInviteUser` — calls `inviteUser` action, invalidates `USER_KEYS.lists()` on settled.

---

## UI

### `UserInviteModal` (`src/features/users/components/user-invite-modal.tsx`)

- shadcn `Dialog` (not a drawer — form has only 2 fields, no background content to show)
- Fields:
  - `email` — text input, validated on submit
  - `role` — select with options Staff (USER) / Manager (MANAGER) / Admin (ADMIN), default Staff
- Submit triggers `useInviteUser`, shows loading spinner while pending
- Closes on success, displays error message inline on failure
- React Hook Form + `zodResolver(InviteUserSchema)`

### `users-list.tsx`

- "Invite User" button with `<Plus>` icon, placed in header area (top-right, matching customers/employees pattern)
- `showInviteModal` boolean state controls modal visibility
- `UserInviteModal` dynamically imported with `ssr: false`

---

## Permissions

All actions use `withTenantPermission('canManageUsers')` — ADMIN role and above only. Consistent with the rest of the Users feature.

---

## Error Handling

| Scenario                              | Behaviour                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Email already has pending invite      | Action returns `{ success: false, error: 'An invitation is already pending for this email' }` |
| Email belongs to existing active user | Action returns `{ success: false, error: 'A user with this email already exists' }`           |
| Email send fails                      | Action returns `{ success: false, error }` — no invite record persisted                       |

---

## Tests

**Action unit test** (`src/actions/users/__tests__/mutations.test.ts`):

- Happy path: invite created, email sent
- Duplicate pending invite: returns error
- Auth failure: returns error

No new integration tests — invitation repo methods already covered by existing tests.
