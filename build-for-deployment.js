/**
 * Custom Build Script for Deployment
 * 
 * This script handles the build process for deployment and addresses the tsx loader issue.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting deployment build process...');

try {
  // First run the prepare-for-deployment script to organize files
  console.log('\n[1/4] Preparing files for deployment...');
  execSync('node prepare-for-deployment.js', { stdio: 'inherit' });
  
  // Run Vite build for the frontend
  console.log('\n[2/4] Building frontend assets with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Bundle server code with esbuild
  console.log('\n[3/4] Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Copy MCP directory to the build folder
  const mcpDir = path.join(__dirname, 'public', 'mcp');
  const distMcpDir = path.join(__dirname, 'dist', 'public', 'mcp');
  if (fs.existsSync(mcpDir)) {
    console.log('Copying MCP tools to build directory...');
    if (!fs.existsSync(distMcpDir)) {
      fs.mkdirSync(distMcpDir, { recursive: true });
    }
    
    // Copy all files from the MCP directory
    const mcpFiles = fs.readdirSync(mcpDir);
    mcpFiles.forEach(file => {
      const sourcePath = path.join(mcpDir, file);
      const destPath = path.join(distMcpDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to build directory`);
    });
  }
  
  // Create a production start script that doesn't use tsx
  console.log('\n[4/4] Creating production start script...');
  
  const startScript = `#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

process.env.NODE_ENV = 'production';
console.log('Starting application in production mode...');

// Import and run the application
import './index.js';
`;
  
  fs.writeFileSync(path.join(__dirname, 'dist', 'start.js'), startScript);
  execSync('chmod +x dist/start.js', { stdio: 'inherit' });
  
  // Create a deployment README with instructions
  const readmeContent = `# Deployment Instructions

This application has been built for production deployment.

## Starting the Application

To start the application in production mode, run:

\`\`\`
NODE_ENV=production node dist/start.js
\`\`\`

## Troubleshooting

If you encounter errors related to the tsx loader:
1. Make sure you're using the \`start.js\` entry point
2. Ensure your Node.js version is compatible with ES modules (v14+)
`;
  
  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  console.log('\nBuild completed successfully! ✅');
  console.log('To start the application in production mode:');
  console.log('NODE_ENV=production node dist/start.js');
  
} catch (error) {
  console.error('\nBuild failed ❌');
  console.error(error);
  process.exit(1);
}