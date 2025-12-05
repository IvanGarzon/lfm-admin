# Database Seed Scripts

This directory contains comprehensive seed scripts for populating the Las Flores Admin database with realistic florist industry data.

## Seed Files Structure

All seed files are located in the `seeds/` directory. Each entity has its own dedicated seed file:

### Individual Seed Files

- **[seeds/seed-organizations.ts](seeds/seed-organizations.ts)** - Florist industry organizations (event planners, wedding coordinators, hotels)
- **[seeds/seed-customers.ts](seeds/seed-customers.ts)** - Customer records with optional organization links
- **[seeds/seed-products.ts](seeds/seed-products.ts)** - Florist products and services
- **[seeds/seed-employees.ts](seeds/seed-employees.ts)** - Employee records
- **[seeds/seed-invoices.ts](seeds/seed-invoices.ts)** - Invoices with items
- **[seeds/seed-quotes.ts](seeds/seed-quotes.ts)** - Quotes with items and status history

### Master Seed File

- **[seeds/seed-all.ts](seeds/seed-all.ts)** - Orchestrates all seed scripts in the correct order

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
pnpm prisma.seed.all
```

This will run all seed scripts in order:
1. Organizations (10 records)
2. Customers (50 records)
3. Products (~80 florist items)
4. Employees (30 records)
5. Invoices (60 with items)
6. Quotes (40 with items)

### Run Individual Seeds

```bash
# Organizations
pnpm exec tsx prisma/seeds/seed-organizations.ts

# Customers
pnpm exec tsx prisma/seeds/seed-customers.ts

# Products
pnpm exec tsx prisma/seeds/seed-products.ts

# Employees
pnpm exec tsx prisma/seeds/seed-employees.ts

# Invoices
pnpm exec tsx prisma/seeds/seed-invoices.ts

# Quotes
pnpm exec tsx prisma/seeds/seed-quotes.ts
```

### Reset Database and Reseed

```bash
# This will DROP all data and recreate from migrations
npx prisma migrate reset

# Then run seeds
pnpm prisma.seed.all
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

## Smart Skipping

The master seed script ([seed-all.ts](seed-all.ts)) checks if data already exists before running each seed:
- If data exists, it skips that seed
- Shows a summary of existing counts
- Only seeds what's missing

## Australian Data

All data follows Australian conventions:
- Phone numbers: `04XXXXXXXX` or `+614XXXXXXXX`
- States: VIC, NSW, QLD, WA, SA, TAS, ACT, NT
- Currency: AUD
- Realistic Australian city names and postcodes
