import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmployees, getEmployeeById } from '../queries';
import { testIds, mockSessions, createEmployeeListItem } from '@/lib/testing';

const { mockEmployeeRepo, mockAuth } = vi.hoisted(() => ({
  mockEmployeeRepo: {
    searchEmployees: vi.fn(),
    findEmployeeById: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/employee-repository', () => ({
  EmployeeRepository: vi.fn().mockImplementation(function () {
    return mockEmployeeRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const TEST_EMPLOYEE_ID = testIds.employee();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Employee Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getEmployees', () => {
    it('returns paginated employees when authorised', async () => {
      const mockResult = {
        items: [createEmployeeListItem({ id: 'e1' }), createEmployeeListItem({ id: 'e2' })],
        pagination: { page: 1, perPage: 20, totalItems: 2, totalPages: 1 },
      };
      mockEmployeeRepo.searchEmployees.mockResolvedValue(mockResult);

      const result = await getEmployees({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockEmployeeRepo.searchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 20 }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getEmployees({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockEmployeeRepo.searchEmployees.mockRejectedValue(new Error('DB error'));
      const result = await getEmployees({});
      expect(result.success).toBe(false);
    });
  });

  describe('getEmployeeById', () => {
    it('returns employee details when authorised', async () => {
      const mockEmployee = createEmployeeListItem({ id: TEST_EMPLOYEE_ID });
      mockEmployeeRepo.findEmployeeById.mockResolvedValue(mockEmployee);

      const result = await getEmployeeById(TEST_EMPLOYEE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(TEST_EMPLOYEE_ID);
      }
      expect(mockEmployeeRepo.findEmployeeById).toHaveBeenCalledWith(
        TEST_EMPLOYEE_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when employee not found', async () => {
      mockEmployeeRepo.findEmployeeById.mockResolvedValue(null);
      const result = await getEmployeeById('non-existent');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Employee not found');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getEmployeeById(TEST_EMPLOYEE_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });
});

describe('Employee Queries - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmployeeRepo.searchEmployees.mockResolvedValue({ items: [], pagination: {} });
  });

  it('allows USER role to read employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.user());
    const result = await getEmployees({});
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to read employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await getEmployees({});
    expect(result.success).toBe(true);
  });

  it('allows ADMIN role to read employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await getEmployees({});
    expect(result.success).toBe(true);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getEmployees({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(unauthorizedError);
    }
  });
});
