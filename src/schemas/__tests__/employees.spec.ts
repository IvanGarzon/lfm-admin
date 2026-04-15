import { describe, it, expect } from 'vitest';
import { CreateEmployeeSchema, UpdateEmployeeSchema, DeleteEmployeeSchema } from '../employees';
import { testIds } from '@/lib/testing';

const TEST_EMPLOYEE_ID = testIds.employee();

const validInput = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '0412345678',
  status: 'ACTIVE',
  rate: 35,
  gender: 'FEMALE',
  dob: new Date('1990-06-15'),
  avatarUrl: null,
};

describe('Employee Schemas', () => {
  describe('CreateEmployeeSchema', () => {
    it('accepts a valid employee', () => {
      expect(() => CreateEmployeeSchema.parse(validInput)).not.toThrow();
    });

    it('rejects a missing gender', () => {
      const { gender: _g, ...rest } = validInput;
      const result = CreateEmployeeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects a missing dob', () => {
      const { dob: _d, ...rest } = validInput;
      const result = CreateEmployeeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects an empty first name', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a first name exceeding max length', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, firstName: 'x'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('rejects an empty last name', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid email', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects a phone number with non-numeric characters', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, phone: 'abc123' });
      expect(result.success).toBe(false);
    });

    it('accepts an empty phone number', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, phone: '' })).not.toThrow();
    });

    it('rejects a phone number exceeding max length', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, phone: '0'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('rejects a negative rate', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, rate: -1 });
      expect(result.success).toBe(false);
    });

    it('accepts a zero rate', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, rate: 0 })).not.toThrow();
    });

    it('rejects a rate exceeding 1,000,000', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, rate: 1000001 });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid status', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, status: 'UNKNOWN' });
      expect(result.success).toBe(false);
    });

    it('accepts INACTIVE status', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, status: 'INACTIVE' })).not.toThrow();
    });

    it('accepts valid gender values', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, gender: 'FEMALE' })).not.toThrow();
    });

    it('rejects an invalid gender value', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, gender: 'UNKNOWN' });
      expect(result.success).toBe(false);
    });

    it('rejects a date of birth in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const result = CreateEmployeeSchema.safeParse({ ...validInput, dob: future });
      expect(result.success).toBe(false);
    });

    it('accepts a past date of birth', () => {
      expect(() =>
        CreateEmployeeSchema.parse({ ...validInput, dob: new Date('1990-06-15') }),
      ).not.toThrow();
    });

    it('rejects an invalid avatar URL', () => {
      const result = CreateEmployeeSchema.safeParse({ ...validInput, avatarUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid avatar URL', () => {
      expect(() =>
        CreateEmployeeSchema.parse({
          ...validInput,
          avatarUrl: 'https://example.com/avatar.jpg',
        }),
      ).not.toThrow();
    });

    it('accepts an empty string avatar URL', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, avatarUrl: '' })).not.toThrow();
    });

    it('accepts null avatar URL', () => {
      expect(() => CreateEmployeeSchema.parse({ ...validInput, avatarUrl: null })).not.toThrow();
    });
  });

  describe('UpdateEmployeeSchema', () => {
    const validUpdateInput = {
      ...validInput,
      id: TEST_EMPLOYEE_ID,
    };

    it('accepts a valid update payload', () => {
      expect(() => UpdateEmployeeSchema.parse(validUpdateInput)).not.toThrow();
    });

    it('rejects a missing id', () => {
      const { id: _id, ...rest } = validUpdateInput;
      const result = UpdateEmployeeSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects an empty first name', () => {
      const result = UpdateEmployeeSchema.safeParse({ ...validUpdateInput, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid email', () => {
      const result = UpdateEmployeeSchema.safeParse({ ...validUpdateInput, email: 'bad' });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteEmployeeSchema', () => {
    it('accepts a valid CUID', () => {
      expect(() => DeleteEmployeeSchema.parse({ id: TEST_EMPLOYEE_ID })).not.toThrow();
    });

    it('rejects a missing id', () => {
      const result = DeleteEmployeeSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects an invalid id format', () => {
      const result = DeleteEmployeeSchema.safeParse({ id: 'not-valid' });
      expect(result.success).toBe(false);
    });
  });
});
