'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Folder,
  File as FileIcon,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  List,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { formatFileSize } from '@/lib/file-constants';

type TestResult = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
};

type S3File = {
  key: string;
  size: number;
  lastModified: string;
  fileName: string;
  folder: string;
  resourceType: string;
  resourceId: string;
  subPath: string;
  fileType: string;
};

export default function TestS3Page() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    s3Key: string;
    s3Url: string;
    fileName: string;
  } | null>(null);
  const [s3Files, setS3Files] = useState<S3File[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
    setUploadedFile(null);
  };

  // Load S3 files
  const loadS3Files = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/test-s3/list');
      const data = await response.json();

      if (data.success) {
        setS3Files(data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Download file from explorer
  const downloadFileFromExplorer = async (s3Key: string) => {
    try {
      const response = await fetch('/api/test-s3/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key }),
      });

      const data = await response.json();

      if (data.success) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Delete file from explorer
  const deleteFileFromExplorer = async (s3Key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch('/api/test-s3/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key }),
      });

      const data = await response.json();

      if (data.success) {
        await loadS3Files(); // Reload the file list
        // Clear uploadedFile if it was the deleted file
        if (uploadedFile?.s3Key === s3Key) {
          setUploadedFile(null);
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Group files by full folder path hierarchy
  const filesByResourceType = s3Files.reduce(
    (acc, file) => {
      if (!file.resourceType) return acc;

      if (!acc[file.resourceType]) {
        acc[file.resourceType] = {};
      }

      // Group by resourceId
      if (!acc[file.resourceType][file.resourceId]) {
        acc[file.resourceType][file.resourceId] = {};
      }

      // Group by subPath (e.g., "items", "attachments", "pdfs")
      const subPathKey = file.subPath || '_root';
      if (!acc[file.resourceType][file.resourceId][subPathKey]) {
        acc[file.resourceType][file.resourceId][subPathKey] = [];
      }

      acc[file.resourceType][file.resourceId][subPathKey].push(file);
      return acc;
    },
    {} as Record<string, Record<string, Record<string, S3File[]>>>,
  );

  // Legacy: Group files by resource type and ID (flat structure for backward compatibility)
  const filesByFolder = s3Files.reduce(
    (acc, file) => {
      const folderId = `${file.resourceType}/${file.resourceId}`;
      if (!acc[folderId]) {
        acc[folderId] = [];
      }
      acc[folderId].push(file);
      return acc;
    },
    {} as Record<string, S3File[]>,
  );

  // Load files on mount
  useEffect(() => {
    loadS3Files();
  }, []);

  // Test 1: Check LocalStack connectivity
  const testConnectivity = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/test-s3/health');
      const data = await response.json();

      if (data.success && data.healthy) {
        addResult({
          type: 'success',
          message: 'LocalStack S3 is available!',
          details: `Endpoint: ${data.endpoint}\nVersion: ${data.version}\nEdition: ${data.edition}\nS3 Status: ${data.services?.s3}`,
        });
      } else {
        addResult({
          type: 'error',
          message: 'LocalStack S3 is not available',
          details: data.error || JSON.stringify(data, null, 2),
        });
      }
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Failed to connect to LocalStack',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Upload a text file
  const testUploadText = async () => {
    setIsLoading(true);

    try {
      const content = `Test upload from Next.js app\nTimestamp: ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test-upload.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', 'test-quote-123');

      const response = await fetch('/api/test-s3/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadedFile({
          s3Key: data.s3Key,
          s3Url: data.s3Url,
          fileName: data.fileName,
        });
        addResult({
          type: 'success',
          message: 'Text file uploaded successfully!',
          details: `S3 Key: ${data.s3Key}\nS3 URL: ${data.s3Url}\nFile Size: ${formatFileSize(data.fileSize)}`,
        });
        await loadS3Files(); // Reload file list
      } else {
        addResult({
          type: 'error',
          message: 'Upload failed',
          details: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Upload request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Upload a custom file
  const testUploadCustom = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      addResult({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setIsLoading(true);
    const file = fileInputRef.current.files[0];

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', 'test-quote-123');

      const response = await fetch('/api/test-s3/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadedFile({
          s3Key: data.s3Key,
          s3Url: data.s3Url,
          fileName: data.fileName,
        });
        addResult({
          type: 'success',
          message: 'File uploaded successfully!',
          details: `File: ${data.fileName}\nS3 Key: ${data.s3Key}\nSize: ${formatFileSize(data.fileSize)}`,
        });
        await loadS3Files(); // Reload file list
      } else {
        addResult({
          type: 'error',
          message: 'Upload failed',
          details: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Upload request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Test 4: Download the uploaded file
  const testDownload = async () => {
    if (!uploadedFile) {
      addResult({ type: 'error', message: 'No file uploaded yet. Upload a file first.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/test-s3/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key: uploadedFile.s3Key }),
      });

      const data = await response.json();

      if (data.success) {
        addResult({
          type: 'success',
          message: 'Download URL generated!',
          details: `URL: ${data.url}\nExpires in: 24 hours`,
        });

        // Open in new tab
        window.open(data.url, '_blank');
      } else {
        addResult({
          type: 'error',
          message: 'Failed to generate download URL',
          details: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Download request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test 5: Delete the uploaded file
  const testDelete = async () => {
    if (!uploadedFile) {
      addResult({ type: 'error', message: 'No file uploaded yet. Upload a file first.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/test-s3/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key: uploadedFile.s3Key }),
      });

      const data = await response.json();

      if (data.success) {
        addResult({
          type: 'success',
          message: 'File deleted successfully!',
          details: `Deleted: ${uploadedFile.fileName}`,
        });
        setUploadedFile(null);
        await loadS3Files(); // Reload file list
      } else {
        addResult({
          type: 'error',
          message: 'Delete failed',
          details: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Delete request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test 6: Run all tests in sequence
  const runAllTests = async () => {
    clearResults();
    setIsLoading(true);

    let testFile: { s3Key: string; s3Url: string; fileName: string } | null = null;

    try {
      // Test 1: Connectivity
      const healthResponse = await fetch('/api/test-s3/health');
      const healthData = await healthResponse.json();
      if (healthData.success && healthData.healthy) {
        addResult({
          type: 'success',
          message: 'LocalStack S3 is available!',
          details: `Endpoint: ${healthData.endpoint}\nVersion: ${healthData.version}\nEdition: ${healthData.edition}\nS3 Status: ${healthData.services?.s3}`,
        });
      } else {
        addResult({
          type: 'error',
          message: 'LocalStack S3 is not available',
          details: healthData.error || JSON.stringify(healthData, null, 2),
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test 2: Upload
      const content = `Test upload from Next.js app\nTimestamp: ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test-upload.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', 'test-quote-123');

      const uploadResponse = await fetch('/api/test-s3/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        testFile = {
          s3Key: uploadData.s3Key,
          s3Url: uploadData.s3Url,
          fileName: uploadData.fileName,
        };
        setUploadedFile(testFile);
        addResult({
          type: 'success',
          message: 'Text file uploaded successfully!',
          details: `S3 Key: ${uploadData.s3Key}\nS3 URL: ${uploadData.s3Url}\nFile Size: ${formatFileSize(uploadData.fileSize)}`,
        });
      } else {
        addResult({
          type: 'error',
          message: 'Upload failed',
          details: uploadData.error || 'Unknown error',
        });
        setIsLoading(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test 3: Download (only if upload succeeded)
      if (testFile) {
        const downloadResponse = await fetch('/api/test-s3/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: testFile.s3Key }),
        });
        const downloadData = await downloadResponse.json();

        if (downloadData.success) {
          addResult({
            type: 'success',
            message: 'Download URL generated!',
            details: `URL: ${downloadData.url}\nExpires in: 24 hours`,
          });
          window.open(downloadData.url, '_blank');
        } else {
          addResult({
            type: 'error',
            message: 'Failed to generate download URL',
            details: downloadData.error || 'Unknown error',
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Test 4: Delete (only if upload succeeded)
      if (testFile) {
        const deleteResponse = await fetch('/api/test-s3/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: testFile.s3Key }),
        });
        const deleteData = await deleteResponse.json();

        if (deleteData.success) {
          addResult({
            type: 'success',
            message: 'File deleted successfully!',
            details: `Deleted: ${testFile.fileName}`,
          });
          setUploadedFile(null);
        } else {
          addResult({
            type: 'error',
            message: 'Delete failed',
            details: deleteData.error || 'Unknown error',
          });
        }
      }

      // Reload file list after all tests complete
      await loadS3Files();
    } catch (error) {
      addResult({
        type: 'error',
        message: 'Test sequence failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Box className="mb-8">
          <h1 className="text-3xl font-bold mb-2">S3 LocalStack Test Page</h1>
          <p className="text-muted-foreground">
            Test S3 upload, download, and delete operations with LocalStack
          </p>
          <Box className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Prerequisites:</strong> Make sure LocalStack is running (
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                pnpm localstack:start
              </code>{' '}
              and{' '}
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                pnpm localstack:setup
              </code>
              )
            </p>
          </Box>
        </Box>

        {/* Test Controls */}
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Test 1: Connectivity */}
          <Button
            onClick={testConnectivity}
            disabled={isLoading}
            variant="outline"
            className="h-24"
          >
            <Box className="flex flex-col items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              <span>Test Connectivity</span>
            </Box>
          </Button>

          {/* Test 2: Upload Text */}
          <Button onClick={testUploadText} disabled={isLoading} variant="outline" className="h-24">
            <Box className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Upload Test File</span>
            </Box>
          </Button>

          {/* Test 3: Download */}
          <Button
            onClick={testDownload}
            disabled={isLoading || !uploadedFile}
            variant="outline"
            className="h-24"
          >
            <Box className="flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Download File</span>
            </Box>
          </Button>

          {/* Test 4: Delete */}
          <Button
            onClick={testDelete}
            disabled={isLoading || !uploadedFile}
            variant="outline"
            className="h-24"
          >
            <Box className="flex flex-col items-center gap-2">
              <Trash2 className="h-6 w-6" />
              <span>Delete File</span>
            </Box>
          </Button>

          {/* Test 5: Run All */}
          <Button onClick={runAllTests} disabled={isLoading} className="h-24 md:col-span-2">
            <Box className="flex flex-col items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <CheckCircle className="h-6 w-6" />
              )}
              <span>{isLoading ? 'Running Tests...' : 'Run All Tests'}</span>
            </Box>
          </Button>
        </Box>

        {/* Custom File Upload */}
        <Box className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Upload Custom File</h2>
          <Box className="flex gap-4 items-end">
            <Box className="flex-1">
              <label className="block text-sm font-medium mb-2">Select File (Max 5MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 focus:outline-none"
              />
            </Box>
            <Button onClick={testUploadCustom} disabled={isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </Box>
        </Box>

        {/* Current File Status */}
        {uploadedFile && (
          <Box className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Current Uploaded File
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>File:</strong> {uploadedFile.fileName}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>S3 Key:</strong> {uploadedFile.s3Key}
            </p>
          </Box>
        )}

        {/* Results */}
        <Box className="bg-white dark:bg-gray-900 rounded-lg border p-6">
          <Box className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <Button variant="outline" size="sm" onClick={clearResults} disabled={isLoading}>
              Clear Results
            </Button>
          </Box>

          <Box className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tests run yet. Click a test button above to get started.
              </p>
            ) : (
              results.map((result, index) => (
                <Box
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : result.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <Box className="flex items-start gap-2">
                    {result.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : result.type === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-spin" />
                    )}
                    <Box className="flex-1">
                      <p
                        className={`font-medium ${
                          result.type === 'success'
                            ? 'text-green-900 dark:text-green-100'
                            : result.type === 'error'
                              ? 'text-red-900 dark:text-red-100'
                              : 'text-blue-900 dark:text-blue-100'
                        }`}
                      >
                        {result.message}
                      </p>
                      {result.details && (
                        <pre
                          className={`mt-2 text-xs whitespace-pre-wrap ${
                            result.type === 'success'
                              ? 'text-green-800 dark:text-green-200'
                              : result.type === 'error'
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {result.details}
                        </pre>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* File Explorer */}
        <Box className="bg-white dark:bg-gray-900 rounded-lg border p-6 mt-8">
          <Box className="flex justify-between items-center mb-4">
            <Box className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">S3 File Explorer</h2>
              <span className="text-sm text-muted-foreground">
                ({s3Files.length} file{s3Files.length !== 1 ? 's' : ''})
              </span>
            </Box>
            <Box className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <Box className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'folders' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('folders')}
                  className="h-8 px-2"
                >
                  <FolderTree className="h-4 w-4" />
                </Button>
              </Box>
              <Button variant="outline" size="sm" onClick={loadS3Files} disabled={isLoadingFiles}>
                {isLoadingFiles ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </Box>
          </Box>

          <Box className="space-y-2 max-h-96 overflow-y-auto">
            {isLoadingFiles ? (
              <Box className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading files...
              </Box>
            ) : s3Files.length === 0 ? (
              <Box className="text-center py-8 text-muted-foreground">
                No files found in S3. Upload a file to get started.
              </Box>
            ) : viewMode === 'list' ? (
              // List View
              s3Files.map((file, index) => (
                <Box
                  key={index}
                  className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Box className="flex items-center justify-between gap-4">
                    <Box className="flex items-center gap-3 flex-1 min-w-0">
                      <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <Box className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.resourceType}/{file.resourceId} • {file.fileType} •{' '}
                          {formatFileSize(file.size)} •{' '}
                          {new Date(file.lastModified).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{file.key}</p>
                      </Box>
                    </Box>
                    <Box className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFileFromExplorer(file.key)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFileFromExplorer(file.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              // Hierarchical Folder View
              Object.entries(filesByResourceType).map(([resourceType, resourceFolders]) => {
                const resourceTypeId = resourceType;
                const isResourceTypeExpanded = expandedFolders.has(resourceTypeId);

                // Calculate totals across all subfolders
                const allFiles = Object.values(resourceFolders).flatMap((subPaths) =>
                  Object.values(subPaths).flat(),
                );
                const totalFiles = allFiles.length;
                const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

                return (
                  <Box key={resourceType} className="border rounded-lg overflow-hidden mb-3">
                    {/* Resource Type Header (Main Folder) */}
                    <Box
                      className="p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => toggleFolder(resourceTypeId)}
                    >
                      <Box className="flex items-center gap-2">
                        {isResourceTypeExpanded ? (
                          <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        )}
                        {isResourceTypeExpanded ? (
                          <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                        ) : (
                          <Folder className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                        )}
                        <span className="font-bold capitalize text-lg">{resourceType}/</span>
                        <span className="text-sm text-muted-foreground">
                          ({Object.keys(resourceFolders).length} folder
                          {Object.keys(resourceFolders).length !== 1 ? 's' : ''}, {totalFiles} file
                          {totalFiles !== 1 ? 's' : ''})
                        </span>
                      </Box>
                      <span className="text-sm text-muted-foreground font-medium">
                        {formatFileSize(totalSize)} total
                      </span>
                    </Box>

                    {/* Resource ID Subfolders */}
                    {isResourceTypeExpanded && (
                      <Box className="bg-gray-50 dark:bg-gray-900/50">
                        {Object.entries(resourceFolders).map(([resourceId, subPaths]) => {
                          const resourceIdFolderId = `${resourceType}/${resourceId}`;
                          const isResourceIdExpanded = expandedFolders.has(resourceIdFolderId);

                          const resourceIdFiles = Object.values(subPaths).flat();
                          const resourceIdFileCount = resourceIdFiles.length;
                          const resourceIdSize = resourceIdFiles.reduce(
                            (sum, f) => sum + f.size,
                            0,
                          );

                          return (
                            <Box key={resourceIdFolderId} className="border-t">
                              {/* Resource ID Header */}
                              <Box
                                className="p-3 pl-8 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(resourceIdFolderId);
                                }}
                              >
                                <Box className="flex items-center gap-2">
                                  {isResourceIdExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {isResourceIdExpanded ? (
                                    <FolderOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                  ) : (
                                    <Folder className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                  )}
                                  <span className="font-medium">{resourceId}/</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({resourceIdFileCount} file
                                    {resourceIdFileCount !== 1 ? 's' : ''})
                                  </span>
                                </Box>
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(resourceIdSize)}
                                </span>
                              </Box>

                              {/* SubPath Folders (items, attachments, pdfs, etc.) */}
                              {isResourceIdExpanded && (
                                <Box className="bg-gray-100 dark:bg-gray-800/50">
                                  {Object.entries(subPaths).map(([subPath, files]) => {
                                    const subPathFolderId = `${resourceType}/${resourceId}/${subPath}`;
                                    const isSubPathExpanded = expandedFolders.has(subPathFolderId);
                                    const subPathSize = files.reduce((sum, f) => sum + f.size, 0);

                                    return (
                                      <Box key={subPathFolderId} className="border-t">
                                        {/* SubPath Header */}
                                        <Box
                                          className="p-3 pl-16 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFolder(subPathFolderId);
                                          }}
                                        >
                                          <Box className="flex items-center gap-2">
                                            {isSubPathExpanded ? (
                                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            {isSubPathExpanded ? (
                                              <FolderOpen className="h-4 w-4 text-green-600 dark:text-green-500" />
                                            ) : (
                                              <Folder className="h-4 w-4 text-green-600 dark:text-green-500" />
                                            )}
                                            <span className="text-sm font-medium">
                                              {subPath === '_root' ? '(root)' : subPath}/
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              ({files.length} file{files.length !== 1 ? 's' : ''})
                                            </span>
                                          </Box>
                                          <span className="text-xs text-muted-foreground">
                                            {formatFileSize(subPathSize)}
                                          </span>
                                        </Box>

                                        {/* Files in SubPath */}
                                        {isSubPathExpanded && (
                                          <Box className="bg-white dark:bg-gray-900">
                                            {files.map((file, index) => (
                                              <Box
                                                key={index}
                                                className="p-3 border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                              >
                                                <Box className="flex items-center justify-between gap-4">
                                                  <Box className="flex items-center gap-3 flex-1 min-w-0 pl-20">
                                                    <FileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <Box className="min-w-0 flex-1">
                                                      <p className="font-medium truncate text-sm">
                                                        {file.fileName}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {file.fileType} •{' '}
                                                        {formatFileSize(file.size)} •{' '}
                                                        {new Date(
                                                          file.lastModified,
                                                        ).toLocaleString()}
                                                      </p>
                                                    </Box>
                                                  </Box>
                                                  <Box className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        downloadFileFromExplorer(file.key)
                                                      }
                                                    >
                                                      <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        deleteFileFromExplorer(file.key)
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </Box>
                                                </Box>
                                              </Box>
                                            ))}
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </div>
    </div>
  );
}
