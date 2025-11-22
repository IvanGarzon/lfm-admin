#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up LocalStack S3...${NC}"
echo ""

# Configuration
BUCKET_NAME="${AWS_S3_BUCKET_NAME:-lasflores-admin-uploads}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ENDPOINT_URL="http://localhost:4566"

# Simple wait for LocalStack to be ready
echo -e "${YELLOW}Waiting for LocalStack to start (10 seconds)...${NC}"
sleep 10

# Check if LocalStack is responding
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo -e "${RED}✗ LocalStack is not responding!${NC}"
  echo -e "${YELLOW}Make sure LocalStack is running: pnpm localstack:start${NC}"
  echo -e "${YELLOW}Check logs: docker logs lasflores-localstack${NC}"
  exit 1
fi

echo -e "${GREEN}✓ LocalStack is responding${NC}"

# Create S3 bucket
echo -e "${YELLOW}Creating S3 bucket: ${BUCKET_NAME}${NC}"

aws --endpoint-url=$ENDPOINT_URL \
    s3 mb s3://$BUCKET_NAME \
    --region $AWS_REGION \
    2>&1 | grep -v "BucketAlreadyOwnedByYou" || true

# Check if bucket exists
if aws --endpoint-url=$ENDPOINT_URL s3 ls 2>&1 | grep -q $BUCKET_NAME; then
  echo -e "${GREEN}✓ S3 bucket created/exists: ${BUCKET_NAME}${NC}"
else
  echo -e "${RED}✗ Failed to create bucket${NC}"
  exit 1
fi

# Enable versioning (optional, suppress errors)
echo -e "${YELLOW}Configuring bucket...${NC}"
aws --endpoint-url=$ENDPOINT_URL \
    s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled \
    --region $AWS_REGION \
    2>/dev/null && echo -e "${GREEN}✓ Bucket versioning enabled${NC}" || echo -e "${YELLOW}⚠ Versioning not set (OK)${NC}"

# Set CORS configuration for browser uploads
CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "$CORS_CONFIG" > /tmp/cors-config.json

aws --endpoint-url=$ENDPOINT_URL \
    s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file:///tmp/cors-config.json \
    --region $AWS_REGION \
    2>/dev/null && echo -e "${GREEN}✓ CORS configuration applied${NC}" || echo -e "${YELLOW}⚠ CORS not set (OK)${NC}"

rm -f /tmp/cors-config.json

# List buckets to verify
echo ""
echo -e "${GREEN}=== LocalStack S3 Setup Complete ===${NC}"
echo -e "${YELLOW}Available buckets:${NC}"
aws --endpoint-url=$ENDPOINT_URL s3 ls

echo ""
echo -e "${GREEN}✅ LocalStack is ready!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Copy environment: ${GREEN}cp .env.local.example .env.local${NC}"
echo -e "  2. Start dev server: ${GREEN}pnpm dev${NC}"
echo -e "  3. Visit test page: ${GREEN}http://localhost:3000/test-s3${NC}"
echo ""
