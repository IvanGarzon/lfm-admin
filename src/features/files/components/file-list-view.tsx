import type { S3File } from '../types';
import { FileItem } from './file-item';

interface FileListViewProps {
  files: S3File[];
  onDownload: (s3Key: string, fileName: string) => void;
  onDelete: (s3Key: string, fileName: string) => void;
}

export function FileListView({ files, onDownload, onDelete }: FileListViewProps) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileItem key={file.key} file={file} onDownload={onDownload} onDelete={onDelete} />
      ))}
    </div>
  );
}
