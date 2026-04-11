import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCustomer, updateCustomer, deleteCustomer } from '../mutations';
import { testIds, mockSessions, createCustomerInput } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { UpdateCustomerInput } from '@/schemas/customers';

const { mockCustomerRepo, mockOrgRepo, mockAuth } = vi.hoisted(() => ({
  mockCustomerRepo: {
    findCustomerByEmail: vi.fn(),
    createCustomer: vi.fn(),
    findById: vi.fn(),
    updateCustomer: vi.fn(),
    softDeleteCustomer: vi.fn(),
  },
  mockOrgRepo: {
    findOrCreateOrganization: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/customer-repository', () => ({
  CustomerRepository: vi.fn().mockImplementation(function () {
    return mockCustomerRepo;
  }),
}));

vi.mock('@/repositories/organization-repository', () => ({
  OrganizationRepository: vi.fn().mockImplementation(function () {
    return mockOrgRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const TEST_CUSTOMER_ID = testIds.customer();
const TEST_ORG_ID = testIds.organization();

const baseInput = createCustomerInput;

describe('Customer Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockCustomerRepo.findCustomerByEmail.mockResolvedValue(null);
  });

  describe('createCustomer', () => {
    it('creates a customer and returns the ID', async () => {
      mockCustomerRepo.createCustomer.mockResolvedValue({ id: TEST_CUSTOMER_ID });

      const result = await createCustomer(baseInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_CUSTOMER_ID);
      }
      expect(mockCustomerRepo.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jane@example.com' }),
        mockSession.user.tenantId,
      );
      expect(revalidatePath).toHaveBeenCalledWith('/customers');
    });

    it('returns error when email already exists', async () => {
      mockCustomerRepo.findCustomerByEmail.mockResolvedValue({ id: 'existing-id' });

      const result = await createCustomer(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/email already exists/i);
      }
      expect(mockCustomerRepo.createCustomer).not.toHaveBeenCalled();
    });

    it('creates and links a new organisation when organisationName is provided', async () => {
      const orgId = TEST_ORG_ID;
      mockOrgRepo.findOrCreateOrganization.mockResolvedValue({ id: orgId, name: 'Acme' });
      mockCustomerRepo.createCustomer.mockResolvedValue({ id: TEST_CUSTOMER_ID });

      const result = await createCustomer({ ...baseInput, organizationName: 'Acme' });

      expect(result.success).toBe(true);
      expect(mockOrgRepo.findOrCreateOrganization).toHaveBeenCalledWith(
        'Acme',
        mockSession.user.tenantId,
      );
      expect(mockCustomerRepo.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: orgId }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorized when not signed in', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createCustomer(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/signed in/i);
      }
    });
  });

  describe('updateCustomer', () => {
    const updateInput: UpdateCustomerInput = {
      ...baseInput,
      phone: '+1234567890',
      id: TEST_CUSTOMER_ID,
    };

    it('updates a customer and returns the ID', async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: TEST_CUSTOMER_ID });
      mockCustomerRepo.updateCustomer.mockResolvedValue({ id: TEST_CUSTOMER_ID });

      const result = await updateCustomer(updateInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_CUSTOMER_ID);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/crm/customers');
      expect(revalidatePath).toHaveBeenCalledWith(`/crm/customers/${TEST_CUSTOMER_ID}`);
    });

    it('returns error when customer does not exist', async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      const result = await updateCustomer(updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockCustomerRepo.updateCustomer).not.toHaveBeenCalled();
    });

    it('returns error when update returns null', async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: TEST_CUSTOMER_ID });
      mockCustomerRepo.updateCustomer.mockResolvedValue(null);

      const result = await updateCustomer(updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/failed to update/i);
      }
    });
  });

  describe('deleteCustomer', () => {
    it('soft-deletes a customer and returns the ID', async () => {
      mockCustomerRepo.softDeleteCustomer.mockResolvedValue({ id: TEST_CUSTOMER_ID });

      const result = await deleteCustomer({ id: TEST_CUSTOMER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_CUSTOMER_ID);
      }
      expect(mockCustomerRepo.softDeleteCustomer).toHaveBeenCalledWith(
        TEST_CUSTOMER_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when soft-delete returns falsy', async () => {
      mockCustomerRepo.softDeleteCustomer.mockResolvedValue(null);

      const result = await deleteCustomer({ id: TEST_CUSTOMER_ID });

      expect(result.success).toBe(false);
    });
  });
});
