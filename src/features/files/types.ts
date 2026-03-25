export type ViewMode = 'list' | 'folders';

export type S3File = {
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

export type HealthStatus = {
  healthy: boolean;
  endpoint: string;
  version?: string;
  edition?: string;
  services?: Record<string, string>;
};
