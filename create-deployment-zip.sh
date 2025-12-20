#!/bin/bash

# Azure Functions Deployment ZIP Creator
# This script builds and creates a deployment-ready ZIP file

set -e  # Exit on error

echo "🚀 Creating Azure Functions Deployment ZIP..."
echo ""

# Step 1: Navigate to backend directory (if not already there)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 2: Clean previous builds
echo "📦 Cleaning previous builds..."
npm run clean 2>/dev/null || echo "No clean script found, continuing..."

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 4: Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Step 5: Install production dependencies only (optional, reduces size)
echo "📦 Installing production dependencies..."
npm install --production

# Step 6: Create ZIP file excluding unnecessary files
echo "📦 Creating deployment ZIP..."

# Create ZIP excluding:
# - TypeScript source files (*.ts)
# - Git files (.git/)
# - VS Code settings (.vscode/)
# - Local settings (local.settings.json)
# - Build artifacts (*.js.map)
# - Test files
# - Development files

ZIP_NAME="deployment-$(date +%Y%m%d-%H%M%S).zip"

zip -r "$ZIP_NAME" . \
  -x "*.ts" \
  -x "*.tsbuildinfo" \
  -x ".git/*" \
  -x ".vscode/*" \
  -x "local.settings.json" \
  -x "*.js.map" \
  -x "__azurite_db*__.json" \
  -x "__blobstorage__/*" \
  -x "__queuestorage__/*" \
  -x "*.log" \
  -x ".env*" \
  -x "tsconfig.json" \
  -x ".github/*" \
  -x "*.sh" \
  -x "deployment-*.zip" \
  -x "*.md" \
  -x "test/*" \
  -x "tests/*" \
  -x "__tests__/*" \
  -x "*.test.js" \
  -x "*.spec.js"

# Get file size
FILE_SIZE=$(du -h "$ZIP_NAME" | cut -f1)

echo ""
echo "✅ Deployment ZIP created successfully!"
echo "📁 File: $ZIP_NAME"
echo "📊 Size: $FILE_SIZE"
echo ""
echo "📤 Ready to upload to Azure Portal!"
echo "   Azure Portal → Function App → Deployment Center → Manual deployment"
