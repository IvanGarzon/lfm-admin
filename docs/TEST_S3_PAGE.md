# S3 Test Page Guide

## Quick Start

### 1. Ensure LocalStack is Running

```bash
# Start LocalStack
pnpm localstack:start

# Initialize S3 bucket
pnpm localstack:setup
```

### 2. Set Environment Variables

Make sure you have `.env.local` with:

```bash
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=lasflores-admin-uploads
AWS_S3_QUOTES_PREFIX=quotes/attachments
AWS_ENDPOINT_URL=http://localhost:4566
NODE_ENV=development
```

### 3. Start Your Next.js App

```bash
pnpm dev
```

### 4. Open Test Page

Navigate to: **http://localhost:3000/test-s3**

---

## Features

### 📁 S3 File Explorer

- **Two view modes**:
  - **List View** 📋: Shows all files in a flat list (default)
  - **Folder View** 🗂️: Groups files by Quote ID with collapsible folders
- **Browse all files** in the S3 bucket (quotes/attachments/)
- **File information**: Name, quote ID, size, and upload timestamp
- **Download**: Click download button to get a signed URL and open file
- **Delete**: Click delete button (with confirmation prompt)
- **Refresh**: Manually reload the file list
- **Auto-refresh**: Automatically updates after upload/delete operations
- **File count**: Shows total number of files in the bucket
- **Folder stats** (in folder view): File count and total size per quote
- **Expand/collapse**: Click folder headers to show/hide files

---

## Available Tests

### 🔌 Test Connectivity

- Checks if LocalStack S3 is running
- Verifies health endpoint via `/api/test-s3/health`
- **Expected**: Green success message showing S3 is running
- **Note**: Test page and API routes are publicly accessible (no auth required)

### 📤 Upload Test File

- Creates a text file with timestamp
- Uploads to LocalStack S3
- **Expected**: Success message with S3 key and URL

### 📥 Download File

- Generates a signed download URL (24hr expiry)
- Opens file in new tab
- **Expected**: File downloads in browser

### 🗑️ Delete File

- Removes file from S3
- **Expected**: Success message confirming deletion

### ▶️ Run All Tests

- Executes all tests in sequence
- Waits 1 second between each test
- **Expected**: All tests pass with green success messages

### 📎 Upload Custom File

- Upload your own file (image, PDF, etc.)
- Max size: 5MB
- Allowed types: images, PDF, DOC, DOCX, XLS, XLSX
- **Expected**: File uploaded successfully

---

## Test Flow

1. **Click "Test Connectivity"** → Should show LocalStack is available
2. **Click "Upload Test File"** → Should upload a text file
3. **Click "Download File"** → Should open the file in a new tab
4. **Click "Delete File"** → Should delete the file from S3

Or simply **click "Run All Tests"** to run everything automatically!

---

## Troubleshooting

### ❌ "LocalStack is not running"

**Solution:**

```bash
pnpm localstack:start
pnpm localstack:setup
```

### ❌ "Failed to connect to LocalStack"

**Check:**

1. Is Docker running? `docker ps`
2. Is LocalStack container running? `docker ps | grep localstack`
3. Is port 4566 open? `curl http://localhost:4566/_localstack/health`

**Fix:**

```bash
pnpm localstack:restart
```

### ❌ "Upload failed" or "File type not allowed"

**Check file type and size:**

- Max size: 5MB
- Allowed types: JPEG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX

### ❌ "Failed to generate download URL"

This usually means the file doesn't exist in S3. Upload a file first.

### ❌ API routes return 500 errors

**Check:**

1. `.env.local` is set up correctly
2. LocalStack is running
3. S3 bucket exists

**View errors in terminal:**

```bash
# Your Next.js dev server will show the error
# Check the terminal where you ran `pnpm dev`
```

### ❌ "Connectivity test redirects to /signin"

This was fixed by making `/api/test-s3/*` routes and `/test-s3` page public in the middleware.
If you still see this, check that `src/middleware.ts` includes:

```typescript
const isTestS3ApiRoute = nextUrl.pathname.startsWith('/api/test-s3');
if (isApiAuthRoute || isTestS3ApiRoute) {
  return;
}
```

And `src/routes.ts` includes:

```typescript
export const publicRoutes: string[] = ['/verify', '/test-s3'];
```

---

## What's Being Tested

### Backend (API Routes)

- ✅ File upload to S3 ([/api/test-s3/upload](../src/app/api/test-s3/upload/route.ts))
- ✅ Signed URL generation ([/api/test-s3/download](../src/app/api/test-s3/download/route.ts))
- ✅ File deletion from S3 ([/api/test-s3/delete](../src/app/api/test-s3/delete/route.ts))

### S3 Library

- ✅ `uploadFileToS3()` - Upload buffer to S3
- ✅ `getSignedDownloadUrl()` - Generate temporary download link
- ✅ `deleteFileFromS3()` - Remove file from bucket
- ✅ File validation (size, type)
- ✅ S3 key generation (unique paths)

### LocalStack Integration

- ✅ Connection to LocalStack endpoint
- ✅ Bucket operations
- ✅ Environment-aware client (auto-detects LocalStack)

---

## Expected Results

### Successful Test Output

```
✓ LocalStack S3 is available!
  Endpoint: http://localhost:4566
  Version: 4.10.1.dev30
  Edition: community
  S3 Status: running

✓ Text file uploaded successfully!
  S3 Key: quotes/attachments/test-quote-123/1700123456789-test-upload.txt
  S3 URL: http://localhost:4566/lasflores-admin-uploads/quotes/...
  File Size: 87 Bytes

✓ Download URL generated!
  URL: http://localhost:4566/lasflores-admin-uploads/...
  Expires in: 24 hours

✓ File deleted successfully!
  Deleted: test-upload.txt
```

---

## Next Steps

Once all tests pass:

1. ✅ **Backend foundation is working!**
2. 🚀 Ready to continue Phase 4 implementation:
   - Repository layer (database operations)
   - Server actions (quote attachment CRUD)
   - UI components (drag & drop file upload)

---

## Verify with AWS CLI

You can also verify S3 operations manually:

```bash
# List files in bucket
aws --endpoint-url=http://localhost:4566 \
    s3 ls s3://lasflores-admin-uploads/quotes/attachments/ \
    --recursive

# Should show files you uploaded via the test page
```

---

## Clean Up

To remove all test files from LocalStack:

```bash
# Delete all files in quotes/attachments prefix
aws --endpoint-url=http://localhost:4566 \
    s3 rm s3://lasflores-admin-uploads/quotes/attachments/ \
    --recursive

# Or reset LocalStack completely
pnpm localstack:stop
rm -rf localstack-data
pnpm localstack:restart
```

---

## Screenshots

After testing, you should see:

- ✅ Green success messages for each test
- 📋 Results panel showing all operations
- 📂 Current uploaded file details (when a file is uploaded)
- 🎯 All buttons enabled/disabled appropriately

---

Happy testing! 🎉
