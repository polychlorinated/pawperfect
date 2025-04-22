#!/bin/bash
# Simple deployment script for Replit

echo "🚀 Starting deployment preparation..."

# Step 1: Build the application
echo "📦 Building application..."
npm run build

# Step 2: Copy deployment files to dist directory
echo "📋 Setting up deployment files..."
cp replit-deploy-server.js dist/
cp replit-deploy-package.json dist/package.json

echo "✨ Deployment preparation complete!"
echo ""
echo "To deploy on Replit:"
echo "1. Click the Deploy button"
echo "2. Set deployment type to HTTP Service"
echo "3. Set run command to: node replit-deploy-server.js"
echo "4. Click Deploy"
echo ""
echo "For detailed instructions, see DEPLOYMENT_INSTRUCTIONS.md"