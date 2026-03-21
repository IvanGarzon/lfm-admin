import { prisma } from '@/lib/prisma';
import { States, VendorStatus } from '@/prisma/client';

interface Vendor {
  vendorCode: string;
  name: string;
  email: string;
  phone?: string;
  abn?: string;
  status: VendorStatus;
  address1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  paymentTerms?: number;
  notes?: string;
}

/**
 * Seed Vendors
 * Creates florist wholesale suppliers and service providers
 */

export async function seedVendors() {
  console.log('🏪 Seeding vendors...');

  const vendors: Vendor[] = [
    {
      vendorCode: 'VEN-001',
      name: 'Melbourne Flower Market',
      email: 'orders@melbflowermarket.com.au',
      phone: '03 9320 5200',
      abn: '12 345 678 901',
      status: VendorStatus.ACTIVE,
      address1: '2 Footscray Road',
      city: 'West Melbourne',
      region: 'VIC',
      postalCode: '3003',
      country: 'Australia',
      website: 'https://melbourneflowermarket.com.au',
      paymentTerms: 14,
      notes: 'Primary wholesale flower supplier. Early morning pickups available.',
    },
    {
      vendorCode: 'VEN-002',
      name: 'Sydney Flower Markets',
      email: 'wholesale@sydneyflowers.com.au',
      phone: '02 9764 3200',
      abn: '23 456 789 012',
      status: VendorStatus.ACTIVE,
      address1: 'Parramatta Road',
      city: 'Flemington',
      region: 'NSW',
      postalCode: '2140',
      country: 'Australia',
      website: 'https://sfm.com.au',
      paymentTerms: 7,
      notes: 'Interstate supplier for special orders.',
    },
    {
      vendorCode: 'VEN-003',
      name: 'Green Valley Nursery',
      email: 'sales@greenvalleynursery.com.au',
      phone: '03 9876 5432',
      abn: '34 567 890 123',
      status: VendorStatus.ACTIVE,
      address1: '120 Nursery Road',
      city: 'Kensington',
      region: 'VIC',
      postalCode: '3031',
      country: 'Australia',
      paymentTerms: 30,
      notes: 'Potted plants and greenery supplier.',
    },
    {
      vendorCode: 'VEN-004',
      name: 'Koch & Co',
      email: 'orders@kochandco.com.au',
      phone: '1300 562 426',
      abn: '45 678 901 234',
      status: VendorStatus.ACTIVE,
      address1: '45 Business Park Drive',
      city: 'Notting Hill',
      region: 'VIC',
      postalCode: '3168',
      country: 'Australia',
      website: 'https://kochandco.com.au',
      paymentTerms: 30,
      notes: 'Floral supplies, vases, ribbons, and accessories.',
    },
    {
      vendorCode: 'VEN-005',
      name: 'Australian Blooms Direct',
      email: 'hello@ausblooms.com.au',
      phone: '1800 456 789',
      abn: '56 789 012 345',
      status: VendorStatus.ACTIVE,
      address1: 'Online Only',
      city: 'Melbourne',
      region: 'VIC',
      postalCode: '3000',
      country: 'Australia',
      website: 'https://australianblooms.com.au',
      paymentTerms: 7,
      notes: 'Online bulk flower supplier with next-day delivery.',
    },
    {
      vendorCode: 'VEN-006',
      name: 'Eco Packaging Solutions',
      email: 'sales@ecopack.com.au',
      phone: '03 9111 2222',
      abn: '67 890 123 456',
      status: VendorStatus.ACTIVE,
      address1: '88 Industrial Avenue',
      city: 'Sunshine',
      region: 'VIC',
      postalCode: '3020',
      country: 'Australia',
      website: 'https://ecopackaging.com.au',
      paymentTerms: 30,
      notes: 'Sustainable and eco-friendly packaging supplies.',
    },
    {
      vendorCode: 'VEN-007',
      name: 'Metro Logistics',
      email: 'bookings@metrologistics.com.au',
      phone: '13 13 13',
      abn: '78 901 234 567',
      status: VendorStatus.ACTIVE,
      address1: '500 Delivery Road',
      city: 'Port Melbourne',
      region: 'VIC',
      postalCode: '3207',
      country: 'Australia',
      paymentTerms: 14,
      notes: 'Courier and delivery services for wedding flower transport.',
    },
    {
      vendorCode: 'VEN-008',
      name: 'Premium Orchids Australia',
      email: 'info@premiumorchids.com.au',
      phone: '03 5555 6666',
      abn: '89 012 345 678',
      status: VendorStatus.ACTIVE,
      address1: '15 Greenhouse Lane',
      city: 'Warrandyte',
      region: 'VIC',
      postalCode: '3113',
      country: 'Australia',
      website: 'https://premiumorchids.com.au',
      paymentTerms: 30,
      notes: 'Specialist orchid grower for premium arrangements.',
    },
  ];

  const createdVendors = [];
  for (const vendor of vendors) {
    try {
      const created = await prisma.vendor.create({
        data: {
          ...vendor,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdVendors.push(created);
    } catch (error) {
      console.error(`Failed to create vendor: ${vendor.name}`, error);
    }
  }

  console.log(`✅ Created ${createdVendors.length} vendors`);
  return createdVendors;
}
