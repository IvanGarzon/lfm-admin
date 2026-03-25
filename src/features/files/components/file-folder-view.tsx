import { useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Download,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/file-constants';
import type { S3File } from '../types';

interface FileFolderViewProps {
  files: S3File[];
  onDownload: (s3Key: string, fileName: string) => void;
  onDelete: (s3Key: string, fileName: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
}

export function FileFolderView({
  files,
  onDownload,
  onDelete,
  expandedFolders,
  onToggleFolder,
}: FileFolderViewProps) {
  const filesByResourceType = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        if (!file.resourceType) return acc;

        if (!acc[file.resourceType]) {
          acc[file.resourceType] = {};
        }

        if (!acc[file.resourceType][file.resourceId]) {
          acc[file.resourceType][file.resourceId] = {};
        }

        const subPathKey = file.subPath || '_root';
        if (!acc[file.resourceType][file.resourceId][subPathKey]) {
          acc[file.resourceType][file.resourceId][subPathKey] = [];
        }

        acc[file.resourceType][file.resourceId][subPathKey].push(file);
        return acc;
      },
      {} as Record<string, Record<string, Record<string, S3File[]>>>,
    );
  }, [files]);

  return (
    <div className="space-y-2">
      {Object.entries(filesByResourceType).map(([resourceType, resourceFolders]) => {
        const resourceTypeId = resourceType;
        const isResourceTypeExpanded = expandedFolders.has(resourceTypeId);

        const allFiles = Object.values(resourceFolders).flatMap((subPaths) =>
          Object.values(subPaths).flat(),
        );
        const totalFiles = allFiles.length;
        const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

        return (
          <div key={resourceType} className="border rounded-lg overflow-hidden">
            {/* Resource Type Header */}
            <div
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => onToggleFolder(resourceTypeId)}
            >
              <div className="flex items-center gap-2">
                {isResourceTypeExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {isResourceTypeExpanded ? (
                  <FolderOpen className="h-5 w-5 text-primary" />
                ) : (
                  <Folder className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold capitalize">{resourceType}</span>
                <span className="text-sm text-muted-foreground">
                  ({Object.keys(resourceFolders).length} folder
                  {Object.keys(resourceFolders).length !== 1 ? 's' : ''}, {totalFiles} file
                  {totalFiles !== 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{formatFileSize(totalSize)}</span>
            </div>

            {/* Resource ID Subfolders */}
            {isResourceTypeExpanded && (
              <div className="bg-background">
                {Object.entries(resourceFolders).map(([resourceId, subPaths]) => {
                  const resourceIdFolderId = `${resourceType}/${resourceId}`;
                  const isResourceIdExpanded = expandedFolders.has(resourceIdFolderId);

                  const resourceIdFiles = Object.values(subPaths).flat();
                  const resourceIdFileCount = resourceIdFiles.length;
                  const resourceIdSize = resourceIdFiles.reduce((sum, f) => sum + f.size, 0);

                  return (
                    <div key={resourceIdFolderId} className="border-t">
                      {/* Resource ID Header */}
                      <div
                        className="flex items-center justify-between p-3 pl-8 hover:bg-accent cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFolder(resourceIdFolderId);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isResourceIdExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {isResourceIdExpanded ? (
                            <FolderOpen className="h-4 w-4 text-primary" />
                          ) : (
                            <Folder className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium">{resourceId}</span>
                          <span className="text-sm text-muted-foreground">
                            ({resourceIdFileCount} file{resourceIdFileCount !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(resourceIdSize)}
                        </span>
                      </div>

                      {/* SubPath Folders */}
                      {isResourceIdExpanded && (
                        <div>
                          {Object.entries(subPaths).map(([subPath, files]) => {
                            const subPathFolderId = `${resourceType}/${resourceId}/${subPath}`;
                            const isSubPathExpanded = expandedFolders.has(subPathFolderId);
                            const subPathSize = files.reduce((sum, f) => sum + f.size, 0);

                            return (
                              <div key={subPathFolderId} className="border-t">
                                {/* SubPath Header */}
                                <div
                                  className="flex items-center justify-between p-3 pl-16 hover:bg-accent cursor-pointer transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFolder(subPathFolderId);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSubPathExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    {isSubPathExpanded ? (
                                      <FolderOpen className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Folder className="h-4 w-4 text-primary" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {subPath === '_root' ? '(root)' : subPath}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({files.length} file{files.length !== 1 ? 's' : ''})
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(subPathSize)}
                                  </span>
                                </div>

                                {/* Files in SubPath */}
                                {isSubPathExpanded && (
                                  <div>
                                    {files.map((file) => (
                                      <div
                                        key={file.key}
                                        className="flex items-center justify-between p-3 pl-24 border-t hover:bg-accent transition-colors"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <FileIcon className="h-4 w-4 text-primary shrink-0" />
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate text-sm">
                                              {file.fileName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {file.fileType} • {formatFileSize(file.size)} •{' '}
                                              {new Date(file.lastModified).toLocaleDateString(
                                                'en-AU',
                                                {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                                },
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDownload(file.key, file.fileName)}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(file.key, file.fileName)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
