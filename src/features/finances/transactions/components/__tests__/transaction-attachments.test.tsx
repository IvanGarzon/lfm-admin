// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionAttachments } from '../transaction-attachments';
import type { TransactionAttachment } from '@/features/finances/transactions/types';

// -- Mocks ------------------------------------------------------------------

const { mockUploadMutate, mockDeleteMutate } = vi.hoisted(() => ({
  mockUploadMutate: vi.fn(),
  mockDeleteMutate: vi.fn()
}));

vi.mock('@/features/finances/transactions/hooks/use-transaction-queries', () => ({
  useUploadTransactionAttachment: () => ({ mutate: mockUploadMutate, isPending: false }),
  useDeleteTransactionAttachment: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    variables: null
  })
}));

vi.mock('@/lib/file-constants', () => ({
  formatFileSize: (size: number) => `${size} bytes`,
  isImageFile: (mimeType: string) => mimeType.startsWith('image/')
}));

// -- Helpers ----------------------------------------------------------------

function createAttachment(overrides: Partial<TransactionAttachment> = {}): TransactionAttachment {
  return {
    id: 'att-1',
    fileName: 'receipt.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    s3Key: 'uploads/receipt.pdf',
    s3Url: 'https://example.com/receipt.pdf',
    uploadedBy: null,
    uploadedAt: new Date(),
    ...overrides
  };
}

// -- Tests ------------------------------------------------------------------

describe('TransactionAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Heading --------------------------------------------------------------

  it('renders the Attachments heading', () => {
    render(<TransactionAttachments attachments={[]} />);
    expect(screen.getByText('Attachments')).toBeInTheDocument();
  });

  // -- Create mode ----------------------------------------------------------

  it('shows "Save the transaction first" message in create mode without transactionId', () => {
    render(<TransactionAttachments attachments={[]} mode='create' />);
    expect(screen.getByText(/save the transaction first/i)).toBeInTheDocument();
  });

  it('does not show Upload button in create mode', () => {
    render(<TransactionAttachments attachments={[]} mode='create' />);
    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
  });

  // -- Edit mode ------------------------------------------------------------

  it('shows Upload button in edit mode with transactionId', () => {
    render(<TransactionAttachments attachments={[]} transactionId='txn-1' mode='edit' />);
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('does not show "Save the transaction first" message in edit mode with transactionId', () => {
    render(<TransactionAttachments attachments={[]} transactionId='txn-1' mode='edit' />);
    expect(screen.queryByText(/save the transaction first/i)).not.toBeInTheDocument();
  });

  // -- Attachment list ------------------------------------------------------

  it('renders attachment file names', () => {
    const attachments = [
      createAttachment({ id: 'att-1', fileName: 'invoice.pdf' }),
      createAttachment({ id: 'att-2', fileName: 'receipt.jpg' })
    ];
    render(<TransactionAttachments attachments={attachments} transactionId='txn-1' mode='edit' />);
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('receipt.jpg')).toBeInTheDocument();
  });

  it('shows the attachment count badge', () => {
    const attachments = [
      createAttachment(),
      createAttachment({ id: 'att-2', fileName: 'doc.pdf' })
    ];
    render(<TransactionAttachments attachments={attachments} transactionId='txn-1' mode='edit' />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show a badge when there are no attachments', () => {
    render(<TransactionAttachments attachments={[]} transactionId='txn-1' mode='edit' />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders a View button for each attachment', () => {
    const attachments = [
      createAttachment(),
      createAttachment({ id: 'att-2', fileName: 'doc.pdf' })
    ];
    render(<TransactionAttachments attachments={attachments} transactionId='txn-1' mode='edit' />);
    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(2);
  });

  it('shows delete buttons in edit mode with transactionId', () => {
    const attachments = [createAttachment()];
    render(<TransactionAttachments attachments={attachments} transactionId='txn-1' mode='edit' />);
    expect(screen.getByRole('button', { name: 'Delete attachment' })).toBeInTheDocument();
  });
});
