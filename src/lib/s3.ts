import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalStack = isDevelopment && !!process.env.AWS_ENDPOINT_URL;

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL; // e.g., http://localhost:4566

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'lasflores-admin-uploads';

// Create S3 Client
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  // LocalStack configuration
  ...(isLocalStack &&
    AWS_ENDPOINT_URL && {
      endpoint: AWS_ENDPOINT_URL,
      forcePathStyle: true, // Required for LocalStack
    }),
});

// Allowed MIME types for quote ITEM attachments (only images)
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

// Allowed MIME types for quote attachments
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
] as const;

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Generate a unique S3 key with flexible path structure
 * Structure: [resourceType]/[resourceId]/[subPath]/[TIMESTAMP]-[FILENAME]
 *
 * Examples:
 * - quotes/quote-123/attachments/1234567890-file.pdf
 * - invoices/inv-456/attachments/1234567890-receipt.pdf
 * - quotes/quote-123/items/item-789/1234567890-photo.jpg
 */
export function generateS3Key(
  resourceType: string,
  resourceId: string,
  fileName: string,
  subPath?: string,
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = subPath ? `${subPath}/` : '';
  return `${resourceType}/${resourceId}/${path}${timestamp}-${sanitizedFileName}`;
}

/**
 * Get the S3 URL for a given key
 */
export function getS3Url(s3Key: string): string {
  if (isLocalStack && AWS_ENDPOINT_URL) {
    // LocalStack URL format
    return `${AWS_ENDPOINT_URL}/${BUCKET_NAME}/${s3Key}`;
  }
  // AWS S3 URL format
  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
}

/**
 * Generic S3 file upload function
 */
export async function uploadFileToS3(params: {
  file: Buffer;
  fileName: string;
  mimeType: string;
  resourceType: string;
  resourceId: string;
  subPath?: string;
  allowedMimeTypes?: readonly string[];
  metadata?: Record<string, string>;
}): Promise<{ s3Key: string; s3Url: string }> {
  const {
    file,
    fileName,
    mimeType,
    resourceType,
    resourceId,
    subPath,
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    metadata = {},
  } = params;

  // Validate file size
  if (file.byteLength > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate MIME type
  if (!allowedMimeTypes.includes(mimeType as any)) {
    throw new Error(`File type ${mimeType} is not allowed`);
  }

  const s3Key = generateS3Key(resourceType, resourceId, fileName, subPath);

  const uploadParams: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: file,
    ContentType: mimeType,
    Metadata: {
      resourceType,
      resourceId,
      originalFileName: fileName,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    },
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const s3Url = getS3Url(s3Key);

    return { s3Key, s3Url };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Generate a signed URL for downloading a file (expires in 24 hours)
 */
export async function getSignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 24 * 60 * 60, // 24 hours in seconds
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(s3Key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(s3Key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
} | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    const response = await s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

/**
 * Utility: Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Utility: Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Utility: Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
