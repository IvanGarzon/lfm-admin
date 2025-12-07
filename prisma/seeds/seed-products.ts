import { prisma } from '@/lib/prisma';
import { ProductStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';

interface Product {
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string | null;
  availableAt: Date;
}

/**
 * Seed Products
 * Creates florist industry products and services
 */

export async function seedProducts() {
  console.log('🌸 Seeding products...');

  const floristProducts = [
    // Fresh Flowers
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

    // Bouquets & Arrangements
    {
      category: 'Bouquets',
      items: [
        { name: 'Classic Hand-Tied Bouquet', priceRange: [120, 300], stock: 999 },
        { name: 'Luxury Bridal Bouquet', priceRange: [350, 800], stock: 999 },
        { name: 'Bridesmaid Bouquet', priceRange: [100, 250], stock: 999 },
        { name: 'Romantic Rose Bouquet', priceRange: [150, 400], stock: 999 },
        { name: 'Seasonal Mixed Bouquet', priceRange: [100, 280], stock: 999 },
        { name: 'Sympathy Bouquet', priceRange: [120, 350], stock: 999 },
        { name: 'Birthday Celebration Bouquet', priceRange: [90, 220], stock: 999 },
        { name: 'Get Well Soon Bouquet', priceRange: [80, 180], stock: 999 },
      ],
    },

    // Event Services
    {
      category: 'Wedding Services',
      items: [
        { name: 'Full Wedding Floral Package', priceRange: [3000, 12000], stock: 999 },
        { name: 'Ceremony Arch Decoration', priceRange: [800, 2500], stock: 999 },
        { name: 'Reception Table Centerpieces (per table)', priceRange: [80, 250], stock: 999 },
        { name: 'Bridal Party Flowers Package', priceRange: [600, 1800], stock: 999 },
        { name: 'Church Pew Decorations (per pew)', priceRange: [40, 120], stock: 999 },
        { name: 'Wedding Car Decoration', priceRange: [150, 400], stock: 999 },
      ],
    },

    {
      category: 'Corporate Services',
      items: [
        { name: 'Corporate Event Centerpiece', priceRange: [100, 350], stock: 999 },
        { name: 'Office Weekly Flower Service', priceRange: [200, 600], stock: 999 },
        { name: 'Conference Table Arrangement', priceRange: [150, 450], stock: 999 },
        { name: 'Corporate Gift Hamper with Flowers', priceRange: [120, 300], stock: 999 },
        { name: 'Reception Desk Display', priceRange: [180, 500], stock: 999 },
      ],
    },

    {
      category: 'Funeral Services',
      items: [
        { name: 'Funeral Wreath - Standard', priceRange: [200, 500], stock: 999 },
        { name: 'Funeral Wreath - Premium', priceRange: [500, 1200], stock: 999 },
        { name: 'Casket Spray', priceRange: [400, 1000], stock: 999 },
        { name: 'Standing Spray', priceRange: [300, 800], stock: 999 },
        { name: 'Sympathy Basket', priceRange: [150, 400], stock: 999 },
      ],
    },

    // Specialty Items
    {
      category: 'Specialty Arrangements',
      items: [
        { name: 'Preserved Rose Box - Small', priceRange: [150, 300], stock: [10, 25] },
        { name: 'Preserved Rose Box - Large', priceRange: [300, 600], stock: [5, 15] },
        { name: 'Succulent Garden Arrangement', priceRange: [80, 200], stock: [15, 30] },
        { name: 'Orchid Plant - Potted', priceRange: [100, 250], stock: [10, 25] },
        { name: 'Tropical Arrangement - Large', priceRange: [200, 500], stock: 999 },
        { name: 'Seasonal Flower Subscription (Monthly)', priceRange: [400, 1200], stock: 999 },
      ],
    },

    // Add-ons
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
  ];

  const products: Product[] = [];

  for (const category of floristProducts) {
    for (const item of category.items) {
      const product = {
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
        stock: typeof item.stock === 'number'
          ? item.stock
          : faker.number.int({ min: item.stock[0], max: item.stock[1] }),
        status: faker.helpers.weightedArrayElement([
          { value: 'ACTIVE', weight: 0.9 },
          { value: 'INACTIVE', weight: 0.05 },
          { value: 'OUT_OF_STOCK', weight: 0.05 },
        ]),
        imageUrl: faker.helpers.maybe(
          () => `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/300`,
          { probability: 0.7 },
        ) ?? null,
        availableAt: faker.date.recent({ days: 30 }),
      };

      products.push(product);
    }
  }

  // Bulk create products
  const createdProducts = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${createdProducts.count} florist products`);
}

