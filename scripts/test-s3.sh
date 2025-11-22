#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing LocalStack S3 Operations...${NC}"
echo ""

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo -e "${RED}✗ LocalStack is not running!${NC}"
  echo -e "${YELLOW}Start it with: pnpm localstack:start${NC}"
  exit 1
fi

echo -e "${GREEN}✓ LocalStack is running${NC}"

# Configuration
BUCKET_NAME="${AWS_S3_BUCKET_NAME:-lasflores-admin-uploads}"
PREFIX="${AWS_S3_QUOTES_PREFIX:-quotes/attachments}"
ENDPOINT="http://localhost:4566"
REGION="${AWS_REGION:-ap-southeast-2}"

echo -e "${YELLOW}Bucket: ${BUCKET_NAME}${NC}"
echo -e "${YELLOW}Prefix: ${PREFIX}${NC}"
echo ""

# Create test file
TEST_FILE="/tmp/test-upload-$(date +%s).txt"
echo "Hello from LocalStack! Timestamp: $(date)" > "$TEST_FILE"

# Test 1: Upload file
echo -e "${YELLOW}1. Uploading file...${NC}"
S3_KEY="${PREFIX}/test-upload.txt"

if aws --endpoint-url=$ENDPOINT \
    s3 cp "$TEST_FILE" \
    "s3://${BUCKET_NAME}/${S3_KEY}" \
    --region $REGION \
    --quiet 2>/dev/null; then
  echo -e "${GREEN}   ✓ File uploaded successfully${NC}"
else
  echo -e "${RED}   ✗ Upload failed${NC}"
  rm "$TEST_FILE"
  exit 1
fi

# Test 2: List all files in bucket
echo -e "${YELLOW}2. Listing all files in bucket...${NC}"
echo ""
echo -e "${GREEN}📁 All files in bucket:${NC}"
aws --endpoint-url=$ENDPOINT \
    s3 ls "s3://${BUCKET_NAME}/" \
    --recursive \
    --region $REGION 2>/dev/null

echo ""
echo -e "${GREEN}📊 File count by folder:${NC}"
aws --endpoint-url=$ENDPOINT \
    s3 ls "s3://${BUCKET_NAME}/" \
    --recursive \
    --region $REGION 2>/dev/null | \
    awk '{print $4}' | \
    grep -o '^[^/]*/' | \
    sort | uniq -c | \
    while read count folder; do
        echo -e "   ${count} files in ${YELLOW}${folder}${NC}"
    done

echo ""
echo -e "${GREEN}📂 Folder structure:${NC}"
aws --endpoint-url=$ENDPOINT \
    s3 ls "s3://${BUCKET_NAME}/" \
    --region $REGION 2>/dev/null

# Test 3: Download file
echo -e "${YELLOW}3. Downloading file...${NC}"
DOWNLOAD_FILE="/tmp/test-download-$(date +%s).txt"

if aws --endpoint-url=$ENDPOINT \
    s3 cp "s3://${BUCKET_NAME}/${S3_KEY}" \
    "$DOWNLOAD_FILE" \
    --region $REGION \
    --quiet 2>/dev/null; then
  echo -e "${GREEN}   ✓ File downloaded successfully${NC}"
else
  echo -e "${RED}   ✗ Download failed${NC}"
  rm "$TEST_FILE"
  exit 1
fi

# Test 4: Verify content
echo -e "${YELLOW}4. Verifying content...${NC}"
if diff "$TEST_FILE" "$DOWNLOAD_FILE" > /dev/null; then
  echo -e "${GREEN}   ✓ Content matches (upload/download successful)${NC}"
  cat "$DOWNLOAD_FILE" | sed 's/^/   /'
else
  echo -e "${RED}   ✗ Content mismatch${NC}"
  rm "$TEST_FILE" "$DOWNLOAD_FILE"
  exit 1
fi

# Test 5: Delete file
echo -e "${YELLOW}5. Deleting file...${NC}"
if aws --endpoint-url=$ENDPOINT \
    s3 rm "s3://${BUCKET_NAME}/${S3_KEY}" \
    --region $REGION \
    --quiet 2>/dev/null; then
  echo -e "${GREEN}   ✓ File deleted successfully${NC}"
else
  echo -e "${RED}   ✗ Delete failed${NC}"
fi

# Cleanup
rm "$TEST_FILE" "$DOWNLOAD_FILE" 2>/dev/null

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ All S3 tests passed!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${YELLOW}LocalStack S3 is working correctly.${NC}"
echo -e "${YELLOW}You can now continue with Phase 4 implementation.${NC}"
