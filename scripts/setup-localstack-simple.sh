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
REGION="${AWS_REGION:-ap-southeast-2}"
ENDPOINT="http://localhost:4566"

# Wait for LocalStack to be ready (simpler check)
echo -e "${YELLOW}Waiting for LocalStack to be ready...${NC}"
sleep 5

# Create S3 bucket
echo -e "${YELLOW}Creating S3 bucket: ${BUCKET_NAME}${NC}"
aws --endpoint-url=$ENDPOINT \
    s3 mb s3://$BUCKET_NAME \
    --region $REGION \
    2>&1

if [ $? -eq 0 ] || aws --endpoint-url=$ENDPOINT s3 ls | grep -q $BUCKET_NAME; then
  echo -e "${GREEN}✓ S3 bucket ready!${NC}"
else
  echo -e "${RED}✗ Failed to create bucket${NC}"
  exit 1
fi

# List buckets to verify
echo ""
echo -e "${GREEN}=== LocalStack S3 Setup Complete ===${NC}"
echo -e "${YELLOW}Buckets in LocalStack:${NC}"
aws --endpoint-url=$ENDPOINT s3 ls

echo ""
echo -e "${GREEN}✅ LocalStack is ready for testing!${NC}"
echo -e "${YELLOW}Next: Visit http://localhost:3000/test-s3${NC}"
