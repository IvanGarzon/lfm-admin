'use client';

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useFiles,
  useUploadFile,
  useDownloadFile,
  useDeleteFile,
} from '@/features/files/hooks/use-files';
import { FileStatsCards } from '@/features/files/components/file-stats-cards';
import { FileUploadZone } from '@/features/files/components/file-upload-zone';
import { FileBrowser } from '@/features/files/components/file-browser';
import { DevToolsSection } from '@/features/files/components/dev-tools-section';
import { Box } from '@/components/ui/box';

export function FilesList() {
  const { data, isLoading, refetch } = useFiles();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: downloadFile } = useDownloadFile();
  const { mutate: deleteFile } = useDeleteFile();

  const files = data?.files ?? [];

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileTypes = new Set(files.map((f) => f.fileType)).size;
    return {
      totalFiles: files.length,
      totalSize,
      fileTypes,
    };
  }, [files]);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    uploadFile(acceptedFiles[0]);
  };

  const handleUploadClick = () => {
    document.getElementById('dropzone')?.click();
  };

  const handleDownload = (s3Key: string, fileName: string) => {
    downloadFile({ s3Key, fileName });
  };

  const handleDelete = (s3Key: string, fileName: string) => {
    deleteFile({ s3Key, fileName });
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box>
          <h1 className="text-3xl font-bold tracking-tight">File Storage</h1>
          <p className="text-muted-foreground mt-1">Manage and organise files stored in S3</p>
        </Box>
        <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <FileStatsCards
        totalFiles={stats.totalFiles}
        totalSize={stats.totalSize}
        fileTypes={stats.fileTypes}
        onUploadClick={handleUploadClick}
      />

      {/* Upload Zone */}
      <FileUploadZone onDrop={handleDrop} isUploading={isUploading} />

      {/* File Browser */}
      <FileBrowser
        files={files}
        isLoading={isLoading}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* Developer Tools (Local Development Only) */}
      <DevToolsSection />
    </Box>
  );
}
