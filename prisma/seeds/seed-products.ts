import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';

// -- Types -------------------------------------------------------------------

export type SeedProductsOptions = {
  tenants: SeededTenant[];
};

// -- Data --------------------------------------------------------------------

const FLORIST_CATALOGUE = [
  {
    category: 'Fresh Flowers',
    items: [
      { name: 'Premium Roses - Red', priceRange: [80, 250], stock: [20, 50] },
      { name: 'Premium Roses - White', priceRange: [80, 250], stock: [20, 50] },
      { name: 'Premium Roses - Pink', priceRange: [80, 250], stock: [20, 50] },
      { name: 'Premium Roses - Yellow', priceRange: [80, 250], stock: [20, 50] },
      { name: 'Tulips - Mixed Colors', priceRange: [60, 150], stock: [15, 40] },
      { name: 'Lilies - Oriental', priceRange: [90, 200], stock: [10, 30] },
      { name: 'Orchids - Phalaenopsis', priceRange: [120, 300], stock: [5, 20] },
      { name: 'Peonies - Seasonal', priceRange: [150, 350], stock: [5, 15] },
      { name: 'Sunflowers - Large', priceRange: [50, 120], stock: [20, 40] },
      { name: 'Hydrangeas - Premium', priceRange: [70, 180], stock: [15, 35] },
      { name: 'Gerberas - Mixed', priceRange: [40, 100], stock: [25, 50] },
      { name: 'Carnations - Standard', priceRange: [30, 80], stock: [30, 60] },
    ],
  },
  {
    category: 'Bouquets',
    items: [
      { name: 'Classic Hand-Tied Bouquet', priceRange: [120, 300], stock: null },
      { name: 'Luxury Bridal Bouquet', priceRange: [350, 800], stock: null },
      { name: 'Bridesmaid Bouquet', priceRange: [100, 250], stock: null },
      { name: 'Romantic Rose Bouquet', priceRange: [150, 400], stock: null },
      { name: 'Seasonal Mixed Bouquet', priceRange: [100, 280], stock: null },
      { name: 'Sympathy Bouquet', priceRange: [120, 350], stock: null },
      { name: 'Birthday Celebration Bouquet', priceRange: [90, 220], stock: null },
      { name: 'Get Well Soon Bouquet', priceRange: [80, 180], stock: null },
    ],
  },
  {
    category: 'Wedding Services',
    items: [
      { name: 'Full Wedding Floral Package', priceRange: [3000, 12000], stock: null },
      { name: 'Ceremony Arch Decoration', priceRange: [800, 2500], stock: null },
      { name: 'Reception Table Centrepieces (per table)', priceRange: [80, 250], stock: null },
      { name: 'Bridal Party Flowers Package', priceRange: [600, 1800], stock: null },
      { name: 'Church Pew Decorations (per pew)', priceRange: [40, 120], stock: null },
      { name: 'Wedding Car Decoration', priceRange: [150, 400], stock: null },
    ],
  },
  {
    category: 'Corporate Services',
    items: [
      { name: 'Corporate Event Centrepiece', priceRange: [100, 350], stock: null },
      { name: 'Office Weekly Flower Service', priceRange: [200, 600], stock: null },
      { name: 'Conference Table Arrangement', priceRange: [150, 450], stock: null },
      { name: 'Corporate Gift Hamper with Flowers', priceRange: [120, 300], stock: null },
      { name: 'Reception Desk Display', priceRange: [180, 500], stock: null },
    ],
  },
  {
    category: 'Funeral Services',
    items: [
      { name: 'Funeral Wreath - Standard', priceRange: [200, 500], stock: null },
      { name: 'Funeral Wreath - Premium', priceRange: [500, 1200], stock: null },
      { name: 'Casket Spray', priceRange: [400, 1000], stock: null },
      { name: 'Standing Spray', priceRange: [300, 800], stock: null },
      { name: 'Sympathy Basket', priceRange: [150, 400], stock: null },
    ],
  },
  {
    category: 'Specialty Arrangements',
    items: [
      { name: 'Preserved Rose Box - Small', priceRange: [150, 300], stock: [10, 25] },
      { name: 'Preserved Rose Box - Large', priceRange: [300, 600], stock: [5, 15] },
      { name: 'Succulent Garden Arrangement', priceRange: [80, 200], stock: [15, 30] },
      { name: 'Orchid Plant - Potted', priceRange: [100, 250], stock: [10, 25] },
      { name: 'Tropical Arrangement - Large', priceRange: [200, 500], stock: null },
      { name: 'Seasonal Flower Subscription (Monthly)', priceRange: [400, 1200], stock: null },
    ],
  },
  {
    category: 'Add-ons & Extras',
    items: [
      { name: 'Premium Gift Wrapping', priceRange: [15, 40], stock: [50, 100] },
      { name: 'Personalised Message Card', priceRange: [5, 15], stock: [100, 200] },
      { name: 'Decorative Vase - Glass', priceRange: [30, 100], stock: [20, 50] },
      { name: 'Decorative Vase - Ceramic', priceRange: [40, 120], stock: [15, 40] },
      { name: 'Flower Food & Care Kit', priceRange: [10, 25], stock: [50, 100] },
      { name: 'Balloon Bouquet Add-on', priceRange: [30, 80], stock: [30, 60] },
      { name: 'Chocolate Box Add-on', priceRange: [25, 80], stock: [40, 80] },
      { name: 'Teddy Bear Add-on', priceRange: [20, 60], stock: [30, 60] },
    ],
  },
] as const;

// -- Helpers -----------------------------------------------------------------

type CatalogueItem = {
  name: string;
  priceRange: readonly [number, number];
  stock: readonly [number, number] | null;
};

function buildProduct(item: CatalogueItem) {
  return {
    name: item.name,
    description: faker.helpers.arrayElement([
      `Beautiful ${item.name.toLowerCase()} perfect for any occasion.`,
      `Premium quality ${item.name.toLowerCase()} hand-selected by our expert florists.`,
      `Stunning ${item.name.toLowerCase()} to make your special day memorable.`,
      `Fresh ${item.name.toLowerCase()} delivered with care.`,
      `Elegant ${item.name.toLowerCase()} designed to impress.`,
    ]),
    price: faker.number.float({
      min: item.priceRange[0],
      max: item.priceRange[1],
      multipleOf: 5,
    }),
    stock: item.stock ? faker.number.int({ min: item.stock[0], max: item.stock[1] }) : 999,
    status: faker.helpers.weightedArrayElement([
      { value: 'ACTIVE' as const, weight: 0.9 },
      { value: 'INACTIVE' as const, weight: 0.05 },
      { value: 'OUT_OF_STOCK' as const, weight: 0.05 },
    ]),
    imageUrl:
      faker.helpers.maybe(
        () => `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/300`,
        { probability: 0.7 },
      ) ?? null,
    availableAt: faker.date.recent({ days: 30 }),
  };
}

// -- Seed function -----------------------------------------------------------

/**
 * Seeds the full florist product catalogue for each supplied tenant.
 * Each tenant receives its own independent copy of all products so that
 * data is properly isolated by tenant.
 * @param options - An array of seeded tenant records returned by seedTenants.
 * @returns The total number of products created across all tenants.
 */
export async function seedProducts(options: SeedProductsOptions): Promise<number> {
  const { tenants } = options;

  console.log(`\n🌸 Seeding products for ${tenants.length} tenant(s)...`);

  const allItems: CatalogueItem[] = FLORIST_CATALOGUE.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      priceRange: item.priceRange,
      stock: item.stock as readonly [number, number] | null,
    })),
  );

  let total = 0;

  for (const tenant of tenants) {
    const creates = allItems.map((item) => {
      const product = buildProduct(item);
      return prisma.product.create({
        data: {
          tenantId: tenant.id,
          name: product.name,
          description: product.description,
          status: product.status,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          availableAt: product.availableAt,
        },
      });
    });

    await Promise.all(creates);

    total += allItems.length;
    console.log(`   ✅ ${tenant.name}: ${allItems.length} products`);
  }

  console.log(`✅ Created ${total} product(s) across ${tenants.length} tenant(s)`);
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

    await seedProducts({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
