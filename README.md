# Las Flores Melbourne — Admin Dashboard

Internal business management platform for Las Flores Melbourne. Built with Next.js App Router, TypeScript, and Prisma.

---

## Multi-Tenancy

The platform is fully multi-tenant. Every resource (customers, invoices, products, employees, etc.) is scoped to a tenant via `tenantId` enforced at the repository layer — no cross-tenant data leakage is possible.

- **Tenant isolation** — All database queries include `tenantId` in the `where` clause.
- **RBAC** — Role-based access control is scoped per tenant. Roles: `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, and others — each with a defined permission policy.
- **Invitations** — Users are invited to a tenant via email. Accepted invitations create a tenant-scoped user record.
- **Super Admin** — Super admins can manage all tenants and switch the active tenant context via a session cookie (`sa_active_tenant_id`).
- **Tenant settings** — Each tenant has its own configurable settings (branding, defaults, etc.).

---

## Features

### Overview

Dashboard with key business metrics — revenue charts, recent sales, and summary stats.

### CRM

- **Customers** — Create, search, and manage customer profiles with contact details and linked organisations.
- **Organisations** — Group customers under organisations; manage org-level contact and billing info.

### Finances

- **Invoices** — Full invoice lifecycle: create, send, record payments, cancel. PDF preview. Analytics dashboard.
- **Quotes** — Create and manage quotes, convert to invoices. PDF preview and analytics.
- **Transactions** — Record and categorise income/expense transactions. Analytics and filtering.
- **Recipes** — Cost recipes linked to products for COGS tracking, grouped by recipe groups.

### Inventory

- **Products** — Manage product catalogue with pricing, categories, and stock.
- **Vendors** — Supplier management with contact details and linked products.
- **Price List** — Maintain customer-facing price lists linked to products.

### Staff

- **Employees** — Employee records with roles, contact info, and employment details.

### Files

- File browser with upload, folder view, and list view. Backed by AWS S3 (LocalStack for local dev).

### Tasks

- Background job monitoring via Inngest — view execution history, steps, results, and error details.

### Settings

- Tenant-scoped settings management.

### Admin (Super Admin)

- **Tenants** — Create and manage tenants.
- **Users** — Manage all users across tenants.
- **Invitations** — Send and manage user invitations.

---

## Tech Stack

| Layer           | Technology               |
| --------------- | ------------------------ |
| Framework       | Next.js (App Router)     |
| Language        | TypeScript               |
| Styling         | Tailwind CSS + shadcn/ui |
| Database        | Neon PostgreSQL          |
| ORM             | Prisma                   |
| Auth            | NextAuth (Auth.js)       |
| File Storage    | AWS S3 / LocalStack      |
| Background Jobs | Inngest                  |
| Email           | Resend                   |
| Tests           | Vitest, Playwright       |
| Package Manager | pnpm                     |

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required services:

- **PostgreSQL** — Neon or any Postgres instance
- **NextAuth** — `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- **AWS S3 / LocalStack** — For file uploads (use LocalStack locally)
- **Resend** — For transactional email
- **Inngest** — For background jobs
- **Google Maps** — For address autocomplete (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

### 3. Set up the database

```bash
pnpm prisma migrate dev
```

### 4. Run the dev server

```bash
pnpm dev
```

Access the app at [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
src/
├── actions/        # Server actions (mutations + queries)
├── features/       # UI feature modules (components, hooks, types)
├── repositories/   # Database access layer (Prisma)
├── schemas/        # Zod validation schemas
├── filters/        # URL search param parsers (nuqs)
├── components/     # Shared UI components
├── lib/            # Auth, utilities, permissions, error handling
├── app/            # Next.js routes and pages
└── types/          # Global TypeScript types
```

Data flow: `UI Component → Hook → Server Action → Repository → Prisma → Database`

---

## Running Tests

```bash
# Unit tests
pnpm vitest

# E2E tests
pnpm playwright test
```
