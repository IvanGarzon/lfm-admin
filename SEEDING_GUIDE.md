# 🌱 Database Seeding Guide

## Quick Start (One Command)

Run everything at once:

```bash
pnpm seed:all
```

This will:

1. ✅ Create 8 Organizations
2. ✅ Create 50 Customers (some linked to organizations)
3. ✅ Create ~40 Products (services and physical products)
4. ✅ Create 50 Invoices with items

---

## Individual Seed Scripts

### Seed Base Data Only

```bash
pnpm seed:base
```

Creates:

- 8 Organizations across all Australian states
- 50 Customers with realistic data
- ~40 Products (services and physical items)

### Seed Invoices Only

```bash
pnpm seed:invoices
```

Creates:

- 50 Invoices with various statuses
- Multiple invoice items per invoice
- Links to existing customers and products

**Note:** Requires customers to exist first!

---

## What Gets Created

### 🏢 Organizations (8 total)

- Tech Innovations Pty Ltd (VIC)
- Green Energy Solutions (NSW)
- Digital Marketing Group (QLD)
- Healthcare Plus (WA)
- Education First Academy (SA)
- Construction Experts Ltd (TAS)
- Financial Services Group (ACT)
- Retail Dynamics (NT)

### 👥 Customers (50 total)

- Random first/last names
- Unique email addresses
- Australian phone numbers
- 30% linked to organizations
- 90% active, 10% inactive
- Male/Female gender

### 📦 Products (~40 total)

**Services:**

- Web Development ($5k-$20k)
- Mobile App Development ($8k-$30k)
- UI/UX Design ($3k-$10k)
- SEO Optimization ($2k-$8k)
- Digital Marketing ($5k-$15k)
- Consulting Services ($2.5k-$12k)
- Cloud Infrastructure ($4k-$15k)
- Database Optimization ($2k-$8k)
- Security Audit ($3k-$12k)
- API Integration ($2.8k-$10k)

**Products:**

- Premium Software License ($500-$5k)
- Hardware Equipment ($1k-$8k)
- Training Materials ($200-$2k)
- Support Package ($1k-$5k)
- Maintenance Contract ($2k-$10k)

Each category has 2-3 variations (Basic, Standard, Premium, Enterprise)

### 📄 Invoices (50 total)

- Status distribution:
  - ~17 Pending
  - ~17 Paid
  - ~16 Cancelled
- Date range: January 2024 - Present
- 1-5 items per invoice
- Realistic amounts based on products/services
- Payment methods (for paid): Bank Transfer, Credit Card, PayPal, Cash, Cheque
- Cancellation reasons (for cancelled)
- Reminder counters (for pending)

---

## Verification

After seeding, you can verify with Prisma Studio:

```bash
pnpm prisma studio
```

Or check programmatically:

```bash
pnpm exec tsx -e "
import { PrismaClient } from '@/prisma/client';
const prisma = new PrismaClient();
async function check() {
  console.log('Organizations:', await prisma.organization.count());
  console.log('Customers:', await prisma.customer.count());
  console.log('Products:', await prisma.product.count());
  console.log('Invoices:', await prisma.invoice.count());
}
check().finally(() => prisma.\$disconnect());
"
```

---

## Reset and Re-seed

If you want to start fresh:

```bash
# Reset database (⚠️ DELETES ALL DATA)
pnpm prisma migrate reset

# Seed everything
pnpm seed:all
```

---

## Troubleshooting

### "No customers found"

Run base seed first:

```bash
pnpm seed:base
```

### "Unique constraint failed"

Some emails might conflict. The script skips duplicates automatically.

### "Table doesn't exist"

Run migrations first:

```bash
pnpm migrate:dev
pnpm prisma generate
```

### Want more data?

Edit the seed files:

- `prisma/seed-base.ts` - Change loop from 50 to 100 for more customers
- `prisma/seed-invoices.ts` - Change loop from 50 to 100 for more invoices

---

## Seed Script Details

### seed-base.ts

- Uses @faker-js/faker for realistic data
- Creates Australian addresses with proper states
- Generates valid phone numbers (04xx or +614xx)
- Links customers to organizations (30% probability)
- Creates product variations automatically

### seed-invoices.ts

- Randomly selects customers and products
- Generates proper invoice numbers (INV-2024-XXXX)
- Calculates totals automatically
- Assigns realistic status-specific data
- Creates invoice items with quantities and prices

### seed-all.ts

- Checks existing data before seeding
- Skips steps if data already exists
- Runs scripts in correct order
- Shows summary at the end

---

## Next Steps

After seeding:

1. ✅ Start dev server: `pnpm dev`
2. ✅ Navigate to `/finances/invoices`
3. ✅ See your 50 seeded invoices!
4. ✅ Test filtering, search, and actions

---

**Happy seeding!** 🌱
