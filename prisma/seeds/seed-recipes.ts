import { prisma } from '@/lib/prisma';
import { LabourCostType, RoundingMethod } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';

/**
 * Seed Recipes
 * Creates floral arrangement recipes with items from price list
 */

interface RecipeTemplate {
  name: string;
  description: string;
  labourCostType: LabourCostType;
  labourAmount: number;
  roundPrice: boolean;
  roundingMethod: RoundingMethod;
  items: Array<{
    searchTerm: string; // Will search for price list items matching this term
    quantity: number;
  }>;
}

const recipeTemplates: RecipeTemplate[] = [
  {
    name: 'Classic White & Green Bridal Bouquet',
    description: 'Elegant hand-tied bouquet featuring white roses, peonies, and lush greenery',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 85,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Rose - White', quantity: 12 },
      { searchTerm: 'Peony - White', quantity: 5 },
      { searchTerm: 'Ranunculus - White', quantity: 8 },
      { searchTerm: 'Lisianthus - White', quantity: 6 },
      { searchTerm: 'Eucalyptus - Seeded', quantity: 3 },
      { searchTerm: 'Eucalyptus - Silver Dollar', quantity: 2 },
      { searchTerm: 'Ribbon - Silk', quantity: 1 },
    ],
  },
  {
    name: 'Blush Pink Romance Bouquet',
    description: 'Romantic arrangement with soft pink roses, ranunculus, and delicate foliage',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 65,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Rose - Pink', quantity: 15 },
      { searchTerm: 'Ranunculus - Pink', quantity: 10 },
      { searchTerm: 'Spray Rose - Lavender', quantity: 5 },
      { searchTerm: 'Sweet Pea', quantity: 4 },
      { searchTerm: 'Eucalyptus - Baby Blue', quantity: 3 },
      { searchTerm: 'Ribbon - Organza', quantity: 1 },
    ],
  },
  {
    name: 'Vibrant Garden Mix Centerpiece',
    description: 'Colorful table centerpiece with seasonal mixed flowers',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 45,
    roundPrice: true,
    roundingMethod: RoundingMethod.NEAREST,
    items: [
      { searchTerm: 'Gerbera', quantity: 8 },
      { searchTerm: 'Tulip', quantity: 12 },
      { searchTerm: 'Carnation', quantity: 10 },
      { searchTerm: 'Freesia', quantity: 6 },
      { searchTerm: 'Wax Flower', quantity: 3 },
      { searchTerm: 'Ruscus', quantity: 2 },
      { searchTerm: 'Floral Foam - Standard', quantity: 1 },
      { searchTerm: 'Vase - Glass Cylinder 20cm', quantity: 1 },
    ],
  },
  {
    name: 'Luxury Red Rose Bouquet',
    description: 'Classic long-stem red roses with elegant presentation',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 55,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Rose - Red Freedom', quantity: 24 },
      { searchTerm: 'Eucalyptus - Seeded', quantity: 4 },
      { searchTerm: 'Leather Leaf Fern', quantity: 3 },
      { searchTerm: 'Ribbon - Silk', quantity: 1 },
      { searchTerm: 'Bouquet Wrap - Kraft', quantity: 2 },
    ],
  },
  {
    name: 'Spring Tulip & Ranunculus Arrangement',
    description: 'Fresh spring arrangement in soft pastels',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 50,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_95,
    items: [
      { searchTerm: 'Tulip - Pink', quantity: 15 },
      { searchTerm: 'Tulip - White', quantity: 10 },
      { searchTerm: 'Ranunculus - Mixed Pastel', quantity: 12 },
      { searchTerm: 'Anemone - White', quantity: 8 },
      { searchTerm: 'Eucalyptus - Parvifolia', quantity: 3 },
      { searchTerm: 'Vase - Glass Cylinder 20cm', quantity: 1 },
    ],
  },
  {
    name: 'Peony & David Austin Rose Centerpiece',
    description: 'Premium centerpiece with garden roses and seasonal peonies',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 95,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'David Austin Rose', quantity: 8 },
      { searchTerm: 'Peony - Pink', quantity: 6 },
      { searchTerm: 'Ranunculus - Peach', quantity: 10 },
      { searchTerm: 'Sweet Pea', quantity: 6 },
      { searchTerm: 'Eucalyptus - Baby Blue', quantity: 4 },
      { searchTerm: 'Jasmine Vine', quantity: 2 },
      { searchTerm: 'Floral Foam - Standard', quantity: 1 },
    ],
  },
  {
    name: 'Tropical Orchid Display',
    description: 'Exotic arrangement featuring premium orchids',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 75,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Orchid - Phalaenopsis', quantity: 3 },
      { searchTerm: 'Orchid - Dendrobium', quantity: 5 },
      { searchTerm: 'Monstera Leaf', quantity: 4 },
      { searchTerm: 'Palm Leaf', quantity: 3 },
      { searchTerm: 'Aspidistra Leaf', quantity: 5 },
      { searchTerm: 'Vase - Glass Cylinder 30cm', quantity: 1 },
    ],
  },
  {
    name: 'Hydrangea & Rose Wedding Centerpiece',
    description: 'Lush wedding centerpiece with premium blooms',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 85,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Hydrangea - White', quantity: 3 },
      { searchTerm: 'Rose - White Avalanche', quantity: 12 },
      { searchTerm: 'Rose - Peach Juliet', quantity: 8 },
      { searchTerm: 'Stock - White', quantity: 6 },
      { searchTerm: 'Eucalyptus - Seeded', quantity: 4 },
      { searchTerm: 'Olive Branch', quantity: 3 },
      { searchTerm: 'Floral Foam - Standard', quantity: 1 },
    ],
  },
  {
    name: 'Lavender & Peach Bridesmaid Bouquet',
    description: 'Romantic bridesmaid bouquet in soft hues',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 55,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_99,
    items: [
      { searchTerm: 'Rose - Lavender Ocean', quantity: 8 },
      { searchTerm: 'Rose - Peach Juliet', quantity: 6 },
      { searchTerm: 'Ranunculus - Peach', quantity: 7 },
      { searchTerm: 'Spray Rose - Lavender', quantity: 5 },
      { searchTerm: 'Eucalyptus - Baby Blue', quantity: 2 },
      { searchTerm: 'Ribbon - Silk', quantity: 1 },
    ],
  },
  {
    name: 'Dahlia & Delphinium Summer Arrangement',
    description: 'Bold summer arrangement with vibrant blooms',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 70,
    roundPrice: true,
    roundingMethod: RoundingMethod.PSYCHOLOGICAL_95,
    items: [
      { searchTerm: 'Dahlia - Cafe au Lait', quantity: 6 },
      { searchTerm: 'Delphinium - Blue', quantity: 5 },
      { searchTerm: 'Rose - Pink Engagement', quantity: 10 },
      { searchTerm: 'Hydrangea - Blue', quantity: 2 },
      { searchTerm: 'Eucalyptus - Seeded', quantity: 3 },
      { searchTerm: 'Dusty Miller', quantity: 3 },
      { searchTerm: 'Vase - Glass Cylinder 20cm', quantity: 1 },
    ],
  },
  {
    name: 'White & Green Sympathy Arrangement',
    description: 'Elegant sympathy arrangement in calming whites and greens',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 60,
    roundPrice: true,
    roundingMethod: RoundingMethod.NEAREST,
    items: [
      { searchTerm: 'Lily - White Casa Blanca', quantity: 5 },
      { searchTerm: 'Rose - White Avalanche', quantity: 12 },
      { searchTerm: 'Chrysanthemum - White', quantity: 8 },
      { searchTerm: 'Carnation - White', quantity: 10 },
      { searchTerm: 'Eucalyptus - Seeded', quantity: 4 },
      { searchTerm: 'Leather Leaf Fern', quantity: 4 },
      { searchTerm: 'Floral Foam - Standard', quantity: 1 },
    ],
  },
  {
    name: 'Rustic Wildflower Hand-Tied Bouquet',
    description: 'Loose, natural-style bouquet with garden flowers',
    labourCostType: LabourCostType.FIXED_AMOUNT,
    labourAmount: 45,
    roundPrice: true,
    roundingMethod: RoundingMethod.NEAREST,
    items: [
      { searchTerm: 'Tulip - Yellow', quantity: 10 },
      { searchTerm: 'Freesia - White', quantity: 8 },
      { searchTerm: 'Stock - White', quantity: 5 },
      { searchTerm: 'Wax Flower - White', quantity: 4 },
      { searchTerm: 'Eucalyptus - Parvifolia', quantity: 3 },
      { searchTerm: 'Ivy - English', quantity: 2 },
      { searchTerm: 'Bouquet Wrap - Kraft', quantity: 2 },
      { searchTerm: 'Ribbon - Organza', quantity: 1 },
    ],
  },
];

// -- Types -------------------------------------------------------------------

export type SeedRecipesOptions = {
  tenants: SeededTenant[];
};

// -- Helpers -----------------------------------------------------------------

function buildRecipeItems(
  template: (typeof recipeTemplates)[number],
  priceListItems: { id: string; name: string; costPerUnit: unknown; retailPrice: unknown }[],
) {
  const recipeItems: {
    priceListItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    retailPrice: number;
    lineTotal: number;
    retailLineTotal: number;
    order: number;
  }[] = [];
  let totalMaterialsCost = 0;
  let totalRetailPrice = 0;

  for (const itemTemplate of template.items) {
    const priceListItem = priceListItems.find((item) =>
      item.name.toLowerCase().includes(itemTemplate.searchTerm.toLowerCase()),
    );

    if (!priceListItem) continue;

    const quantity = itemTemplate.quantity;
    const unitPrice = Number(priceListItem.costPerUnit);
    const retailPrice = Number(priceListItem.retailPrice);
    const lineTotal = quantity * unitPrice;
    const retailLineTotal = quantity * retailPrice;

    totalMaterialsCost += lineTotal;
    totalRetailPrice += retailLineTotal;

    recipeItems.push({
      priceListItemId: priceListItem.id,
      name: priceListItem.name,
      quantity,
      unitPrice,
      retailPrice,
      lineTotal,
      retailLineTotal,
      order: recipeItems.length,
    });
  }

  return { recipeItems, totalMaterialsCost, totalRetailPrice };
}

// -- Seed function -----------------------------------------------------------

/**
 * Seeds floral arrangement recipes for each supplied tenant. Each recipe is
 * matched against the tenant's own price list items by name. Tenants that
 * have no price list items are skipped.
 * @param options - The tenants to seed for.
 * @returns The total number of recipes created across all tenants.
 */
export async function seedRecipes(options: SeedRecipesOptions): Promise<number> {
  const { tenants } = options;

  console.log(`\n📖 Seeding recipes for ${tenants.length} tenant(s)...`);

  let grandTotal = 0;

  for (const tenant of tenants) {
    const priceListItems = await prisma.priceListItem.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (priceListItems.length === 0) {
      console.log(`   ⚠️  ${tenant.name}: no price list items — skipping recipes`);
      continue;
    }

    let created = 0;

    for (const template of recipeTemplates) {
      try {
        const { recipeItems, totalMaterialsCost, totalRetailPrice } = buildRecipeItems(
          template,
          priceListItems,
        );

        if (recipeItems.length === 0) continue;

        let labourCost = 0;
        if (template.labourCostType === LabourCostType.FIXED_AMOUNT) {
          labourCost = template.labourAmount;
        } else if (template.labourCostType === LabourCostType.PERCENTAGE_OF_RETAIL) {
          labourCost = (totalRetailPrice * template.labourAmount) / 100;
        } else if (template.labourCostType === LabourCostType.PERCENTAGE_OF_MATERIAL) {
          labourCost = (totalMaterialsCost * template.labourAmount) / 100;
        }

        const totalCost = totalMaterialsCost + labourCost;
        let sellingPrice = totalRetailPrice + labourCost;

        if (template.roundPrice && sellingPrice > 0) {
          if (template.roundingMethod === RoundingMethod.NEAREST) {
            sellingPrice = Math.round(sellingPrice);
          } else if (template.roundingMethod === RoundingMethod.PSYCHOLOGICAL_99) {
            sellingPrice = Math.ceil(sellingPrice) - 0.01;
          } else if (template.roundingMethod === RoundingMethod.PSYCHOLOGICAL_95) {
            sellingPrice = Math.ceil(sellingPrice) - 0.05;
          }
        }

        await prisma.recipe.create({
          data: {
            tenantId: tenant.id,
            name: template.name,
            description: template.description,
            labourCostType: template.labourCostType,
            labourAmount: template.labourAmount,
            labourCost,
            totalMaterialsCost,
            totalRetailPrice,
            totalCost,
            sellingPrice,
            roundPrice: template.roundPrice,
            roundingMethod: template.roundingMethod,
            notes:
              faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }) ?? undefined,
            items: {
              create: recipeItems.map((item, index) => ({
                priceListItemId: item.priceListItemId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                retailPrice: item.retailPrice,
                retailLineTotal: item.retailLineTotal,
                order: item.order ?? index,
              })),
            },
          },
        });

        created++;
      } catch (error) {
        console.error(`Failed to create recipe "${template.name}" for ${tenant.name}:`, error);
      }
    }

    grandTotal += created;
    console.log(`   ✅ ${tenant.name}: ${created} recipes`);
  }

  console.log(`✅ Created ${grandTotal} recipe(s) across ${tenants.length} tenant(s)`);
  return grandTotal;
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

    await seedRecipes({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
