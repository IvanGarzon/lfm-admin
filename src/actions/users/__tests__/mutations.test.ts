import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  updateUser,
  updateUserSecurity,
  updateUserRole,
  softDeleteUser,
  inviteUser,
  uploadUserAvatar,
  changePassword,
  sendPasswordResetEmail,
  resetPassword
} from '../mutations';
import { testIds } from '@/lib/testing/id-generator';
import { mockSessions } from '@/lib/testing/factories/session.factory';
import { createUpdateUserInput } from '@/lib/testing/factories/user.factory';
import { revalidatePath } from 'next/cache';
import { sendEmailNotification } from '@/lib/email-service';
import { uploadFileToS3 } from '@/lib/s3';
import type { UserDetail } from '@/features/users/types';

const { mockUserRepo, mockInvitationRepo, mockTenantRepo, mockPasswordResetTokenRepo, mockAuth } =
  vi.hoisted(() => ({
    mockUserRepo: {
      findTenantUserById: vi.fn(),
      updateTenantUser: vi.fn(),
      updateUserSecurity: vi.fn(),
      updateTenantUserRole: vi.fn(),
      softDeleteTenantUser: vi.fn(),
      updateUserAvatar: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserByIdWithSelect: vi.fn(),
      updatePassword: vi.fn(),
      findById: vi.fn()
    },
    mockPasswordResetTokenRepo: {
      create: vi.fn(),
      findValid: vi.fn(),
      invalidateAllForUser: vi.fn()
    },
    mockInvitationRepo: {
      findPendingByEmail: vi.fn(),
      create: vi.fn(),
      revoke: vi.fn()
    },
    mockTenantRepo: {
      findTenantById: vi.fn()
    },
    mockAuth: vi.fn()
  }));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  })
}));

vi.mock('@/repositories/invitation-repository', () => ({
  InvitationRepository: vi.fn().mockImplementation(function () {
    return mockInvitationRepo;
  })
}));

vi.mock('@/repositories/tenant-repository', () => ({
  TenantRepository: vi.fn().mockImplementation(function () {
    return mockTenantRepo;
  })
}));

vi.mock('@/repositories/password-reset-token-repository', () => ({
  PasswordResetTokenRepository: vi.fn().mockImplementation(function () {
    return mockPasswordResetTokenRepo;
  })
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}));

vi.mock('@/lib/email-service', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn().mockResolvedValue({
    s3Key: 'users/test-id/avatar/avatar.jpg',
    s3Url: 'https://bucket.s3.region.amazonaws.com/users/test-id/avatar/avatar.jpg'
  })
}));

vi.mock('@/lib/utils', () => ({
  absoluteUrl: vi.fn((path: string) => `https://example.com${path}`),
  getPaginationMetadata: vi.fn()
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const TEST_USER_ID = testIds.user();

const mockUser: UserDetail = {
  id: TEST_USER_ID,
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  isTwoFactorEnabled: false,
  loginNotificationsEnabled: false,
  lastLoginAt: null,
  username: null,
  title: null,
  bio: null,
  avatarUrl: null,
  addedBy: null
};

const baseInput = createUpdateUserInput({ id: TEST_USER_ID });

describe('User Mutations', () => {
  const mockSession = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockUserRepo.findTenantUserById.mockResolvedValue(mockUser);
  });

  describe('updateUser', () => {
    it('updates user and returns the record', async () => {
      mockUserRepo.updateTenantUser.mockResolvedValue(mockUser);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUser).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockUserRepo.updateTenantUser).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSecurity', () => {
    it('enables two-factor authentication', async () => {
      mockUserRepo.updateUserSecurity.mockResolvedValue({ ...mockUser, isTwoFactorEnabled: true });

      const result = await updateUserSecurity({ id: TEST_USER_ID, isTwoFactorEnabled: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isTwoFactorEnabled).toBe(true);
      }
      expect(mockUserRepo.updateUserSecurity).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        { isTwoFactorEnabled: true }
      );
    });

    it('disables two-factor authentication', async () => {
      mockUserRepo.updateUserSecurity.mockResolvedValue({ ...mockUser, isTwoFactorEnabled: false });

      const result = await updateUserSecurity({ id: TEST_USER_ID, isTwoFactorEnabled: false });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateUserSecurity).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        { isTwoFactorEnabled: false }
      );
    });

    it('enables login notifications', async () => {
      mockUserRepo.updateUserSecurity.mockResolvedValue({
        ...mockUser,
        loginNotificationsEnabled: true
      });

      const result = await updateUserSecurity({
        id: TEST_USER_ID,
        loginNotificationsEnabled: true
      });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateUserSecurity).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        { loginNotificationsEnabled: true }
      );
    });

    it('disables login notifications', async () => {
      mockUserRepo.updateUserSecurity.mockResolvedValue({
        ...mockUser,
        loginNotificationsEnabled: false
      });

      const result = await updateUserSecurity({
        id: TEST_USER_ID,
        loginNotificationsEnabled: false
      });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateUserSecurity).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        { loginNotificationsEnabled: false }
      );
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUserSecurity({ id: TEST_USER_ID, isTwoFactorEnabled: true });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockUserRepo.updateUserSecurity).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUserSecurity({ id: TEST_USER_ID, isTwoFactorEnabled: true });

      expect(result.success).toBe(false);
    });
  });

  describe('updateUserRole', () => {
    it('updates role and returns the user', async () => {
      mockUserRepo.updateTenantUserRole.mockResolvedValue({ ...mockUser, role: 'ADMIN' });

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUserRole).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        'ADMIN'
      );
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(false);
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('softDeleteUser', () => {
    it('soft-deletes user and returns the id', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(true);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('returns error when user not found', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(false);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(false);
    });
  });

  describe('inviteUser', () => {
    const mockInvitation = {
      id: 'inv-1',
      token: 'test-token-abc',
      role: 'USER' as const,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
    };

    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
    const mockInviter = { id: 'user-1', firstName: 'Jane', lastName: 'Admin' };

    beforeEach(() => {
      mockInvitationRepo.findPendingByEmail.mockResolvedValue(null);
      mockInvitationRepo.create.mockResolvedValue(mockInvitation);
      mockTenantRepo.findTenantById.mockResolvedValue(mockTenant);
      mockUserRepo.findById.mockResolvedValue(mockInviter);
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
    });

    it('sends invitation and returns success', async () => {
      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(true);
      expect(mockInvitationRepo.create).toHaveBeenCalled();
      expect(vi.mocked(sendEmailNotification)).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'new@example.com' })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('returns error when pending invitation already exists', async () => {
      mockInvitationRepo.findPendingByEmail.mockResolvedValue(mockInvitation);

      const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/already pending/i);
      }
      expect(mockInvitationRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when user with email already exists in tenant', async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue({
        id: 'u-1',
        tenantId: mockSession.user.tenantId
      });

      const result = await inviteUser({ email: 'existing@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/already exists/i);
      }
    });

    it('revokes invitation and returns error when email send fails', async () => {
      vi.mocked(sendEmailNotification).mockRejectedValueOnce(new Error('SMTP error'));

      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(false);
      expect(mockInvitationRepo.create).toHaveBeenCalled();
      expect(mockInvitationRepo.revoke).toHaveBeenCalledWith(mockInvitation.id);
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await inviteUser({ email: 'new@example.com', role: 'USER' });

      expect(result.success).toBe(false);
    });
  });

  describe('uploadUserAvatar', () => {
    const mockFile = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
    const mockAvatarUrl = 'https://bucket.s3.region.amazonaws.com/users/test-id/avatar/avatar.jpg';

    beforeEach(() => {
      mockUserRepo.updateUserAvatar.mockResolvedValue(undefined);
      vi.mocked(uploadFileToS3).mockResolvedValue({
        s3Key: 'users/test-id/avatar/avatar.jpg',
        s3Url: mockAvatarUrl
      });
    });

    it('uploads avatar and returns the url', async () => {
      const formData = new FormData();
      formData.append('userId', TEST_USER_ID);
      formData.append('file', mockFile);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatarUrl).toBe(mockAvatarUrl);
      }
      expect(mockUserRepo.updateUserAvatar).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        mockAvatarUrl
      );
    });

    it('returns error when userId is missing', async () => {
      const formData = new FormData();
      formData.append('file', mockFile);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(false);
      expect(mockUserRepo.updateUserAvatar).not.toHaveBeenCalled();
    });

    it('returns error when file is missing', async () => {
      const formData = new FormData();
      formData.append('userId', TEST_USER_ID);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(false);
      expect(mockUserRepo.updateUserAvatar).not.toHaveBeenCalled();
    });

    it('returns error when file type is not an image', async () => {
      const pdfFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('userId', TEST_USER_ID);
      formData.append('file', pdfFile);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/image/i);
      }
      expect(mockUserRepo.updateUserAvatar).not.toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('userId', TEST_USER_ID);
      formData.append('file', mockFile);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(false);
      expect(mockUserRepo.updateUserAvatar).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('userId', TEST_USER_ID);
      formData.append('file', mockFile);

      const result = await uploadUserAvatar(formData);

      expect(result.success).toBe(false);
    });
  });

  describe('changePassword', () => {
    const mockBcryptCompare = bcrypt.compare as unknown as MockInstance;
    const mockBcryptHash = bcrypt.hash as unknown as MockInstance;

    // changePassword uses withAuth and compares session.user.id === userId
    // so the userId in input must match the session's user id
    const SESSION_USER_ID = mockSession.user.id;

    const validInput = {
      userId: SESSION_USER_ID,
      currentPassword: 'current-pass',
      newPassword: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!'
    };

    beforeEach(() => {
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue({
        id: SESSION_USER_ID,
        password: 'hashed-current-password'
      });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue('hashed-new-password');
      mockUserRepo.updatePassword.mockResolvedValue(undefined);
    });

    it('changes password when current password is correct', async () => {
      const result = await changePassword(validInput);

      expect(result.success).toBe(true);
      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
        SESSION_USER_ID,
        'hashed-new-password'
      );
    });

    it('returns error when session userId does not match input userId', async () => {
      const result = await changePassword({
        ...validInput,
        userId: TEST_USER_ID
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/unauthorised/i);
      }
      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue(null);

      const result = await changePassword(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
    });

    it('returns error when account has no password set', async () => {
      mockUserRepo.getUserByIdWithSelect.mockResolvedValue({
        id: SESSION_USER_ID,
        password: null
      });

      const result = await changePassword(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/no password set/i);
      }
    });

    it('returns error when current password is incorrect', async () => {
      mockBcryptCompare.mockResolvedValue(false);

      const result = await changePassword(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/incorrect/i);
      }
      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await changePassword(validInput);

      expect(result.success).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    const mockResetToken = {
      id: 'token-1',
      token: 'reset-token-abc',
      userId: TEST_USER_ID,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue({
        id: mockSession.user.id,
        firstName: 'Jane',
        lastName: 'Admin'
      });
      mockPasswordResetTokenRepo.create.mockResolvedValue(mockResetToken);
    });

    it('sends reset email and returns success', async () => {
      const result = await sendPasswordResetEmail(TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(mockPasswordResetTokenRepo.create).toHaveBeenCalled();
      expect(vi.mocked(sendEmailNotification)).toHaveBeenCalledWith(
        expect.objectContaining({ to: mockUser.email })
      );
    });

    it('returns error when target user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await sendPasswordResetEmail(TEST_USER_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockPasswordResetTokenRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when requester not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const result = await sendPasswordResetEmail(TEST_USER_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/requester not found/i);
      }
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await sendPasswordResetEmail(TEST_USER_ID);

      expect(result.success).toBe(false);
    });
  });

  describe('resetPassword', () => {
    const mockBcryptHash = bcrypt.hash as unknown as MockInstance;

    const mockResetRecord = { id: 'token-1', userId: TEST_USER_ID };

    beforeEach(() => {
      mockPasswordResetTokenRepo.findValid.mockResolvedValue(mockResetRecord);
      mockBcryptHash.mockResolvedValue('hashed-new-password');
      mockUserRepo.updatePassword.mockResolvedValue(undefined);
      mockPasswordResetTokenRepo.invalidateAllForUser.mockResolvedValue(undefined);
    });

    it('resets password and invalidates all tokens on success', async () => {
      const result = await resetPassword('valid-token', 'new-secure-pass');

      expect(result.success).toBe(true);
      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(TEST_USER_ID, 'hashed-new-password');
      expect(mockPasswordResetTokenRepo.invalidateAllForUser).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('returns error when token is invalid or expired', async () => {
      mockPasswordResetTokenRepo.findValid.mockResolvedValue(null);

      const result = await resetPassword('expired-token', 'new-secure-pass');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/invalid or has expired/i);
      }
      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    });
  });
});
