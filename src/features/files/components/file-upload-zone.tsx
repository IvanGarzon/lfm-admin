import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileUploadZoneProps {
  onDrop: (files: File[]) => void;
  isUploading?: boolean;
}

export function FileUploadZone({ onDrop, isUploading }: FileUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: isUploading,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>Drag and drop files or click to browse (Max 5MB per file)</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          id="dropzone"
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className={`rounded-full p-3 ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
              <Upload
                className={`h-6 w-6 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>
            {isDragActive ? (
              <p className="text-sm font-medium">Drop the file here...</p>
            ) : isUploading ? (
              <p className="text-sm font-medium">Uploading...</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drag & drop a file here, or click to select</p>
                <p className="text-xs text-muted-foreground">
                  Supported: Images, PDF, Word, Excel (Max 5MB)
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
