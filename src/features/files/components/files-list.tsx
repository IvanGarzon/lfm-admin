'use client';

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFiles, useUploadFile, useDownloadFile, useDeleteFile } from '../hooks/use-files';
import { FileStatsCards } from './file-stats-cards';
import { FileUploadZone } from './file-upload-zone';
import { FileBrowser } from './file-browser';
import { DevToolsSection } from './dev-tools-section';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Storage</h1>
          <p className="text-muted-foreground mt-1">Manage and organise files stored in S3</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

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
    </div>
  );
}
