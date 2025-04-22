/**
 * Replit-Specific Deployment Script
 * 
 * This script handles the build process for deployment specifically on Replit.
 * It addresses issues with port forwarding and static file serving.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Replit-specific deployment process...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create a custom start script that ensures port forwarding works properly
  console.log('\n📝 Creating custom start script...');
  
  const startScript = `
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the actual server in the background
console.log('Starting server...');
const childProcess = execSync('node index.js', { 
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Ensure we're in production mode
    NODE_ENV: 'production',
    // Use the port from env or default to 5000
    PORT: process.env.PORT || 5000
  }
});
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'start.js'), startScript);
  console.log('✅ Created custom start script in dist/start.js');
  
  // Step 3: Copy the MCP directory to the public directory in dist
  console.log('\n📂 Organizing MCP tools...');
  const mcpDir = path.join(__dirname, 'public', 'mcp');
  
  if (!fs.existsSync(mcpDir)) {
    fs.mkdirSync(mcpDir, { recursive: true });
  }
  
  // Copy all MCP test files to the mcp directory
  const mcpFiles = ['sse-test.html', 'index.html'].filter(file => {
    const filePath = path.join(__dirname, 'public', file);
    return fs.existsSync(filePath);
  });
  
  for (const file of mcpFiles) {
    const sourcePath = path.join(__dirname, 'public', file);
    const destPath = path.join(mcpDir, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to public/mcp directory`);
    }
  }
  
  // Step 4: Copy the MCP directory to the dist directory
  const distMcpDir = path.join(__dirname, 'dist', 'public', 'mcp');
  
  if (!fs.existsSync(distMcpDir)) {
    fs.mkdirSync(distMcpDir, { recursive: true });
    console.log(`✅ Created dist/public/mcp directory`);
  }
  
  // Copy all files from the MCP directory to the dist directory
  const files = fs.readdirSync(mcpDir);
  
  for (const file of files) {
    const sourcePath = path.join(mcpDir, file);
    const destPath = path.join(distMcpDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to dist/public/mcp directory`);
  }
  
  // Step 5: Create a README in the dist directory
  const readmeContent = `# Replit Deployment Build

This is the production build of the application specifically optimized for Replit deployment.

## How to run this deployment

To run this application in production mode on Replit, use:

\`\`\`
NODE_ENV=production node start.js
\`\`\`

## Important notes

- Make sure all environment variables are set correctly
- The application expects to find the PostgreSQL database at the URL specified in DATABASE_URL
- MCP testing tools are available at /mcp
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  console.log('\n✅ Replit deployment build completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the run command to: NODE_ENV=production node dist/start.js');
  console.log('3. Complete the deployment process\n');
  
} catch (error) {
  console.error('❌ Deployment build failed:', error);
  process.exit(1);
}