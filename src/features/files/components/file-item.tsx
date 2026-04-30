import { File as FileIcon, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/file-constants';
import type { S3File } from '../types';

interface FileItemProps {
  file: S3File;
  onDownload: (s3Key: string, fileName: string) => void;
  onDelete: (s3Key: string, fileName: string) => void;
  compact?: boolean;
}

export function FileItem({ file, onDownload, onDelete, compact = false }: FileItemProps) {
  return (
    <div
      className={`flex items-center justify-between ${compact ? 'p-3' : 'p-4'} rounded-lg border bg-card hover:bg-accent transition-colors`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileIcon
          aria-hidden="true"
          className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-primary shrink-0`}
        />
        <div className="min-w-0 flex-1">
          <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {file.resourceType}/{file.resourceId}
            {file.subPath && ` • ${file.subPath}`} • {file.fileType} • {formatFileSize(file.size)} •{' '}
            {new Date(file.lastModified).toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(file.key, file.fileName)}
          aria-label={`Download ${file.fileName}`}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(file.key, file.fileName)}
          aria-label={`Delete ${file.fileName}`}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
