import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testIds, resetIdCounter } from '@/lib/testing/id-generator';

// -- Mocks --------------------------------------------------------------------

const {
  mockFindQuoteById,
  mockUploadFileToS3,
  mockDeleteFileFromS3,
  mockGetRequestIp,
  mockCheckRateLimit,
  mockLogger,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockFindQuoteById: vi.fn(),
  mockUploadFileToS3: vi.fn(),
  mockDeleteFileFromS3: vi.fn(),
  mockGetRequestIp: vi.fn().mockResolvedValue('127.0.0.1'),
  mockCheckRateLimit: vi.fn().mockResolvedValue(null),
  mockLogger: { info: vi.fn(), error: vi.fn() },
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/db/quotes/queries', () => ({ findQuoteById: mockFindQuoteById }));
vi.mock('@/lib/s3', () => ({
  uploadFileToS3: mockUploadFileToS3,
  deleteFileFromS3: mockDeleteFileFromS3,
  generateS3Key: vi.fn().mockReturnValue('quotes/abc/attachments/file.pdf'),
  getS3Url: vi
    .fn()
    .mockReturnValue('https://bucket.s3.example.com/quotes/abc/attachments/file.pdf'),
  s3Client: { send: vi.fn() },
}));
vi.mock('@/rate-limiter', () => ({
  uploadLimiter: null,
  checkRateLimit: mockCheckRateLimit,
  getRequestIp: mockGetRequestIp,
}));
vi.mock('@/logger', () => ({ logger: mockLogger }));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));
vi.mock('@aws-sdk/client-s3', () => ({ PutObjectCommand: vi.fn() }));

// Bypass withTenantPermission — inject ctx directly into the handler
vi.mock('@/lib/action-auth', () => ({
  withTenantPermission:
    (_permission: string, handler: (ctx: unknown, input: unknown) => unknown) => (input: unknown) =>
      handler(mockCtx, input),
}));

let mockCtx = {
  tenantId: '',
  tenantSlug: 'tenant-a',
  userId: testIds.user(),
  user: { id: '', role: 'ADMIN' },
};

// -- Import after mocks -------------------------------------------------------

const { uploadFile, deleteFile } = await import('@/actions/files/mutations');

// -- Helpers ------------------------------------------------------------------

function makeFormData(file: File, quoteId: string): FormData {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('quoteId', quoteId);
  return fd;
}

function makePdfFile(name = 'test.pdf', sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'application/pdf' });
}

// -- Tests --------------------------------------------------------------------

describe('uploadFile', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
    mockGetRequestIp.mockResolvedValue('127.0.0.1');
    mockCheckRateLimit.mockResolvedValue(null);
    mockCtx = { ...mockCtx, tenantId: testIds.tenant() };
  });

  // -- IDOR -----------------------------------------------------------------

  it('rejects upload when quoteId belongs to a different tenant', async () => {
    const crossTenantQuoteId = testIds.quote();
    mockFindQuoteById.mockResolvedValue(null); // not found in caller's tenant

    const result = await uploadFile(makeFormData(makePdfFile(), crossTenantQuoteId));

    expect(result).toEqual({ success: false, error: 'Quote not found' });
    expect(mockFindQuoteById).toHaveBeenCalledWith(
      expect.anything(),
      crossTenantQuoteId,
      mockCtx.tenantId,
    );
    expect(mockUploadFileToS3).not.toHaveBeenCalled();
  });

  it("allows upload when quoteId belongs to the caller's tenant", async () => {
    const ownQuoteId = testIds.quote();
    mockFindQuoteById.mockResolvedValue({ id: ownQuoteId });
    mockUploadFileToS3.mockResolvedValue({
      s3Key: 'quotes/abc/attachments/test.pdf',
      s3Url: 'https://example.com/test.pdf',
    });

    const result = await uploadFile(makeFormData(makePdfFile(), ownQuoteId));

    expect(result.success).toBe(true);
    expect(mockUploadFileToS3).toHaveBeenCalled();
  });

  it('skips ownership check for non-CUID quoteId', async () => {
    mockUploadFileToS3.mockResolvedValue({
      s3Key: 'quotes/general/attachments/test.pdf',
      s3Url: 'https://example.com/test.pdf',
    });

    const result = await uploadFile(makeFormData(makePdfFile(), 'general'));

    expect(result.success).toBe(true);
    expect(mockFindQuoteById).not.toHaveBeenCalled();
  });

  // -- Validation -----------------------------------------------------------

  it('rejects when no file is provided', async () => {
    const fd = new FormData();
    fd.append('quoteId', testIds.quote());

    const result = await uploadFile(fd);

    expect(result).toEqual({ success: false, error: 'No file provided' });
  });

  it('rejects when no quoteId is provided', async () => {
    const fd = new FormData();
    fd.append('file', makePdfFile());

    const result = await uploadFile(fd);

    expect(result).toEqual({ success: false, error: 'No quoteId provided' });
  });
});

describe('deleteFile', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockCtx = { ...mockCtx, tenantId: testIds.tenant() };
  });

  // -- IDOR -----------------------------------------------------------------

  it('rejects delete when s3Key quoteId belongs to a different tenant', async () => {
    const crossTenantQuoteId = testIds.quote();
    mockFindQuoteById.mockResolvedValue(null);

    const result = await deleteFile(`quotes/${crossTenantQuoteId}/attachments/file.pdf`);

    expect(result).toEqual({ success: false, error: 'Quote not found' });
    expect(mockFindQuoteById).toHaveBeenCalledWith(
      expect.anything(),
      crossTenantQuoteId,
      mockCtx.tenantId,
    );
    expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
  });

  it("allows delete when s3Key quoteId belongs to the caller's tenant", async () => {
    const ownQuoteId = testIds.quote();
    mockFindQuoteById.mockResolvedValue({ id: ownQuoteId });
    mockDeleteFileFromS3.mockResolvedValue(undefined);

    const result = await deleteFile(`quotes/${ownQuoteId}/attachments/file.pdf`);

    expect(result).toEqual({ success: true, data: { message: 'File deleted successfully' } });
    expect(mockDeleteFileFromS3).toHaveBeenCalled();
  });

  it('skips ownership check for non-quotes s3Key', async () => {
    mockDeleteFileFromS3.mockResolvedValue(undefined);

    const result = await deleteFile('invoices/some-id/attachments/file.pdf');

    expect(result).toEqual({ success: true, data: { message: 'File deleted successfully' } });
    expect(mockFindQuoteById).not.toHaveBeenCalled();
  });

  it('skips ownership check when quoteId segment is not a CUID', async () => {
    mockDeleteFileFromS3.mockResolvedValue(undefined);

    const result = await deleteFile('quotes/general/attachments/file.pdf');

    expect(result).toEqual({ success: true, data: { message: 'File deleted successfully' } });
    expect(mockFindQuoteById).not.toHaveBeenCalled();
  });

  it('rejects when no s3Key is provided', async () => {
    const result = await deleteFile('');

    expect(result).toEqual({ success: false, error: 'No s3Key provided' });
  });
});
