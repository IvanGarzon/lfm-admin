import { describe, it, expect } from 'vitest';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  DeleteOrganizationSchema,
} from './organizations';
import { testIds } from '@/lib/testing';

const TEST_ORG_ID = testIds.organization();

const validOrganization = {
  name: 'Acme Florals',
  phone: null,
  email: null,
  website: null,
  address: null,
  city: null,
  state: null,
  postcode: null,
  country: 'Australia',
  abn: null,
  status: 'ACTIVE',
};

describe('Organisation Schemas', () => {
  describe('CreateOrganizationSchema', () => {
    it('validates a correct organisation', () => {
      const result = CreateOrganizationSchema.safeParse(validOrganization);
      expect(result.success).toBe(true);
    });

    it('validates an organisation with all optional fields populated', () => {
      const result = CreateOrganizationSchema.safeParse({
        ...validOrganization,
        phone: '+61412345678',
        email: 'info@acme.com.au',
        website: 'https://acme.com.au',
        address: '123 Floral St',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        abn: '12 345 678 901',
      });
      expect(result.success).toBe(true);
    });

    it('fails when name is missing', () => {
      const { name: _, ...rest } = validOrganization;
      const result = CreateOrganizationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('fails when email is invalid', () => {
      const result = CreateOrganizationSchema.safeParse({
        ...validOrganization,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('fails when website is not a valid URL', () => {
      const result = CreateOrganizationSchema.safeParse({
        ...validOrganization,
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('fails when status is not a valid enum value', () => {
      const result = CreateOrganizationSchema.safeParse({
        ...validOrganization,
        status: 'ARCHIVED',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateOrganizationSchema', () => {
    it('validates a correct update payload with an ID', () => {
      const result = UpdateOrganizationSchema.safeParse({ ...validOrganization, id: TEST_ORG_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = UpdateOrganizationSchema.safeParse(validOrganization);
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = UpdateOrganizationSchema.safeParse({ ...validOrganization, id: 'bad-id' });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteOrganizationSchema', () => {
    it('validates a correct delete payload', () => {
      const result = DeleteOrganizationSchema.safeParse({ id: TEST_ORG_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = DeleteOrganizationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = DeleteOrganizationSchema.safeParse({ id: 'bad-id' });
      expect(result.success).toBe(false);
    });
  });
});
