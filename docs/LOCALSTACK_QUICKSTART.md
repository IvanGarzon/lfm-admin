# LocalStack Quick Start Guide

## Prerequisites

You need Docker installed and running on your machine.

### Check if Docker is Running

```bash
docker ps
```

If you see an error like "Cannot connect to the Docker daemon", you need to start Docker:

- **macOS**: Open Docker Desktop app
- **Linux**: `sudo systemctl start docker`
- **Windows**: Start Docker Desktop

---

## Setup Steps

### 1. Copy Environment Variables

```bash
# Copy the LocalStack example environment file
cp .env.local.example .env.local
```

Your `.env.local` should contain:

```bash
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=lasflores-admin-uploads
AWS_ENDPOINT_URL=http://localhost:4566
NODE_ENV=development
```

### 2. Start LocalStack

```bash
pnpm localstack:start
```

This will:

- Pull the LocalStack Docker image (first time only)
- Start LocalStack on port 4566
- Run in detached mode (background)

**Expected output:**

```
✔ Container lasflores-localstack  Started
```

### 3. Wait for LocalStack to be Ready

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# You should see:
# {"services": {"s3": "available"}}
```

### 4. Initialize S3 Bucket

```bash
pnpm localstack:setup
```

**Expected output:**

```
Waiting for LocalStack to be ready...
LocalStack is ready!
Creating S3 bucket: lasflores-admin-uploads
✓ S3 bucket created successfully!
✓ Bucket versioning enabled
✓ CORS configuration applied

=== LocalStack S3 Setup Complete ===
Buckets in LocalStack:
2025-11-17 10:00:00 lasflores-admin-uploads
```

### 5. Verify Setup

```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Should show:
# 2025-11-17 10:00:00 lasflores-admin-uploads
```

---

## Common Commands

### View LocalStack Logs

```bash
pnpm localstack:logs

# Press Ctrl+C to exit
```

### Stop LocalStack

```bash
pnpm localstack:stop
```

### Restart LocalStack (stop + start + setup)

```bash
pnpm localstack:restart
```

### Test S3 Operations

```bash
# Upload a test file
echo "test content" > /tmp/test.txt
aws --endpoint-url=http://localhost:4566 \
    s3 cp /tmp/test.txt \
    s3://lasflores-admin-uploads/quotes/test.txt

# List objects
aws --endpoint-url=http://localhost:4566 \
    s3 ls s3://lasflores-admin-uploads/quotes/

# Download file
aws --endpoint-url=http://localhost:4566 \
    s3 cp s3://lasflores-admin-uploads/quotes/test.txt \
    /tmp/test-download.txt

# Delete file
aws --endpoint-url=http://localhost:4566 \
    s3 rm s3://lasflores-admin-uploads/quotes/test.txt
```

---

## Troubleshooting

### Docker Not Running

**Error:**

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**

- Start Docker Desktop (macOS/Windows)
- Or: `sudo systemctl start docker` (Linux)

### Port 4566 Already in Use

**Error:**

```
Error starting userland proxy: listen tcp4 0.0.0.0:4566: bind: address already in use
```

**Solution:**

```bash
# Find what's using port 4566
lsof -i :4566

# Stop the conflicting service or use a different port
```

### Bucket Already Exists

**Warning:**

```
⚠ Bucket already exists (this is OK)
```

This is normal if you've run the setup before. LocalStack persists data in `./localstack-data`.

### Clear LocalStack Data

```bash
# Stop LocalStack
pnpm localstack:stop

# Remove persisted data
rm -rf localstack-data

# Restart and setup
pnpm localstack:restart
```

### AWS CLI Not Installed

**Error:**

```
aws: command not found
```

**Solution:**

```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# Windows
# Download from: https://aws.amazon.com/cli/
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start LocalStack (once per day/session)
pnpm localstack:start
pnpm localstack:setup

# 2. Start your Next.js app
pnpm dev

# 3. Work on your app (S3 uploads will go to LocalStack)

# 4. Stop LocalStack when done (optional, can leave running)
pnpm localstack:stop
```

### After Computer Restart

LocalStack containers don't auto-start. Run:

```bash
pnpm localstack:start
# Bucket should already exist from persistence
```

---

## Next Steps

Once LocalStack is running:

1. **Continue Phase 4 implementation** - Backend (repository + actions)
2. **Test file uploads** - Create UI components
3. **Verify attachments work** - Upload/download/delete tests

---

## Testing LocalStack is Working

Create a simple test script to verify S3 operations:

```bash
# Create: scripts/test-s3.sh
#!/bin/bash

echo "Testing LocalStack S3..."

# Create test file
echo "Hello from LocalStack!" > /tmp/test-upload.txt

# Upload
echo "1. Uploading file..."
aws --endpoint-url=http://localhost:4566 \
    s3 cp /tmp/test-upload.txt \
    s3://lasflores-admin-uploads/quotes/attachments/test-upload.txt

# List
echo "2. Listing files..."
aws --endpoint-url=http://localhost:4566 \
    s3 ls s3://lasflores-admin-uploads/quotes/attachments/

# Download
echo "3. Downloading file..."
aws --endpoint-url=http://localhost:4566 \
    s3 cp s3://lasflores-admin-uploads/quotes/attachments/test-upload.txt \
    /tmp/test-download.txt

# Verify
echo "4. Verifying content..."
cat /tmp/test-download.txt

# Delete
echo "5. Deleting file..."
aws --endpoint-url=http://localhost:4566 \
    s3 rm s3://lasflores-admin-uploads/quotes/attachments/test-upload.txt

echo "✅ All tests passed!"

# Cleanup
rm /tmp/test-upload.txt /tmp/test-download.txt
```

```bash
chmod +x scripts/test-s3.sh
./scripts/test-s3.sh
```

---

## Resources

- [LocalStack Docs](https://docs.localstack.cloud/)
- [AWS S3 CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Phase 4 Setup Guide](./PHASE4_SETUP.md)
