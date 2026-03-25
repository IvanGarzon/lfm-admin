import { Files, HardDrive, CloudUpload, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/file-constants';

interface FileStatsCardsProps {
  totalFiles: number;
  totalSize: number;
  fileTypes: number;
  onUploadClick: () => void;
}

export function FileStatsCards({
  totalFiles,
  totalSize,
  fileTypes,
  onUploadClick,
}: FileStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFiles}</div>
          <p className="text-xs text-muted-foreground">
            {fileTypes} file type{fileTypes !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
          <p className="text-xs text-muted-foreground">Across all resources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <CloudUpload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" onClick={onUploadClick} className="flex-1">
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
