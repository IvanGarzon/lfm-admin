import { Vendor, VendorStatus, Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { isPrismaError } from '@/lib/error-handler';
import { withDatabaseRetry } from '@/lib/retry';

import type {
  VendorListItem,
  VendorStatistics,
  VendorWithDetails,
  VendorFilters,
  VendorPagination,
} from '@/features/inventory/vendors/types';
import { getPaginationMetadata } from '@/lib/utils';

import type { CreateVendorInput, UpdateVendorInput } from '@/schemas/vendors';

/**
 * Vendor Repository
 * Handles all database operations for vendors
 * Extends BaseRepository for common CRUD operations
 */
export class VendorRepository extends BaseRepository<Prisma.VendorGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.VendorGetPayload<object>> {
    return this.prisma.vendor as unknown as ModelDelegateOperations<
      Prisma.VendorGetPayload<object>
    >;
  }

  /**
   * Search and paginate vendors with advanced filtering capabilities.
   * Supports full-text search across vendor code, name, and email,
   * status filtering, sorting, and pagination.
   * @param params - Filter parameters for the search
   * @param params.search - Optional search term to filter by vendor code, name, or email
   * @param params.status - Optional array of vendor statuses to filter by
   * @param params.page - Page number for pagination (1-indexed)
   * @param params.perPage - Number of items per page
   * @param params.sort - Optional array of sort criteria with id and desc properties
   * @returns A promise that resolves to paginated vendor results with metadata
   */
  async searchAndPaginate(params: VendorFilters, tenantId: string): Promise<VendorPagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.VendorWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    if (search) {
      const searchFilter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { vendorCode: searchFilter },
        { name: searchFilter },
        { email: searchFilter },
      ];
    }

    const skip = (page - 1) * perPage;

    // Build order by clause from sort parameter
    const orderBy: Prisma.VendorOrderByWithRelationInput[] = [];

    if (sort && sort.length > 0) {
      for (const sortItem of sort) {
        if (sortItem.id === 'vendorCode') {
          orderBy.push({ vendorCode: sortItem.desc ? 'desc' : 'asc' });
        } else if (sortItem.id === 'name') {
          orderBy.push({ name: sortItem.desc ? 'desc' : 'asc' });
        } else if (sortItem.id === 'email') {
          orderBy.push({ email: sortItem.desc ? 'desc' : 'asc' });
        } else if (sortItem.id === 'status') {
          orderBy.push({ status: sortItem.desc ? 'desc' : 'asc' });
        } else if (sortItem.id === 'createdAt') {
          orderBy.push({ createdAt: sortItem.desc ? 'desc' : 'asc' });
        } else if (sortItem.id === 'transactionCount') {
          orderBy.push({
            transactions: {
              _count: sortItem.desc ? 'desc' : 'asc',
            },
          });
        }
      }
    } else {
      // Default sort by name ascending
      orderBy.push({ name: 'asc' });
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.vendor.findMany({
        where: whereClause,
        skip,
        take: perPage,
        orderBy,
        select: {
          id: true,
          vendorCode: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          paymentTerms: true,
          createdAt: true,
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      }),
      this.prisma.vendor.count({ where: whereClause }),
    ]);

    const vendorItems: VendorListItem[] = items.map((vendor) => ({
      id: vendor.id,
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      paymentTerms: vendor.paymentTerms,
      transactionCount: vendor._count.transactions,
    }));

    const pagination = getPaginationMetadata(totalItems, page, perPage);

    return {
      items: vendorItems,
      pagination,
    };
  }

  /**
   * Find a vendor by ID with full details including address and transaction counts.
   * @param id - The unique identifier of the vendor
   * @returns A promise that resolves to the vendor with details, or null if not found
   */
  async findByIdWithDetails(id: string, tenantId: string): Promise<VendorWithDetails | null> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        vendorCode: true,
        name: true,
        email: true,
        phone: true,
        abn: true,
        status: true,
        address1: true,
        address2: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
        formattedAddress: true,
        website: true,
        paymentTerms: true,
        taxId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!vendor) {
      return null;
    }

    // Map address fields to address object
    const address =
      vendor.address1 && vendor.formattedAddress && vendor.lat && vendor.lng
        ? {
            address1: vendor.address1,
            address2: vendor.address2 ?? '',
            formattedAddress: vendor.formattedAddress,
            city: vendor.city ?? null,
            region: vendor.region ?? null,
            postalCode: vendor.postalCode ?? null,
            country: vendor.country ?? null,
            lat: vendor.lat,
            lng: vendor.lng,
          }
        : null;

    return {
      id: vendor.id,
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      abn: vendor.abn,
      status: vendor.status,
      address,
      website: vendor.website,
      paymentTerms: vendor.paymentTerms,
      taxId: vendor.taxId,
      notes: vendor.notes,
      transactionCount: vendor._count.transactions,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  /**
   * Generate a unique vendor code with format: VEN-YYYY-####
   * Automatically increments the sequential number for the current year.
   * @returns A promise that resolves to the generated vendor code
   * @example "VEN-2026-0001", "VEN-2026-0042"
   */
  async generateVendorCode(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VEN-${year}-`;

    const lastVendor = await this.model.findFirst({
      where: {
        tenantId,
        vendorCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        vendorCode: 'desc',
      },
      select: {
        vendorCode: true,
      },
    });

    if (!lastVendor) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(lastVendor.vendorCode.split('-')[2], 10);
    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Create a new vendor record with an auto-generated vendor code.
   * Implements retry logic for unique constraint handling.
   * @param data - The vendor data to create
   * @returns A promise that resolves to an object with the new vendor ID and code
   * @throws {Error} If unique code generation fails after 3 attempts
   */
  async createVendor(
    data: CreateVendorInput,
    tenantId: string,
  ): Promise<{ id: string; vendorCode: string }> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Generate vendor code
        const vendorCode = await this.generateVendorCode(tenantId);

        const vendor = await this.prisma.vendor.create({
          data: {
            tenantId,
            vendorCode,
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            abn: data.abn ?? null,
            status: data.status ?? VendorStatus.ACTIVE,
            address1: data.address?.address1 ?? null,
            address2: data.address?.address2 ?? null,
            city: data.address?.city ?? null,
            region: data.address?.region ?? null,
            postalCode: data.address?.postalCode ?? null,
            country: data.address?.country ?? null,
            lat: data.address?.lat ?? null,
            lng: data.address?.lng ?? null,
            formattedAddress: data.address?.formattedAddress ?? null,
            website: data.website ?? null,
            paymentTerms: data.paymentTerms ?? null,
            taxId: data.taxId ?? null,
            notes: data.notes ?? null,
          },
          select: {
            id: true,
            vendorCode: true,
          },
        });

        return vendor;
      } catch (error: unknown) {
        // Handle unique constraint violation (vendor code collision)
        if (isPrismaError(error) && error.code === 'P2002') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to generate a unique vendor code. Please try again.');
          }
          continue; // Retry with a new code
        }

        // Re-throw other errors
        throw error;
      }
    }

    throw new Error('Failed to create vendor');
  }

  /**
   * Update an existing vendor's information.
   * @param id - The unique identifier of the vendor to update
   * @param tenantId - The tenant scope for the update
   * @param data - The update data payload
   * @returns A promise that resolves to the updated vendor with details, or null if not found
   */
  async updateVendor(
    id: string,
    tenantId: string,
    data: UpdateVendorInput,
  ): Promise<VendorWithDetails | null> {
    const existing = await this.findByIdWithDetails(id, tenantId);
    if (!existing) {
      return null;
    }

    const updatedVendor = await withDatabaseRetry(() =>
      this.prisma.vendor.update({
        where: { id, tenantId, deletedAt: null },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          abn: data.abn ?? null,
          status: data.status,
          address1: data.address?.address1 ?? null,
          address2: data.address?.address2 ?? null,
          city: data.address?.city ?? null,
          region: data.address?.region ?? null,
          postalCode: data.address?.postalCode ?? null,
          country: data.address?.country ?? null,
          lat: data.address?.lat ?? null,
          lng: data.address?.lng ?? null,
          formattedAddress: data.address?.formattedAddress ?? null,
          website: data.website ?? null,
          paymentTerms: data.paymentTerms ?? null,
          taxId: data.taxId ?? null,
          notes: data.notes ?? null,
        },
      }),
    );

    if (!updatedVendor) {
      return null;
    }

    return await this.findByIdWithDetails(updatedVendor.id, tenantId);
  }

  /**
   * Updates the operational status for a vendor.
   * @param id - The vendor ID
   * @param tenantId - The tenant scope for the update
   * @param status - The new VendorStatus to apply
   * @returns A promise that resolves to the basic updated vendor record
   */
  async updateVendorStatus(id: string, tenantId: string, status: VendorStatus): Promise<Vendor> {
    return await withDatabaseRetry(() =>
      this.prisma.vendor.update({
        where: { id, tenantId, deletedAt: null },
        data: { status },
      }),
    );
  }

  /**
   * Soft deletes a vendor by setting the deletedAt timestamp.
   * Prevents deletion if the vendor has associated financial transactions.
   * @param id - The ID of the vendor to delete
   * @param tenantId - The tenant scope for the deletion
   * @returns A promise that resolves to the soft-deleted vendor record
   * @throws {Error} If vendor has existing transactions
   */
  async softDeleteVendor(id: string, tenantId: string): Promise<Vendor> {
    // Check if vendor has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { vendorId: id },
    });

    if (transactionCount > 0) {
      throw new Error(
        'Cannot delete vendor with associated transactions. Please set status to INACTIVE instead.',
      );
    }

    return await withDatabaseRetry(() =>
      this.prisma.vendor.update({
        where: { id, tenantId, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Calculates high-level statistics for the vendor pool.
   * Includes total counts and status-based breakdowns.
   * @returns A promise that resolves to a VendorStatistics object
   */
  async getStatistics(tenantId: string): Promise<VendorStatistics> {
    const [total, active, inactive, suspended] = await Promise.all([
      this.prisma.vendor.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.vendor.count({
        where: { tenantId, status: VendorStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.vendor.count({
        where: { tenantId, status: VendorStatus.INACTIVE, deletedAt: null },
      }),
      this.prisma.vendor.count({
        where: { tenantId, status: VendorStatus.SUSPENDED, deletedAt: null },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
    };
  }

  /**
   * Retrieves active vendors with mandatory fields for selection components.
   * @returns A promise that resolves to an array of vendor identifiers and names
   */
  async getActiveVendors(
    tenantId: string,
  ): Promise<Array<{ id: string; vendorCode: string; name: string }>> {
    return await this.prisma.vendor.findMany({
      where: {
        tenantId,
        status: VendorStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        vendorCode: true,
        name: true,
      },
    });
  }
}
