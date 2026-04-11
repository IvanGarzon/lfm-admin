import { describe, it, expect } from 'vitest';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  UpdateVendorStatusSchema,
  DeleteVendorSchema,
} from './vendors';
import { testIds } from '@/lib/testing';

const TEST_VENDOR_ID = testIds.vendor();

const validVendor = {
  name: 'Acme Florals',
  email: 'contact@acme.com',
  phone: '0400000000',
  abn: '12345678901',
  status: 'ACTIVE',
  address: null,
  website: null,
  paymentTerms: 30,
  taxId: null,
  notes: null,
};

describe('Vendor Schemas', () => {
  describe('CreateVendorSchema', () => {
    it('validates a correct vendor', () => {
      const result = CreateVendorSchema.safeParse(validVendor);
      expect(result.success).toBe(true);
    });

    it('validates with optional fields omitted', () => {
      const result = CreateVendorSchema.safeParse({
        name: 'Simple Vendor',
        email: 'simple@vendor.com',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('validates with a full address', () => {
      const result = CreateVendorSchema.safeParse({
        ...validVendor,
        address: {
          address1: '123 Main St',
          address2: '',
          city: 'Melbourne',
          region: 'VIC',
          postalCode: '3000',
          country: 'Australia',
          lat: -37.8136,
          lng: 144.9631,
          formattedAddress: '123 Main St, Melbourne VIC 3000',
        },
      });
      expect(result.success).toBe(true);
    });

    it('fails when name is empty', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, name: '' });
      expect(result.success).toBe(false);
    });

    it('fails when email is invalid', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('fails when status is not a valid enum value', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, status: 'DRAFT' });
      expect(result.success).toBe(false);
    });

    it('fails when paymentTerms exceeds 365', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, paymentTerms: 366 });
      expect(result.success).toBe(false);
    });

    it('fails when paymentTerms is negative', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, paymentTerms: -1 });
      expect(result.success).toBe(false);
    });

    it('fails when website is not a valid URL', () => {
      const result = CreateVendorSchema.safeParse({ ...validVendor, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateVendorSchema', () => {
    it('validates a correct update payload with an ID', () => {
      const result = UpdateVendorSchema.safeParse({ ...validVendor, id: TEST_VENDOR_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = UpdateVendorSchema.safeParse(validVendor);
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = UpdateVendorSchema.safeParse({ ...validVendor, id: 'not-a-cuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateVendorStatusSchema', () => {
    it('validates a correct status update', () => {
      const result = UpdateVendorStatusSchema.safeParse({
        id: TEST_VENDOR_ID,
        status: 'INACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = UpdateVendorStatusSchema.safeParse({ status: 'INACTIVE' });
      expect(result.success).toBe(false);
    });

    it('fails when status is not a valid enum value', () => {
      const result = UpdateVendorStatusSchema.safeParse({ id: TEST_VENDOR_ID, status: 'BANNED' });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteVendorSchema', () => {
    it('validates a correct delete payload', () => {
      const result = DeleteVendorSchema.safeParse({ id: TEST_VENDOR_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = DeleteVendorSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = DeleteVendorSchema.safeParse({ id: 'bad-id' });
      expect(result.success).toBe(false);
    });
  });
});
