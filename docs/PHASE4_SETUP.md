# Phase 4: Quote Attachments - Setup Guide

## Overview

Phase 4 adds S3-based file attachment capability to quotes, with full LocalStack support for local development.

---

## Completed Tasks ✅

1. **AWS SDK Installation**
   - Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`

2. **Database Schema**
   - Created `QuoteAttachment` Prisma model
   - Added `attachments` relation to `Quote` model
   - Migration applied: `20251116092014_add_quote_attachments`

3. **S3 Client Library** ([src/lib/s3.ts](../src/lib/s3.ts))
   - S3 client with LocalStack support
   - File upload/download/delete functions
   - Signed URL generation
   - File validation (type, size)
   - Utility functions (formatFileSize, isImageFile, etc.)

4. **LocalStack Configuration**
   - Docker Compose file: [docker-compose.localstack.yml](../docker-compose.localstack.yml)
   - Initialization script: [scripts/setup-localstack.sh](../scripts/setup-localstack.sh)

5. **TypeScript Types** ([src/features/finances/quotes/types.ts](../src/features/finances/quotes/types.ts))
   - `QuoteAttachment` type
   - `UploadAttachmentData` type
   - `DeleteAttachmentData` type
   - Added `attachmentCount` to `QuoteListItem`
   - Added `attachments` to `QuoteWithDetails`

6. **Validation Schemas** ([src/schemas/quotes.ts](../src/schemas/quotes.ts))
   - `QuoteAttachmentSchema`
   - `UploadAttachmentSchema` (with file size/type validation)
   - `DeleteAttachmentSchema`

---

## Environment Variables Setup

### For Local Development (LocalStack)

Create or update `.env.local`:

```bash
# AWS/LocalStack Configuration
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=lasflores-admin-uploads
AWS_S3_QUOTES_PREFIX=quotes/attachments
AWS_ENDPOINT_URL=http://localhost:4566
NODE_ENV=development
```

### For Production (AWS S3)

Update `.env.production` or `.env`:

```bash
# AWS S3 Configuration
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIA... # Your real AWS access key
AWS_SECRET_ACCESS_KEY=your-secret-key # Your real AWS secret
AWS_S3_BUCKET_NAME=lasflores-admin-uploads
AWS_S3_QUOTES_PREFIX=quotes/attachments
# DO NOT SET AWS_ENDPOINT_URL for production
```

---

## Local Development Workflow

### 1. Start LocalStack

```bash
# Using pnpm scripts (add to package.json):
pnpm localstack:start

# Or manually:
docker-compose -f docker-compose.localstack.yml up -d
```

### 2. Initialize S3 Bucket

```bash
# Using pnpm scripts:
pnpm localstack:setup

# Or manually:
./scripts/setup-localstack.sh
```

### 3. Verify LocalStack is Running

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls
```

### 4. Start Your App

```bash
pnpm dev
```

### 5. Stop LocalStack (when done)

```bash
# Using pnpm scripts:
pnpm localstack:stop

# Or manually:
docker-compose -f docker-compose.localstack.yml down
```

---

## Recommended package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "localstack:start": "docker-compose -f docker-compose.localstack.yml up -d",
    "localstack:stop": "docker-compose -f docker-compose.localstack.yml down",
    "localstack:setup": "./scripts/setup-localstack.sh",
    "localstack:logs": "docker logs -f lasflores-localstack",
    "localstack:restart": "pnpm localstack:stop && pnpm localstack:start && pnpm localstack:setup"
  }
}
```

---

## AWS S3 Production Setup

### 1. Create S3 Bucket

1. Log into AWS Console → S3
2. Click "Create bucket"
3. Settings:
   - **Name**: `lasflores-admin-uploads` (must be globally unique)
   - **Region**: `ap-southeast-2` (Australia)
   - **Block Public Access**: Keep all ON (we use signed URLs)
   - **Versioning**: Enable (recommended)
   - **Encryption**: SSE-S3 (default)
4. Create bucket

### 2. Create IAM User

1. AWS Console → IAM → Users → "Add users"
2. Username: `lasflores-admin-app`
3. Access type: "Programmatic access"
4. Permissions: Create inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "QuoteAttachmentsAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::lasflores-admin-uploads",
        "arn:aws:s3:::lasflores-admin-uploads/quotes/*"
      ]
    }
  ]
}
```

5. Save Access Key ID and Secret (only shown once!)

### 3. Configure CORS (if browser uploads)

Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## File Upload Limits

- **Allowed Types**:
  - Images: JPEG, PNG, WebP
  - Documents: PDF, DOC, DOCX, XLS, XLSX
- **Max File Size**: 5 MB per file
- **Max Attachments**: Unlimited (can be configured later)

---

## Remaining Tasks 🚧

### Backend

- [ ] Update quote repository with attachment methods
- [ ] Create attachment server actions

### Frontend

- [ ] Create QuoteAttachments UI component (file upload/preview)
- [ ] Create attachment React Query hooks
- [ ] Update QuoteForm to include attachments section
- [ ] Update QuotePreview to show attachments
- [ ] Update PDF template with attachments section

### Testing

- [ ] Test upload/download with LocalStack
- [ ] Test file validation
- [ ] Test attachment deletion
- [ ] Test with various file types

---

## Next Steps

To continue Phase 4 implementation:

1. **Repository Layer**: Add attachment CRUD methods to `quote-repository.ts`
2. **Server Actions**: Create upload/delete actions in `actions/quotes.ts`
3. **UI Components**: Build file upload interface
4. **React Query Hooks**: Wire up mutations and queries
5. **Integration**: Add to QuoteForm and QuotePreview

Would you like me to continue with the repository layer next?
