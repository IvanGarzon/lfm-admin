#!/bin/sh
# Block .env files, but allow .env.example and similar
if git diff --cached --name-only | grep -E '\.env(\..*)?$' | grep -v '\.env\.example'; then
  echo "❌ You are trying to commit a real .env file. Please remove it from staging before committing."
  exit 1
fi
