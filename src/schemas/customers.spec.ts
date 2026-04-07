import { describe, it, expect } from 'vitest';
import { CreateCustomerSchema, UpdateCustomerSchema, DeleteCustomerSchema } from './customers';
import { testIds } from '@/lib/testing';

const TEST_CUSTOMER_ID = testIds.customer();

const validAddress = {
  address1: '1 Test St',
  formattedAddress: '1 Test St, Melbourne VIC 3000',
  lat: 0,
  lng: 0,
};

const validCustomer = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: null,
  gender: 'FEMALE',
  status: 'ACTIVE',
  organizationId: null,
  organizationName: null,
  useOrganizationAddress: false,
  address: validAddress,
};

describe('Customer Schemas', () => {
  describe('CreateCustomerSchema', () => {
    it('validates a correct customer with address', () => {
      const result = CreateCustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('validates a customer linked to an organisation using its address', () => {
      const result = CreateCustomerSchema.safeParse({
        ...validCustomer,
        organizationId: testIds.organization(),
        useOrganizationAddress: true,
        address: null,
      });
      expect(result.success).toBe(true);
    });

    it('fails when firstName is missing', () => {
      const { firstName: _, ...rest } = validCustomer;
      const result = CreateCustomerSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('fails when email is invalid', () => {
      const result = CreateCustomerSchema.safeParse({
        ...validCustomer,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('fails when gender is not a valid enum value', () => {
      const result = CreateCustomerSchema.safeParse({
        ...validCustomer,
        gender: 'UNKNOWN',
      });
      expect(result.success).toBe(false);
    });

    it('fails when no organisation and no address are provided', () => {
      const result = CreateCustomerSchema.safeParse({
        ...validCustomer,
        organizationId: null,
        address: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCustomerSchema', () => {
    it('validates a correct update payload with an ID', () => {
      const result = UpdateCustomerSchema.safeParse({ ...validCustomer, id: TEST_CUSTOMER_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = UpdateCustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = UpdateCustomerSchema.safeParse({ ...validCustomer, id: 'not-a-cuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteCustomerSchema', () => {
    it('validates a correct delete payload', () => {
      const result = DeleteCustomerSchema.safeParse({ id: TEST_CUSTOMER_ID });
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const result = DeleteCustomerSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('fails when id is not a valid CUID', () => {
      const result = DeleteCustomerSchema.safeParse({ id: 'bad-id' });
      expect(result.success).toBe(false);
    });
  });
});
