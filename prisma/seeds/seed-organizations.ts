import { prisma } from '@/lib/prisma';
import { States } from '@/prisma/client';

interface Organization {
  name: string;
  address: string;
  city: string;
  state: States;
  postcode: string;
  country: string;
}

/**
 * Seed Organizations
 * Creates florist industry related organizations
 */

export async function seedOrganizations() {
  console.log('🏢 Seeding organizations...');

  const organizations: Organization[] = [
    {
      name: 'Garden Events & Weddings',
      address: '123 Bloom Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
    },
    {
      name: 'Sydney Botanical Co.',
      address: '456 Petal Avenue',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
    },
    {
      name: 'Brisbane Floral Design Studio',
      address: '789 Garden Lane',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
    },
    {
      name: 'Perth Wedding Flowers',
      address: '321 Rose Drive',
      city: 'Perth',
      state: 'WA',
      postcode: '6000',
      country: 'Australia',
    },
    {
      name: 'Adelaide Event Planning',
      address: '654 Tulip Way',
      city: 'Adelaide',
      state: 'SA',
      postcode: '5000',
      country: 'Australia',
    },
    {
      name: 'Hobart Corporate Events',
      address: '987 Orchid Road',
      city: 'Hobart',
      state: 'TAS',
      postcode: '7000',
      country: 'Australia',
    },
    {
      name: 'Canberra Special Events',
      address: '147 Lily Street',
      city: 'Canberra',
      state: 'ACT',
      postcode: '2600',
      country: 'Australia',
    },
    {
      name: 'Darwin Tropical Weddings',
      address: '258 Hibiscus Plaza',
      city: 'Darwin',
      state: 'NT',
      postcode: '0800',
      country: 'Australia',
    },
    {
      name: 'Melbourne Hotel Group',
      address: '100 Hospitality Drive',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3001',
      country: 'Australia',
    },
    {
      name: 'Sydney Convention Centre',
      address: '200 Conference Street',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2001',
      country: 'Australia',
    },
  ];

  const createdOrganizations = [];
  for (const org of organizations) {
    const created = await prisma.organization.create({
      data: org,
    });
    createdOrganizations.push(created);
  }

  console.log(`✅ Created ${createdOrganizations.length} organizations`);
  return createdOrganizations;
}
