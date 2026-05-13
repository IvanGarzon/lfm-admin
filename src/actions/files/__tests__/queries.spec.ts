import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testIds, resetIdCounter } from '@/lib/testing/id-generator';

// -- Mocks --------------------------------------------------------------------

const { mockGetSignedDownloadUrl, mockS3Send, mockFetch, mockLogger } = vi.hoisted(() => ({
  mockGetSignedDownloadUrl: vi.fn(),
  mockS3Send: vi.fn(),
  mockFetch: vi.fn(),
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/s3', () => ({
  getSignedDownloadUrl: mockGetSignedDownloadUrl,
  s3Client: { send: mockS3Send },
}));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));
vi.mock('@/lib/error-handler', () => ({
  handleActionError: vi.fn((_err, message) => ({ success: false, error: message })),
}));

// Inject session via withAuth mock — call handler directly with controlled session
let mockSession = {
  user: { id: testIds.user(), role: 'ADMIN' },
  sessionToken: testIds.session(),
};

vi.mock('@/lib/action-auth', () => ({
  withAuth: (handler: (session: unknown, input: unknown) => unknown) => (input: unknown) =>
    handler(mockSession, input),
}));

vi.stubGlobal('fetch', mockFetch);
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

// -- Import after mocks -------------------------------------------------------

const { listFiles, getFileDownloadUrl, checkStorageHealth } =
  await import('@/actions/files/queries');

// -- Tests --------------------------------------------------------------------

describe('listFiles', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
  });

  it('returns parsed file list with summary from S3', async () => {
    mockS3Send.mockResolvedValue({
      Contents: [
        {
          Key: 'quotes/abc123/attachments/1234-invoice.pdf',
          Size: 2048,
          LastModified: new Date('2026-01-01'),
        },
        {
          Key: 'invoices/xyz789/pdfs/1234-receipt.pdf',
          Size: 1024,
          LastModified: new Date('2026-01-02'),
        },
      ],
    });

    const result = await listFiles();

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.count).toBe(2);
    expect(result.data.files[0]).toMatchObject({
      key: 'quotes/abc123/attachments/1234-invoice.pdf',
      resourceType: 'quotes',
      resourceId: 'abc123',
      fileType: 'quote-attachment',
    });
    expect(result.data.files[1]).toMatchObject({
      resourceType: 'invoices',
      fileType: 'invoice-pdf',
    });
  });

  it('returns empty list when bucket is empty', async () => {
    mockS3Send.mockResolvedValue({ Contents: [] });

    const result = await listFiles();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.count).toBe(0);
    expect(result.data.files).toHaveLength(0);
    expect(result.data.summary).toHaveLength(0);
  });

  it('handles missing Contents in S3 response', async () => {
    mockS3Send.mockResolvedValue({});

    const result = await listFiles();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.count).toBe(0);
  });

  it('returns error when S3 throws', async () => {
    mockS3Send.mockRejectedValue(new Error('S3 unavailable'));

    const result = await listFiles();

    expect(result.success).toBe(false);
  });
});

describe('getFileDownloadUrl', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
  });

  it('returns signed URL for valid s3Key', async () => {
    mockGetSignedDownloadUrl.mockResolvedValue('https://signed.example.com/file.pdf');

    const result = await getFileDownloadUrl('quotes/abc/attachments/file.pdf');

    expect(result).toEqual({
      success: true,
      data: { url: 'https://signed.example.com/file.pdf', expiresIn: '24 hours' },
    });
  });

  it('rejects when no s3Key is provided', async () => {
    const result = await getFileDownloadUrl('');

    expect(result).toEqual({ success: false, error: 'No s3Key provided' });
    expect(mockGetSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('returns error when S3 signing throws', async () => {
    mockGetSignedDownloadUrl.mockRejectedValue(new Error('signing failed'));

    const result = await getFileDownloadUrl('quotes/abc/file.pdf');

    expect(result.success).toBe(false);
  });

  // NOTE: getFileDownloadUrl has no tenant ownership check — any authenticated
  // user can generate a signed URL for any s3Key if they know the key format.
  // Tracked in security audit as a known gap (withAuth has no tenantId context).
  it('generates URL for any s3Key regardless of tenant (known gap)', async () => {
    mockGetSignedDownloadUrl.mockResolvedValue('https://signed.example.com/other-tenant-file.pdf');
    const otherTenantKey = `quotes/${testIds.quote()}/attachments/sensitive.pdf`;

    const result = await getFileDownloadUrl(otherTenantKey);

    expect(result.success).toBe(true);
  });
});

describe('checkStorageHealth', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.clearAllMocks();
    mockSession = { ...mockSession, user: { id: testIds.user(), role: 'ADMIN' } };
  });

  it('returns healthy when S3 status is available', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        services: { s3: 'available' },
        version: '3.0',
        edition: 'community',
      }),
    });

    const result = await checkStorageHealth();

    expect(result).toMatchObject({
      success: true,
      data: { healthy: true, endpoint: 'http://localhost:4566' },
    });
  });

  it('returns healthy when S3 status is running', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ services: { s3: 'running' } }),
    });

    const result = await checkStorageHealth();

    expect(result).toMatchObject({ success: true, data: { healthy: true } });
  });

  it('returns not healthy when S3 status is not available', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ services: { s3: 'error' } }),
    });

    const result = await checkStorageHealth();

    expect(result).toMatchObject({ success: true, data: { healthy: false } });
  });

  it('rejects non-ADMIN users', async () => {
    mockSession = { ...mockSession, user: { id: testIds.user(), role: 'USER' } };

    const result = await checkStorageHealth();

    expect(result).toEqual({
      success: false,
      error: 'Forbidden: Only admins can check storage health',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when health endpoint throws', async () => {
    mockFetch.mockRejectedValue(new Error('connection refused'));

    const result = await checkStorageHealth();

    expect(result.success).toBe(false);
  });
});
