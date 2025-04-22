#!/bin/bash
# Minimal deployment script for Replit

echo "🚀 Starting ultra-minimal deployment preparation..."

# Run build if possible
if [[ -f "package.json" ]]; then
  echo "📦 Building application..."
  npm run build
fi

# Copy deployment file to correct location
echo "📋 Setting up minimal deployment files..."
mkdir -p .replit-deploy
cp ultrasimple-server.js .replit-deploy/server.js

# Create a minimal package.json
cat > .replit-deploy/package.json << 'EOF'
{
  "name": "pawperfect-minimal-deployment",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

echo "✨ Ultra-minimal deployment preparation complete!"
echo ""
echo "DEPLOYMENT INSTRUCTIONS:"
echo "1. Click the Deploy button"
echo "2. Set deployment type to 'HTTP Service'"
echo "3. Set Path to: '.replit-deploy'"
echo "4. Set Run command to: 'node server.js'"
echo "5. Click Deploy"
echo ""
echo "This creates a minimal deployment that should work regardless of project complexity."