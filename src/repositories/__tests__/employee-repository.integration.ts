/**
 * EmployeeRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { EmployeeStatus } from '@/prisma/client';
import { EmployeeRepository } from '../employee-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createEmployeeInput } from '@/lib/testing';

setupTestDatabaseLifecycle();

// -- Tests -------------------------------------------------------------------

describe('EmployeeRepository (integration)', () => {
  let repository: EmployeeRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new EmployeeRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Employee Test Tenant' }));
  });

  // -- createEmployee --------------------------------------------------------

  describe('createEmployee', () => {
    it('creates an employee and returns the ID', async () => {
      const result = await repository.createEmployee(createEmployeeInput(), tenantId);

      expect(result.id).toBeDefined();

      const saved = await repository.findEmployeeById(result.id, tenantId);
      expect(saved!.firstName).toBe('Jane');
      expect(saved!.lastName).toBe('Smith');
      expect(saved!.email).toBe('jane.smith@example.com');
      expect(saved!.rate).toBeCloseTo(35);
    });

    it('converts Decimal rate to number', async () => {
      const { id } = await repository.createEmployee(createEmployeeInput({ rate: 42.5 }), tenantId);

      const saved = await repository.findEmployeeById(id, tenantId);
      expect(typeof saved!.rate).toBe('number');
      expect(saved!.rate).toBeCloseTo(42.5);
    });
  });

  // -- findEmployeeById ------------------------------------------------------

  describe('findEmployeeById', () => {
    it('returns an employee by ID', async () => {
      const { id } = await repository.createEmployee(createEmployeeInput(), tenantId);

      const result = await repository.findEmployeeById(id, tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findEmployeeById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const { id } = await repository.createEmployee(createEmployeeInput(), otherTenantId);

      const result = await repository.findEmployeeById(id, tenantId);
      expect(result).toBeNull();
    });
  });

  // -- findEmployeeByEmail ---------------------------------------------------

  describe('findEmployeeByEmail', () => {
    it('returns an employee by email', async () => {
      await repository.createEmployee(
        createEmployeeInput({ email: 'unique@example.com' }),
        tenantId,
      );

      const result = await repository.findEmployeeByEmail('unique@example.com', tenantId);

      expect(result).not.toBeNull();
      expect(result!.email).toBe('unique@example.com');
    });

    it('returns null when email not found', async () => {
      const result = await repository.findEmployeeByEmail('nobody@example.com', tenantId);
      expect(result).toBeNull();
    });

    it('does not return an employee from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Email Isolation Tenant' });
      await repository.createEmployee(
        createEmployeeInput({ email: 'shared@example.com' }),
        otherTenantId,
      );

      const result = await repository.findEmployeeByEmail('shared@example.com', tenantId);
      expect(result).toBeNull();
    });
  });

  // -- searchEmployees -------------------------------------------------------

  describe('searchEmployees', () => {
    it('returns only employees scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createEmployee(createEmployeeInput({ email: 'a@tenant.com' }), tenantId);
      await repository.createEmployee(createEmployeeInput({ email: 'b@other.com' }), otherTenantId);

      const result = await repository.searchEmployees({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].email).toBe('a@tenant.com');
    });

    it('filters by name search term', async () => {
      await repository.createEmployee(
        createEmployeeInput({ firstName: 'Alice', email: 'alice@example.com' }),
        tenantId,
      );
      await repository.createEmployee(
        createEmployeeInput({ firstName: 'Bob', email: 'bob@example.com' }),
        tenantId,
      );

      const result = await repository.searchEmployees(
        { search: 'alice', page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].firstName).toBe('Alice');
    });

    it('filters by status', async () => {
      await repository.createEmployee(
        createEmployeeInput({ status: EmployeeStatus.ACTIVE, email: 'active@example.com' }),
        tenantId,
      );
      await repository.createEmployee(
        createEmployeeInput({ status: EmployeeStatus.INACTIVE, email: 'inactive@example.com' }),
        tenantId,
      );

      const result = await repository.searchEmployees(
        { status: [EmployeeStatus.INACTIVE], page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('inactive@example.com');
    });

    it('filters by gender', async () => {
      await repository.createEmployee(
        createEmployeeInput({ gender: 'FEMALE', email: 'f@example.com' }),
        tenantId,
      );
      await repository.createEmployee(
        createEmployeeInput({ gender: 'MALE', email: 'm@example.com' }),
        tenantId,
      );

      const result = await repository.searchEmployees(
        { gender: ['MALE'], page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toBe('m@example.com');
    });

    it('filters by first letter (alphabet)', async () => {
      await repository.createEmployee(
        createEmployeeInput({ firstName: 'Alice', email: 'alice@example.com' }),
        tenantId,
      );
      await repository.createEmployee(
        createEmployeeInput({ firstName: 'Bob', email: 'bob@example.com' }),
        tenantId,
      );

      const result = await repository.searchEmployees(
        { alphabet: 'B', page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].firstName).toBe('Bob');
    });

    it('paginates correctly', async () => {
      await repository.createEmployee(createEmployeeInput({ email: 'e1@example.com' }), tenantId);
      await repository.createEmployee(createEmployeeInput({ email: 'e2@example.com' }), tenantId);
      await repository.createEmployee(createEmployeeInput({ email: 'e3@example.com' }), tenantId);

      const result = await repository.searchEmployees({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  // -- updateEmployee --------------------------------------------------------

  describe('updateEmployee', () => {
    it('updates employee fields and returns the updated employee', async () => {
      const { id } = await repository.createEmployee(
        createEmployeeInput({ firstName: 'Old', email: 'old@example.com' }),
        tenantId,
      );

      const result = await repository.updateEmployee(id, tenantId, {
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        phone: '0400000000',
        gender: 'MALE',
        dob: new Date('1985-01-01'),
        rate: 50,
        status: EmployeeStatus.INACTIVE,
        avatarUrl: null,
      });

      expect(result!.firstName).toBe('New');
      expect(result!.email).toBe('new@example.com');
      expect(result!.status).toBe(EmployeeStatus.INACTIVE);
      expect(result!.rate).toBeCloseTo(50);
    });

    it('returns null when employee not found', async () => {
      const result = await repository.updateEmployee('cltest000000000000none0001', tenantId, {
        firstName: 'X',
        lastName: 'Y',
        email: 'x@example.com',
        phone: '',
        gender: 'MALE',
        dob: new Date('1990-01-01'),
        rate: 10,
        status: EmployeeStatus.ACTIVE,
        avatarUrl: null,
      });

      expect(result).toBeNull();
    });

    it('does not update an employee belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Update Isolation Tenant' });
      const { id } = await repository.createEmployee(createEmployeeInput(), otherTenantId);

      const result = await repository.updateEmployee(id, tenantId, {
        firstName: 'Hacked',
        lastName: 'Name',
        email: 'hacked@example.com',
        phone: '',
        gender: 'MALE',
        dob: new Date('1990-01-01'),
        rate: 1,
        status: EmployeeStatus.ACTIVE,
        avatarUrl: null,
      });

      expect(result).toBeNull();

      const unchanged = await repository.findEmployeeById(id, otherTenantId);
      expect(unchanged!.firstName).toBe('Jane');
    });
  });

  // -- deleteEmployee --------------------------------------------------------

  describe('deleteEmployee', () => {
    it('permanently removes the employee', async () => {
      const { id } = await repository.createEmployee(createEmployeeInput(), tenantId);

      const deleted = await repository.deleteEmployee(id, tenantId);
      expect(deleted).toBe(true);

      const found = await repository.findEmployeeById(id, tenantId);
      expect(found).toBeNull();
    });

    it('returns false for a non-existent ID', async () => {
      const result = await repository.deleteEmployee('cltest000000000000none0001', tenantId);
      expect(result).toBe(false);
    });

    it('does not delete an employee belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const { id } = await repository.createEmployee(createEmployeeInput(), otherTenantId);

      const result = await repository.deleteEmployee(id, tenantId);
      expect(result).toBe(false);

      const stillExists = await repository.findEmployeeById(id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });

  // -- getActiveEmployees ----------------------------------------------------

  describe('getActiveEmployees', () => {
    it('returns only active employees for the tenant', async () => {
      await repository.createEmployee(
        createEmployeeInput({ status: EmployeeStatus.ACTIVE, email: 'active@example.com' }),
        tenantId,
      );
      await repository.createEmployee(
        createEmployeeInput({ status: EmployeeStatus.INACTIVE, email: 'inactive@example.com' }),
        tenantId,
      );

      const result = await repository.getActiveEmployees(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('active@example.com');
    });

    it('does not return employees from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Active Isolation Tenant' });
      await repository.createEmployee(createEmployeeInput(), otherTenantId);

      const result = await repository.getActiveEmployees(tenantId);
      expect(result).toHaveLength(0);
    });

    it('respects the limit parameter', async () => {
      await repository.createEmployee(createEmployeeInput({ email: 'e1@example.com' }), tenantId);
      await repository.createEmployee(createEmployeeInput({ email: 'e2@example.com' }), tenantId);
      await repository.createEmployee(createEmployeeInput({ email: 'e3@example.com' }), tenantId);

      const result = await repository.getActiveEmployees(tenantId, 2);
      expect(result).toHaveLength(2);
    });
  });
});
