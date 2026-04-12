# Billing Implementation Plan

**Author:** Ivancho Garzon \<Lehenbizico>
**Last Updated:** 2026-04-12
**Status:** Planned — not yet started

---

This document is the step-by-step execution plan for adding subscription billing to the multi-tenant platform. Each stage is self-contained and can be shipped independently.

---

## Overview

- **Provider**: Stripe (Checkout + Customer Portal + Webhooks)
- **Model**: Flat monthly tiers with a 14-day trial
- **Enforcement**: Inside `withTenantPermission` HOF — zero changes to individual actions
- **Upsell**: Structured error code surfaced to the UI, rendered by a shared component

---

## Tiers

|                                                     | Starter | Growth | Pro       |
| --------------------------------------------------- | ------- | ------ | --------- |
| Price                                               | $49/mo  | $99/mo | $199/mo   |
| Seats                                               | 1       | 3      | Unlimited |
| Customers                                           | 250     | 2,500  | Unlimited |
| Invoices/mo                                         | 50      | 500    | Unlimited |
| CRM (customers, orgs)                               | ✓       | ✓      | ✓         |
| Finances (invoices, quotes, transactions)           | ✓       | ✓      | ✓         |
| Inventory (products, vendors, recipes, price lists) | —       | ✓      | ✓         |
| Custom branding                                     | —       | —      | ✓         |

Trial: 14 days full Pro access. No credit card required to start.

---

## Stage 1 — Prisma Schema

**File**: `prisma/schema.prisma`

### 1.1 Add `Plan` and `SubscriptionStatus` enums

```prisma
enum Plan {
  TRIAL
  STARTER
  GROWTH
  PRO
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
}
```

### 1.2 Extend the `Tenant` model

```prisma
model Tenant {
  // ... existing fields ...

  plan                 Plan               @default(TRIAL)
  subscriptionStatus   SubscriptionStatus @default(TRIALING)
  trialEndsAt          DateTime?          @map("trial_ends_at") @db.Timestamptz()
  stripeCustomerId     String?            @unique @map("stripe_customer_id")
  stripeSubscriptionId String?            @unique @map("stripe_subscription_id")
  currentPeriodEnd     DateTime?          @map("current_period_end") @db.Timestamptz()

  // ... existing relations ...
}
```

### 1.3 Migration

```bash
pnpm prisma migrate dev --name add_billing_to_tenant
```

### 1.4 Seed update

In `prisma/seeds/seed-e2e-user.ts`, set the E2E tenant to `plan: 'PRO'` and `subscriptionStatus: 'ACTIVE'` so no billing checks fire during tests.

---

## Stage 2 — Plan Limits & Feature Gates

**File**: `src/lib/permissions.ts`

Add a `PLAN_FEATURES` map and a `PLAN_LIMITS` map below the existing `RolePolicies`. No changes to the existing role/permission structure.

### 2.1 Feature gates per plan

```ts
// src/lib/permissions.ts

export type PlanKey = 'TRIAL' | 'STARTER' | 'GROWTH' | 'PRO';

/**
 * Maps which permission keys are available on each plan.
 * TRIAL mirrors PRO — full access during the trial period.
 */
export const PLAN_FEATURES: Record<PlanKey, PermissionKey[]> = {
  // TRIAL mirrors PRO — full access during the trial period.
  // IMPORTANT: `PERMISSIONS` must only contain tenant-scoped permission keys.
  // Super-admin-only capabilities must never be added here — they are gated
  // separately via `withSuperAdmin` and are unrelated to plan checks.
  TRIAL: Object.keys(PERMISSIONS) as PermissionKey[],
  STARTER: [
    'canReadInvoices',
    'canManageInvoices',
    'canRecordPayments',
    'canReadQuotes',
    'canManageQuotes',
    'canReadTransactions',
    'canManageTransactions',
    'canManageSettings',
    'canManageUsers',
  ],
  GROWTH: [
    // Everything in STARTER plus inventory
    'canReadInvoices',
    'canManageInvoices',
    'canRecordPayments',
    'canReadQuotes',
    'canManageQuotes',
    'canReadTransactions',
    'canManageTransactions',
    'canReadProducts',
    'canManageProducts',
    'canReadVendors',
    'canManageVendors',
    'canReadRecipes',
    'canManageRecipes',
    'canReadPriceList',
    'canManagePriceList',
    'canManageSettings',
    'canManageUsers',
  ],
  PRO: Object.keys(PERMISSIONS) as PermissionKey[], // full access
};

/**
 * Hard usage caps enforced at mutation time.
 * null = unlimited.
 */
export const PLAN_LIMITS: Record<
  PlanKey,
  { customers: number | null; invoicesPerMonth: number | null; seats: number | null }
> = {
  TRIAL: { customers: null, invoicesPerMonth: null, seats: null },
  STARTER: { customers: 250, invoicesPerMonth: 50, seats: 1 },
  GROWTH: { customers: 2500, invoicesPerMonth: 500, seats: 3 },
  PRO: { customers: null, invoicesPerMonth: null, seats: null },
};

/**
 * Checks whether a plan includes the given permission.
 */
export function planAllows(plan: PlanKey, permission: PermissionKey): boolean {
  return PLAN_FEATURES[plan].includes(permission);
}
```

---

## Stage 3 — Enforcement in the Auth HOF

**File**: `src/lib/action-auth.ts`

This is the only enforcement point. No individual action files need to change.

### 3.1 Extend `TenantContext`

**File**: `src/types/actions.ts`

```ts
// Add plan and subscriptionStatus to TenantContext
export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  user: AuthenticatedSession['user'];
  plan: 'TRIAL' | 'STARTER' | 'GROWTH' | 'PRO';
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
};
```

### 3.2 Add new error codes

**File**: `src/lib/errors.ts`

```ts
// Add to the ErrorCode enum under Business Logic (4xxx)
SUBSCRIPTION_INACTIVE = 'BIZ_006',
PLAN_UPGRADE_REQUIRED = 'BIZ_007',
USAGE_LIMIT_REACHED   = 'BIZ_008',
```

### 3.3 Update `withTenantPermission`

**File**: `src/lib/action-auth.ts`

```ts
import { planAllows } from './permissions';

export function withTenantPermission<TInput, TOutput>(
  permission: PermissionKey | PermissionKey[],
  handler: TenantHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return { success: false, error: 'You must be signed in to perform this action' };
    }

    // -- Role check (existing) --
    const permissions = Array.isArray(permission) ? permission : [permission];
    const missingPermissions = permissions.filter((p) => !hasPermission(session.user, p));
    if (missingPermissions.length > 0) {
      return { success: false, error: 'You do not have permission to perform this action' };
    }

    // -- Resolve tenant --
    const createContext = async (
      tenantId: string,
      tenantSlug: string,
    ): Promise<TenantContext | null> => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, subscriptionStatus: true },
      });
      if (!tenant) return null;
      return {
        tenantId,
        tenantSlug,
        userId: session.user.id,
        user: session.user,
        plan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus,
      };
    };

    const tenantId = session.user.tenantId;
    const tenantSlug = session.user.tenantSlug;

    if (!tenantId || !tenantSlug) {
      // SUPER_ADMIN fallback (existing logic) ...
    }

    const ctx = await createContext(tenantId, tenantSlug);
    if (!ctx) {
      return { success: false, error: 'Tenant not found' };
    }

    // -- Subscription status check --
    if (ctx.subscriptionStatus === 'CANCELED') {
      return {
        success: false,
        error: 'Your subscription has been cancelled. Please reactivate to continue.',
        code: ErrorCode.SUBSCRIPTION_INACTIVE,
      };
    }

    // PAST_DUE: block writes, allow reads
    const isWritePermission = permissions.some(
      (p) => p.startsWith('canManage') || p === 'canRecordPayments',
    );
    if (ctx.subscriptionStatus === 'PAST_DUE' && isWritePermission) {
      return {
        success: false,
        error: 'Your payment is overdue. Update your billing details to continue making changes.',
        code: ErrorCode.SUBSCRIPTION_INACTIVE,
      };
    }

    // -- Plan feature check --
    const planBlocked = permissions.find((p) => !planAllows(ctx.plan, p));
    if (planBlocked) {
      return {
        success: false,
        error: `This feature is not available on your current plan.`,
        code: ErrorCode.PLAN_UPGRADE_REQUIRED,
      };
    }

    return handler(ctx, input);
  };
}
```

> **Note on performance**: This adds one DB query per request to fetch `plan` and `subscriptionStatus`. Cache this with React's `cache()` — same pattern as `getSession()` — so it's fetched once per request regardless of how many actions are called.
>
> **Denormalisation option**: If the extra query becomes a bottleneck in production, add `plan` and `subscriptionStatus` directly to the `User` model in the database. Because the `User` object is already loaded during the session check, the plan fields come for free — no second query needed. The trade-off is that you must keep the `User` row in sync whenever a tenant changes plan (e.g., from the Stripe webhook). This is a straightforward `prisma.user.updateMany({ where: { tenantId } })` call inside the webhook handler, so the maintenance cost is low.

### 3.4 Usage cap enforcement (in individual create actions)

Usage caps are enforced at the mutation level only — not in the HOF, because they require entity-specific counts.

```ts
// Example: src/actions/crm/customers/mutations.ts
export const createCustomer = withTenantPermission<CreateCustomerInput, CustomerListItem>(
  'canManageCustomers',
  async (ctx, data) => {
    // Usage cap check
    const limit = PLAN_LIMITS[ctx.plan].customers;
    if (limit !== null) {
      const count = await customerRepo.countByTenant(ctx.tenantId);
      if (count >= limit) {
        return {
          success: false,
          error: `Your plan allows up to ${limit} customers. Upgrade to add more.`,
          code: ErrorCode.USAGE_LIMIT_REACHED,
        };
      }
    }

    // ... rest of action
  },
);
```

The `ctx.plan` is available because `TenantContext` now carries it — no extra queries needed here.

> **Race condition note**: The count-then-create pattern is not atomic. Concurrent requests (e.g. rapid double-submits or a script) could read the same count and both pass the check, resulting in a small overage. For a B2B tool this is acceptable — the window is narrow and the consequence is minor. If strict enforcement is required, replace the check with a database-level transaction and a locking count query, but that adds meaningful complexity for a rare edge case.

---

## Stage 4 — Stripe Integration

### 4.1 Install Stripe SDK

```bash
pnpm add stripe @stripe/stripe-js
```

### 4.2 Environment variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4.3 Stripe client singleton

**File**: `src/lib/stripe.ts`

```ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
```

### 4.4 Checkout session action

**File**: `src/actions/billing/mutations.ts`

```ts
'use server';

import { stripe } from '@/lib/stripe';
import { withTenant } from '@/lib/action-auth';
import { prisma } from '@/lib/prisma';

const PRICE_MAP: Record<string, string> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID!,
  GROWTH: process.env.STRIPE_GROWTH_PRICE_ID!,
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
};

/**
 * Creates a Stripe Checkout session for the given plan and returns the URL.
 * @param plan - The plan to subscribe to (STARTER | GROWTH | PRO)
 * @returns An ActionResult containing the Stripe Checkout URL
 */
export const createCheckoutSession = withTenant<string, { url: string }>(async (ctx, plan) => {
  const priceId = PRICE_MAP[plan];
  if (!priceId) {
    return { success: false, error: 'Invalid plan selected' };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { stripeCustomerId: true, settings: { select: { email: true } } },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: tenant?.stripeCustomerId ?? undefined,
    customer_email: tenant?.stripeCustomerId ? undefined : (tenant?.settings?.email ?? undefined),
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { tenantId: ctx.tenantId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
  });

  if (!session.url) {
    return { success: false, error: 'Failed to create checkout session' };
  }

  return { success: true, data: { url: session.url } };
});

/**
 * Creates a Stripe Customer Portal session for managing billing.
 * @returns An ActionResult containing the portal URL
 */
export const createBillingPortalSession = withTenant<void, { url: string }>(async (ctx) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant?.stripeCustomerId) {
    return { success: false, error: 'No billing account found' };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });

  return { success: true, data: { url: session.url } };
});
```

### 4.5 Webhook handler

**File**: `src/app/api/webhooks/stripe/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type Stripe from 'stripe';

const PLAN_BY_PRICE: Record<string, 'STARTER' | 'GROWTH' | 'PRO'> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: 'STARTER',
  [process.env.STRIPE_GROWTH_PRICE_ID!]: 'GROWTH',
  [process.env.STRIPE_PRO_PRICE_ID!]: 'PRO',
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        if (!tenantId || !session.subscription || !session.customer) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PLAN_BY_PRICE[priceId] ?? 'STARTER';

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            plan,
            subscriptionStatus: 'ACTIVE',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialEndsAt: null,
          },
        });

        logger.info('Subscription activated', {
          context: 'stripe-webhook',
          metadata: { tenantId, plan },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { id: true },
        });
        if (!tenant) break;

        const priceId = subscription.items.data[0]?.price.id;
        const plan = PLAN_BY_PRICE[priceId] ?? 'STARTER';
        const statusMap: Record<string, string> = {
          active: 'ACTIVE',
          trialing: 'TRIALING',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
        };

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan,
            subscriptionStatus: statusMap[subscription.status] ?? 'ACTIVE',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { id: true },
        });
        if (!tenant) break;

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { subscriptionStatus: 'CANCELED' },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const tenant = await prisma.tenant.findUnique({
          where: { stripeSubscriptionId: invoice.subscription as string },
          select: { id: true },
        });
        if (!tenant) break;

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { subscriptionStatus: 'PAST_DUE' },
        });
        break;
      }
    }
  } catch (error) {
    logger.error('Stripe webhook handler failed', {
      context: 'stripe-webhook',
      metadata: { eventType: event.type, error: String(error) },
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

> The webhook route must be excluded from Next.js body parsing. Add to `next.config.ts`:
>
> ```ts
> // No action needed — App Router does not auto-parse body
> ```

---

## Stage 5 — Trial Expiry (Inngest)

**File**: `src/lib/inngest/functions/expire-trials.ts`

```ts
import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Scheduled function that runs daily and suspends tenants whose trial
 * has ended without a paid subscription.
 */
export const expireTrialsFunction = inngest.createFunction(
  { id: 'expire-trials', name: 'Expire ended trials' },
  { cron: '0 2 * * *' }, // 2am daily
  async () => {
    const expired = await prisma.tenant.findMany({
      where: {
        plan: 'TRIAL',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { lte: new Date() },
      },
      select: { id: true },
    });

    for (const tenant of expired) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: 'CANCELED' },
      });

      logger.info('Trial expired', {
        context: 'expire-trials',
        metadata: { tenantId: tenant.id },
      });

      // Optionally: fire email/send.trial-expired event here
    }

    return { expired: expired.length };
  },
);
```

Register it alongside the other functions in `src/lib/inngest/functions/index.ts`.

---

## Stage 6 — Tenant Provisioning Update

When a new tenant is created (via invitation or super admin), set trial defaults:

**File**: `src/actions/admin/tenants/mutations.ts` (or wherever `prisma.tenant.create` is called)

```ts
await prisma.tenant.create({
  data: {
    name,
    slug,
    plan: 'TRIAL',
    subscriptionStatus: 'TRIALING',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  },
});
```

---

## Stage 7 — UI Layer

### 7.1 Error code handling in hooks

The hooks in `src/features/**/hooks/` already throw on action failure. Extend them to detect billing error codes:

```ts
// src/features/shared/hooks/use-billing-error.ts
import { ErrorCode } from '@/lib/errors';

export function isBillingError(error: Error): boolean {
  return (
    error.message.includes(ErrorCode.PLAN_UPGRADE_REQUIRED) ||
    error.message.includes(ErrorCode.SUBSCRIPTION_INACTIVE)
  );
}
```

### 7.2 `<PlanUpsell />` component

**File**: `src/components/shared/plan-upsell.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PlanUpsellProps {
  feature: string;
  requiredPlan: 'GROWTH' | 'PRO';
}

export function PlanUpsell({ feature, requiredPlan }: PlanUpsellProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h3 className="font-semibold">{feature} is not available on your plan</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Upgrade to {requiredPlan} to unlock this feature.
      </p>
      <Button className="mt-4" onClick={() => router.push('/settings/billing')}>
        View plans
      </Button>
    </div>
  );
}
```

Usage — wrap a page section:

```tsx
// Before rendering inventory features
if (result.success === false && result.code === 'BIZ_007') {
  return <PlanUpsell feature="Inventory management" requiredPlan="GROWTH" />;
}
```

### 7.3 Billing settings page

**File**: `src/app/(protected)/settings/billing/page.tsx`

- Show current plan, status, next billing date
- "Upgrade" button → calls `createCheckoutSession` → redirect to Stripe
- "Manage billing" button → calls `createBillingPortalSession` → redirect to Stripe Portal
- Trial countdown banner if `subscriptionStatus === 'TRIALING'`

### 7.4 Past-due banner

Add a site-wide banner in the root layout that appears when `subscriptionStatus === 'PAST_DUE'`:

```tsx
// src/app/(protected)/layout.tsx
{
  tenant.subscriptionStatus === 'PAST_DUE' && (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-sm">
      Your payment is overdue. Data is read-only until resolved.{' '}
      <button onClick={openBillingPortal} className="underline font-medium">
        Update payment details
      </button>
    </div>
  );
}
```

---

## Implementation Order

| #   | Stage                           | Effort | Can ship alone?                  |
| --- | ------------------------------- | ------ | -------------------------------- |
| 1   | Prisma schema + migration       | Small  | Yes — no visible changes         |
| 2   | Plan limits in `permissions.ts` | Small  | Yes                              |
| 3   | HOF enforcement                 | Medium | Yes — gates features immediately |
| 4   | Stripe checkout + webhook       | Medium | Yes — enables upgrades           |
| 5   | Trial expiry (Inngest)          | Small  | Yes                              |
| 6   | Tenant provisioning             | Tiny   | Yes                              |
| 7   | UI layer                        | Medium | Yes                              |

Start with stages 1–3 to get enforcement in place before any Stripe account is needed. Stages 4–7 can follow once the plan structure is validated.

---

## What to Configure in Stripe Dashboard

1. Create three Products: Starter, Growth, Pro — each with a monthly recurring price.
2. Copy the three Price IDs into `.env`.
3. Add a webhook endpoint pointing at `/api/webhooks/stripe`.
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Enable the Customer Portal in the Stripe Dashboard (Billing → Customer Portal → Activate).
