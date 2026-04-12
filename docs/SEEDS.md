# Database Seed Scripts

**Author:** Ivancho Garzon \<Lehenbizico>
**Last Updated:** 2026-04-12
**Status:** Current

---

This directory contains comprehensive seed scripts for populating the Las Flores Admin database with realistic florist industry data.

## Seed Files Structure

All seed files are located in the `seeds/` directory. Each entity has its own dedicated seed file:

### Individual Seed Files

- **[seeds/seed-organizations.ts](seeds/seed-organizations.ts)** - Florist industry organisations (event planners, wedding coordinators, hotels)
- **[seeds/seed-customers.ts](seeds/seed-customers.ts)** - Customer records with optional organisation links
- **[seeds/seed-products.ts](seeds/seed-products.ts)** - Florist products and services
- **[seeds/seed-employees.ts](seeds/seed-employees.ts)** - Employee records
- **[seeds/seed-invoices.ts](seeds/seed-invoices.ts)** - Invoices with items
- **[seeds/seed-quotes.ts](seeds/seed-quotes.ts)** - Quotes with items and status history
- **[seeds/seed-vendors.ts](seeds/seed-vendors.ts)** - Vendor records with contact and payment details
- **[seeds/seed-transactions.ts](seeds/seed-transactions.ts)** - Financial transactions linked to vendors
- **[seeds/seed-recipes.ts](seeds/seed-recipes.ts)** - Recipe and recipe item records
- **[seeds/seed-price-list-items.ts](seeds/seed-price-list-items.ts)** - Price list items for products
- **[seeds/seed-e2e-user.ts](seeds/seed-e2e-user.ts)** - End-to-end test user for Playwright tests

### Master Seed File

- **[seed.ts](seed.ts)** - Orchestrates all seed scripts in the correct dependency order. Also clears all tables before seeding to ensure a clean state.

## Product Categories

The florist products include:

### Fresh Flowers

- Premium Roses (Red, White, Pink, Yellow)
- Tulips, Lilies, Orchids, Peonies
- Sunflowers, Hydrangeas, Gerberas, Carnations

### Bouquets & Arrangements

- Hand-Tied Bouquets
- Bridal & Bridesmaid Bouquets
- Sympathy, Birthday, Get Well bouquets

### Event Services

- **Wedding Services**: Full packages, ceremony arches, centerpieces, bridal party flowers
- **Corporate Services**: Event centerpieces, office weekly service, conference arrangements
- **Funeral Services**: Wreaths, casket sprays, standing sprays, sympathy baskets

### Specialty Items

- Preserved Rose Boxes
- Succulent Gardens
- Potted Orchids
- Tropical Arrangements
- Flower Subscriptions

### Add-ons & Extras

- Gift wrapping, message cards
- Decorative vases (glass & ceramic)
- Flower care kits
- Balloon, chocolate, and teddy bear add-ons

## Usage

### Run All Seeds

```bash
pnpm prisma:seed
```

This will clear all tables and run all seed scripts in order:

1. Organisations (10 records)
2. Customers (50 records)
3. Products (~80 florist items)
4. Employees (30 records)
5. Invoices (60 with items)
6. Quotes (40 with items)
7. Vendors
8. Transactions
9. Recipes and recipe items
10. Price list items
11. E2E test user

### Run Individual Seeds

Individual seed files can be run directly with `tsx`:

```bash
pnpm tsx prisma/seeds/seed-organizations.ts
pnpm tsx prisma/seeds/seed-customers.ts
pnpm tsx prisma/seeds/seed-products.ts
pnpm tsx prisma/seeds/seed-employees.ts
pnpm tsx prisma/seeds/seed-invoices.ts
pnpm tsx prisma/seeds/seed-quotes.ts
pnpm tsx prisma/seeds/seed-vendors.ts
pnpm tsx prisma/seeds/seed-transactions.ts
pnpm tsx prisma/seeds/seed-recipes.ts
pnpm tsx prisma/seeds/seed-price-list-items.ts
pnpm tsx prisma/seeds/seed-e2e-user.ts
```

### Reset Database and Reseed

```bash
# This will DROP all data and recreate from migrations
pnpm prisma:reset

# Then run seeds
pnpm prisma:seed
```

## Data Characteristics

### Organizations

- 10 florist industry related businesses
- Spread across all Australian states
- Wedding planners, event coordinators, hotels

### Customers

- 50 individual customers
- 30% linked to organizations
- Australian phone numbers and realistic data

### Products

- ~80 florist products and services
- Realistic pricing (AUD)
- Mix of physical stock items and services
- Categories: Fresh Flowers, Bouquets, Wedding/Corporate/Funeral Services, Specialty Items, Add-ons

### Employees

- 30 employee records
- Hourly rates, avatars, contact info
- Australian phone numbers

### Invoices

- 60 invoices with various statuses
- DRAFT, PENDING, PAID, CANCELLED, OVERDUE
- 1-5 items per invoice
- GST (10%) and random discounts
- Receipt numbers for paid invoices
- Florist-specific item descriptions

### Quotes

- 40 quotes with various statuses
- Color palettes for flower arrangements
- Notes and terms fields
- Quote status history tracking
- 1-6 items per quote

## Australian Data

All data follows Australian conventions:

- Phone numbers: `04XXXXXXXX` or `+614XXXXXXXX`
- States: VIC, NSW, QLD, WA, SA, TAS, ACT, NT
- Currency: AUD
- Realistic Australian city names and postcodes
