import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateOrganizationInput } from '@/schemas/organizations';

/**
 * Organization Repository
 * Handles all database operations for organizations
 * Extends BaseRepository for common CRUD operations
 */
export class OrganizationRepository extends BaseRepository<Prisma.OrganizationGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.OrganizationGetPayload<object>> {
    return this.prisma.organization as unknown as ModelDelegateOperations<
      Prisma.OrganizationGetPayload<object>
    >;
  }

  /**
   * Get all organizations for selection lists
   */
  async findAllForSelection() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find organization by name
   */
  async findByName(name: string) {
    return this.prisma.organization.findFirst({
      where: {
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    });
  }

  /**
   * Create organization with address data
   */
  async createOrganization(data: CreateOrganizationInput) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country,
      },
    });
  }

  /**
   * Find or create organization by name
   * Returns existing organization if found, otherwise creates new one
   */
  async findOrCreate(name: string) {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    return this.prisma.organization.create({
      data: { name },
    });
  }
}
