'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listFiles, getFileDownloadUrl, checkStorageHealth } from '@/actions/files/queries';
import { uploadFile, deleteFile } from '@/actions/files/mutations';
import { formatFileSize } from '@/lib/file-constants';

// -- File Query Keys -------------------------------------------------------

const FILE_KEYS = {
  all: ['files'] as const,
  lists: () => [...FILE_KEYS.all, 'list'] as const,
  health: () => [...FILE_KEYS.all, 'health'] as const,
};

/**
 * Fetches all files from S3 storage with metadata.
 * Use this hook for file list views and browsers.
 *
 * @returns Query result containing files array and statistics
 */
export function useFiles() {
  return useQuery({
    queryKey: FILE_KEYS.lists(),
    queryFn: async () => {
      const result = await listFiles();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch files');
      }

      return result.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
}

/**
 * Checks the health status of S3 storage service.
 * Use this hook for developer tools and health monitoring.
 *
 * @returns Query result containing health status
 */
export function useStorageHealth() {
  return useQuery({
    queryKey: FILE_KEYS.health(),
    queryFn: async () => {
      const result = await checkStorageHealth();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check storage health');
      }

      return result.data;
    },
    enabled: false, // Only run when explicitly called
    retry: false,
  });
}

/**
 * Uploads a file to S3 storage.
 * Use this hook for file upload operations.
 *
 * @returns Mutation hook for uploading files
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', 'general-upload');

      const result = await uploadFile(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload file');
      }

      return result.data;
    },
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.lists() });
      toast.success('File uploaded successfully', {
        description: `${data.fileName} (${formatFileSize(data.fileSize)})`,
      });
    },
    onError: (error: Error) => {
      toast.error('Upload failed', {
        description: error.message || 'Unknown error',
      });
    },
  });
}

/**
 * Deletes a file from S3 storage.
 * Use this hook for file deletion operations.
 *
 * @returns Mutation hook for deleting files
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { s3Key: string; fileName: string }) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${params.fileName}"? This action cannot be undone.`,
      );

      if (!confirmed) {
        throw new Error('Delete cancelled');
      }

      const result = await deleteFile(params.s3Key);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      return { ...result.data, fileName: params.fileName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.lists() });
      toast.success('File deleted', {
        description: data.fileName,
      });
    },
    onError: (error: Error) => {
      if (error.message !== 'Delete cancelled') {
        toast.error('Delete failed', {
          description: error.message || 'Unknown error',
        });
      }
    },
  });
}

/**
 * Generates a signed download URL for a file.
 * Use this hook for file download operations.
 *
 * @returns Mutation hook for getting download URLs
 */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async (params: { s3Key: string; fileName: string }) => {
      const result = await getFileDownloadUrl(params.s3Key);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate download URL');
      }

      return { ...result.data, fileName: params.fileName };
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success('Download started', {
        description: data.fileName,
      });
    },
    onError: (error: Error) => {
      toast.error('Download failed', {
        description: error.message || 'Unknown error',
      });
    },
  });
}

/**
 * Uploads a test file for development/debugging.
 * Use this hook in developer tools for testing uploads.
 *
 * @returns Mutation hook for uploading test files
 */
export function useUploadTestFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const content = `Test upload from Next.js app\nTimestamp: ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `test-${Date.now()}.txt`, { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', 'dev-test');

      const result = await uploadFile(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload test file');
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.lists() });
      toast.success('Test file uploaded', {
        description: `${data.fileName} (${formatFileSize(data.fileSize)})`,
      });
    },
    onError: (error: Error) => {
      toast.error('Test upload failed', {
        description: error.message || 'Unknown error',
      });
    },
  });
}
