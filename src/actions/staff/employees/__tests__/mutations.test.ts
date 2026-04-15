import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmployee, updateEmployee, deleteEmployee } from '../mutations';
import { testIds, mockSessions, createEmployeeInput, createEmployeeListItem } from '@/lib/testing';

const { mockEmployeeRepo, mockAuth } = vi.hoisted(() => ({
  mockEmployeeRepo: {
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_EMPLOYEE_ID = testIds.employee();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Employee Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createEmployee', () => {
    it('creates an employee when authorised', async () => {
      const input = createEmployeeInput();
      mockEmployeeRepo.createEmployee.mockResolvedValue({ id: TEST_EMPLOYEE_ID });

      const result = await createEmployee(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_EMPLOYEE_ID);
      }
      expect(mockEmployeeRepo.createEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: input.firstName }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createEmployee(createEmployeeInput());
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockEmployeeRepo.createEmployee.mockRejectedValue(new Error('DB error'));
      const result = await createEmployee(createEmployeeInput());
      expect(result.success).toBe(false);
    });
  });

  describe('updateEmployee', () => {
    it('updates an employee when authorised', async () => {
      const mockEmployee = createEmployeeListItem({ id: TEST_EMPLOYEE_ID });
      mockEmployeeRepo.updateEmployee.mockResolvedValue(mockEmployee);

      const input = { ...createEmployeeInput(), id: TEST_EMPLOYEE_ID };
      const result = await updateEmployee(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_EMPLOYEE_ID);
      }
      expect(mockEmployeeRepo.updateEmployee).toHaveBeenCalledWith(
        TEST_EMPLOYEE_ID,
        mockSession.user.tenantId,
        expect.objectContaining({ firstName: input.firstName }),
      );
    });

    it('returns error when employee not found', async () => {
      mockEmployeeRepo.updateEmployee.mockResolvedValue(null);
      const result = await updateEmployee({ ...createEmployeeInput(), id: TEST_EMPLOYEE_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Employee not found');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateEmployee({ ...createEmployeeInput(), id: TEST_EMPLOYEE_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('deleteEmployee', () => {
    it('deletes an employee when authorised', async () => {
      mockEmployeeRepo.deleteEmployee.mockResolvedValue(true);

      const result = await deleteEmployee({ id: TEST_EMPLOYEE_ID });

      expect(result.success).toBe(true);
      expect(mockEmployeeRepo.deleteEmployee).toHaveBeenCalledWith(
        TEST_EMPLOYEE_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when employee not found', async () => {
      mockEmployeeRepo.deleteEmployee.mockResolvedValue(false);
      const result = await deleteEmployee({ id: TEST_EMPLOYEE_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Employee not found');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteEmployee({ id: TEST_EMPLOYEE_ID });
      expect(result.success).toBe(false);
    });
  });
});

describe('Employee Mutations - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmployeeRepo.createEmployee.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
  });

  it('allows ADMIN role to create employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await createEmployee(createEmployeeInput());
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to create employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await createEmployee(createEmployeeInput());
    expect(result.success).toBe(true);
  });

  it('denies USER role from creating employees', async () => {
    mockAuth.mockResolvedValue(mockSessions.user());
    const result = await createEmployee(createEmployeeInput());
    expect(result.success).toBe(false);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createEmployee(createEmployeeInput());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(unauthorizedError);
    }
  });
});
