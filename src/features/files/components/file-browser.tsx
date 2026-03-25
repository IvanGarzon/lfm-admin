import { useState, useMemo } from 'react';
import { Search, X, LayoutList, FolderTree, Loader2, File as FileIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { S3File, ViewMode } from '../types';
import { FileListView } from './file-list-view';
import { FileFolderView } from './file-folder-view';

interface FileBrowserProps {
  files: S3File[];
  isLoading: boolean;
  onDownload: (s3Key: string, fileName: string) => void;
  onDelete: (s3Key: string, fileName: string) => void;
}

export function FileBrowser({ files, isLoading, onDownload, onDelete }: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (file) =>
        file.fileName.toLowerCase().includes(query) ||
        file.resourceType.toLowerCase().includes(query) ||
        file.fileType.toLowerCase().includes(query),
    );
  }, [files, searchQuery]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
              {searchQuery && ' (filtered)'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-2"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'folders' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('folders')}
                className="h-8 px-2"
              >
                <FolderTree className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2" />
                  <p>No files match your search</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <FileIcon className="h-8 w-8 mb-2" />
                  <p>No files yet</p>
                  <p className="text-sm">Upload a file to get started</p>
                </>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <FileListView files={filteredFiles} onDownload={onDownload} onDelete={onDelete} />
          ) : (
            <FileFolderView
              files={filteredFiles}
              onDownload={onDownload}
              onDelete={onDelete}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
