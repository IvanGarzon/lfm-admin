import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { batchAll } from './seed-helpers';

/**
 * Seed Price List Items
 * Creates wholesale flower, foliage, and supply items for recipe costing
 */

const floralItems = [
  // Roses
  {
    name: 'Rose - Red Freedom',
    costPerUnit: 4.5,
    retailPrice: 13.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'Rose - White Avalanche',
    costPerUnit: 4.2,
    retailPrice: 12.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'Rose - Pink Engagement',
    costPerUnit: 4.8,
    retailPrice: 14.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'Rose - Yellow Aalsmeer Gold',
    costPerUnit: 4.3,
    retailPrice: 12.9,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'Rose - Peach Juliet',
    costPerUnit: 5.5,
    retailPrice: 16.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'Spring/Summer',
  },
  {
    name: 'Rose - Lavender Ocean Song',
    costPerUnit: 5.2,
    retailPrice: 15.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'David Austin Rose - Patience',
    costPerUnit: 8.5,
    retailPrice: 25.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring/Summer',
  },
  {
    name: 'Spray Rose - Lavender',
    costPerUnit: 3.2,
    retailPrice: 9.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },

  // Peonies
  {
    name: 'Peony - Pink Sarah Bernhardt',
    costPerUnit: 12,
    retailPrice: 36,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring',
  },
  {
    name: 'Peony - White Duchesse de Nemours',
    costPerUnit: 12.5,
    retailPrice: 37.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring',
  },
  {
    name: 'Peony - Coral Charm',
    costPerUnit: 14,
    retailPrice: 42,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring',
  },

  // Ranunculus
  {
    name: 'Ranunculus - White',
    costPerUnit: 2.8,
    retailPrice: 8.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Ranunculus - Pink',
    costPerUnit: 2.8,
    retailPrice: 8.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Ranunculus - Peach',
    costPerUnit: 3,
    retailPrice: 9,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Ranunculus - Mixed Pastel',
    costPerUnit: 2.9,
    retailPrice: 8.7,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },

  // Tulips
  {
    name: 'Tulip - White',
    costPerUnit: 2.2,
    retailPrice: 6.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Tulip - Pink',
    costPerUnit: 2.2,
    retailPrice: 6.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Tulip - Purple',
    costPerUnit: 2.5,
    retailPrice: 7.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Tulip - Yellow',
    costPerUnit: 2.2,
    retailPrice: 6.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'French Tulip - Parrot Mix',
    costPerUnit: 3.5,
    retailPrice: 10.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring',
  },

  // Lilies
  {
    name: 'Oriental Lily - White Casa Blanca',
    costPerUnit: 6.5,
    retailPrice: 19.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Oriental Lily - Pink Stargazer',
    costPerUnit: 6.2,
    retailPrice: 18.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Asiatic Lily - Orange',
    costPerUnit: 4.5,
    retailPrice: 13.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'LA Hybrid Lily - Pink',
    costPerUnit: 5.5,
    retailPrice: 16.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },

  // Hydrangeas
  {
    name: 'Hydrangea - White',
    costPerUnit: 15,
    retailPrice: 45,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'Summer/Autumn',
  },
  {
    name: 'Hydrangea - Blue',
    costPerUnit: 16,
    retailPrice: 48,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'Summer/Autumn',
  },
  {
    name: 'Hydrangea - Pink',
    costPerUnit: 15.5,
    retailPrice: 46.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'Summer/Autumn',
  },
  {
    name: 'Hydrangea - Green',
    costPerUnit: 18,
    retailPrice: 54,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'Summer/Autumn',
  },

  // Other Premium Flowers
  {
    name: 'Orchid - Cymbidium White',
    costPerUnit: 18,
    retailPrice: 54,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 1,
    season: 'All Year',
  },
  {
    name: 'Orchid - Phalaenopsis White',
    costPerUnit: 22,
    retailPrice: 66,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 1,
    season: 'All Year',
  },
  {
    name: 'Orchid - Dendrobium Purple',
    costPerUnit: 12,
    retailPrice: 36,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'All Year',
  },
  {
    name: 'Calla Lily - White',
    costPerUnit: 5.5,
    retailPrice: 16.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Calla Lily - Pink',
    costPerUnit: 6,
    retailPrice: 18,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Dahlia - Cafe au Lait',
    costPerUnit: 8.5,
    retailPrice: 25.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Summer/Autumn',
  },
  {
    name: 'Anemone - White',
    costPerUnit: 2.5,
    retailPrice: 7.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Winter/Spring',
  },
  {
    name: 'Sweet Pea - Mixed',
    costPerUnit: 3.8,
    retailPrice: 11.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring',
  },
  {
    name: 'Freesia - White',
    costPerUnit: 2.2,
    retailPrice: 6.6,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Stock - White',
    costPerUnit: 3.5,
    retailPrice: 10.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Delphinium - Blue',
    costPerUnit: 6.5,
    retailPrice: 19.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'Spring/Summer',
  },
  {
    name: 'Lisianthus - White',
    costPerUnit: 4.5,
    retailPrice: 13.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
  {
    name: 'Carnation - White',
    costPerUnit: 1.8,
    retailPrice: 5.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 20,
    season: 'All Year',
  },
  {
    name: 'Gerbera - Pink',
    costPerUnit: 2.8,
    retailPrice: 8.4,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
  },
];

const foliageItems = [
  // Greenery
  {
    name: 'Eucalyptus - Seeded',
    costPerUnit: 3.5,
    retailPrice: 10.5,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Eucalyptus - Silver Dollar',
    costPerUnit: 3.2,
    retailPrice: 9.6,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Eucalyptus - Baby Blue',
    costPerUnit: 3.8,
    retailPrice: 11.4,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Eucalyptus - Parvifolia',
    costPerUnit: 4.2,
    retailPrice: 12.6,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Ruscus - Italian',
    costPerUnit: 2.8,
    retailPrice: 8.4,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Leather Leaf Fern',
    costPerUnit: 2.2,
    retailPrice: 6.6,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Aspidistra Leaf',
    costPerUnit: 2.5,
    retailPrice: 7.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 10,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Monstera Leaf',
    costPerUnit: 4.5,
    retailPrice: 13.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Palm Leaf - Areca',
    costPerUnit: 5,
    retailPrice: 15,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Ivy - English',
    costPerUnit: 3,
    retailPrice: 9,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Salal - Tips',
    costPerUnit: 2.5,
    retailPrice: 7.5,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Pittosporum',
    costPerUnit: 2.8,
    retailPrice: 8.4,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Olive Branch',
    costPerUnit: 6,
    retailPrice: 18,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Wax Flower - White',
    costPerUnit: 3.2,
    retailPrice: 9.6,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Viburnum - Snowball',
    costPerUnit: 5.5,
    retailPrice: 16.5,
    multiplier: 3,
    unitType: 'stem',
    bunchSize: 5,
    season: 'Spring',
    category: 'FOLIAGE',
  },
  {
    name: 'Hypericum - Green',
    costPerUnit: 3.5,
    retailPrice: 10.5,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
  {
    name: 'Dusty Miller',
    costPerUnit: 3,
    retailPrice: 9,
    multiplier: 3,
    unitType: 'bunch',
    bunchSize: 1,
    season: 'All Year',
    category: 'FOLIAGE',
  },
];

const supplyItems = [
  // Supplies
  {
    name: 'Floral Foam - Standard Block',
    costPerUnit: 3.5,
    retailPrice: 10.5,
    multiplier: 3,
    unitType: 'block',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Floral Foam - Sphere 15cm',
    costPerUnit: 8,
    retailPrice: 24,
    multiplier: 3,
    unitType: 'each',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Floral Tape - Green',
    costPerUnit: 2.5,
    retailPrice: 7.5,
    multiplier: 3,
    unitType: 'roll',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Floral Wire - 22 Gauge',
    costPerUnit: 4,
    retailPrice: 12,
    multiplier: 3,
    unitType: 'pack',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Ribbon - Silk 25mm',
    costPerUnit: 6,
    retailPrice: 18,
    multiplier: 3,
    unitType: 'roll',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Ribbon - Organza 50mm',
    costPerUnit: 5,
    retailPrice: 15,
    multiplier: 3,
    unitType: 'roll',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Vase - Glass Cylinder 20cm',
    costPerUnit: 8.5,
    retailPrice: 25.5,
    multiplier: 3,
    unitType: 'each',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Vase - Glass Cylinder 30cm',
    costPerUnit: 12,
    retailPrice: 36,
    multiplier: 3,
    unitType: 'each',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Bouquet Wrap - Kraft Paper',
    costPerUnit: 1.2,
    retailPrice: 3.6,
    multiplier: 3,
    unitType: 'sheet',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Bouquet Wrap - Tissue Paper',
    costPerUnit: 0.8,
    retailPrice: 2.4,
    multiplier: 3,
    unitType: 'sheet',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Cellophane - Clear',
    costPerUnit: 1,
    retailPrice: 3,
    multiplier: 3,
    unitType: 'sheet',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
  {
    name: 'Pins - Corsage',
    costPerUnit: 2,
    retailPrice: 6,
    multiplier: 3,
    unitType: 'pack',
    bunchSize: null,
    season: null,
    category: 'SUPPLY',
  },
];

// -- Types -------------------------------------------------------------------

export type SeedPriceListItemsOptions = {
  tenants: SeededTenant[];
};

// -- Seed function -----------------------------------------------------------

/**
 * Seeds the full price list catalogue for each supplied tenant. Each tenant
 * receives its own independent copy of all price list items.
 * @param options - The tenants to seed for.
 * @returns The total number of price list items created across all tenants.
 */
export async function seedPriceListItems(options: SeedPriceListItemsOptions): Promise<number> {
  const { tenants } = options;

  console.log(`\n💐 Seeding price list items for ${tenants.length} tenant(s)...`);

  const allItems = [
    ...floralItems.map((item) => ({ ...item, category: 'FLORAL' as const })),
    ...foliageItems,
    ...supplyItems,
  ];

  let total = 0;

  for (const tenant of tenants) {
    const fns = allItems.map((item) => async () => {
      const retailPrice = Math.round(item.costPerUnit * item.multiplier * 100) / 100;
      return prisma.priceListItem.create({
        data: {
          tenantId: tenant.id,
          name: item.name,
          category: item.category,
          costPerUnit: item.costPerUnit,
          multiplier: item.multiplier,
          retailPrice,
          unitType: item.unitType,
          bunchSize: item.bunchSize,
          season: item.season,
          wholesalePrice: item.costPerUnit * 0.9,
          description:
            faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? null,
        },
        select: { id: true },
      });
    });

    const { results, failed } = await batchAll(fns);
    const created = results.length;
    total += created;

    const suffix = failed > 0 ? ` (${failed} failed)` : '';
    console.log(`   ✅ ${tenant.name}: ${created} price list items${suffix}`);
  }

  console.log(`✅ Created ${total} price list item(s) across ${tenants.length} tenant(s)`);
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

    await seedPriceListItems({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
