import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { fakeAbn, fakeAuPhone } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedVendorsOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Data --------------------------------------------------------------------

const VENDOR_TYPES = [
  { suffix: 'Flower Market', category: 'wholesale' },
  { suffix: 'Nursery & Growers', category: 'wholesale' },
  { suffix: 'Floral Supplies', category: 'supplies' },
  { suffix: 'Eco Packaging', category: 'supplies' },
  { suffix: 'Logistics & Couriers', category: 'delivery' },
  { suffix: 'Premium Orchid Growers', category: 'wholesale' },
  { suffix: 'Event Equipment Hire', category: 'services' },
  { suffix: 'Design Studio Supplies', category: 'supplies' },
] as const;

// -- Helpers -----------------------------------------------------------------

function buildVendor() {
  const type = faker.helpers.arrayElement(VENDOR_TYPES);
  const city = faker.location.city();
  const name = `${city} ${type.suffix}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    name,
    email: `orders@${slug}.com.au`,
    phone: faker.helpers.maybe(() => fakeAuPhone(), { probability: 0.85 }) ?? null,
    abn: faker.helpers.maybe(() => fakeAbn(), { probability: 0.8 }) ?? null,
    status: faker.helpers.weightedArrayElement([
      { value: 'ACTIVE' as const, weight: 0.9 },
      { value: 'INACTIVE' as const, weight: 0.1 },
    ]),
    address: null,
    website: faker.helpers.maybe(() => `https://www.${slug}.com.au`, { probability: 0.6 }) ?? null,
    paymentTerms: faker.helpers.arrayElement([7, 14, 30, 60]),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) ?? null,
  };
}

// -- Seed function -----------------------------------------------------------

/**
 * Seeds wholesale suppliers and vendors for each supplied tenant.
 * Each tenant gets its own independent set of vendor records.
 * Vendor codes are generated inline as VEN-{year}-{counter}.
 * @param options - The tenants to seed for and optional count per tenant.
 * @returns The total number of vendors created across all tenants.
 */
export async function seedVendors(options: SeedVendorsOptions): Promise<number> {
  const { tenants, countPerTenant = 8 } = options;

  console.log(`\n🏪 Seeding vendors for ${tenants.length} tenant(s)...`);

  let total = 0;

  const year = new Date().getFullYear();

  for (const tenant of tenants) {
    const lastVendor = await prisma.vendor.findFirst({
      where: { tenantId: tenant.id, vendorCode: { startsWith: `VEN-${year}-` } },
      orderBy: { vendorCode: 'desc' },
      select: { vendorCode: true },
    });
    const startCounter = lastVendor ? parseInt(lastVendor.vendorCode.split('-')[2], 10) + 1 : 1;

    const creates = Array.from({ length: countPerTenant }, (_, i) => {
      const vendor = buildVendor();
      const vendorCode = `VEN-${year}-${String(startCounter + i).padStart(4, '0')}`;
      return prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          vendorCode,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          abn: vendor.abn,
          status: vendor.status,
          website: vendor.website,
          paymentTerms: vendor.paymentTerms,
          notes: vendor.notes,
        },
      });
    });

    await Promise.all(creates);
    total += countPerTenant;
    console.log(`   ✅ ${tenant.name}: ${countPerTenant} vendors`);
  }

  console.log(`✅ Created ${total} vendor(s) across ${tenants.length} tenant(s)`);
  return total;
}

// -- CLI entry point ---------------------------------------------------------

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  (async () => {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });

    if (tenants.length === 0) {
      console.error('No tenants found. Run seed-tenants.ts first.');
      process.exit(1);
    }

    const seededTenants = tenants.map((t) => ({
      ...t,
      adminEmail: '',
      managerEmail: '',
      password: '',
    }));

    await seedVendors({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
