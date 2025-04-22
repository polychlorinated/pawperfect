/**
 * Simple Deployment Script
 * 
 * A straightforward script that uses the built-in npm scripts to build the application
 * and prepare it for deployment on Replit.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting simple deployment process...');

try {
  // Step 1: Make sure the MCP tools are in the public/mcp directory
  console.log('\n📂 Organizing MCP tools...');
  const mcpDir = path.join(__dirname, 'public', 'mcp');
  
  if (!fs.existsSync(mcpDir)) {
    fs.mkdirSync(mcpDir, { recursive: true });
  }
  
  // Move MCP test pages to mcp directory if they exist in the public root
  const publicDir = path.join(__dirname, 'public');
  const mcpFiles = ['sse-test.html', 'index.html'].filter(file => {
    const filePath = path.join(publicDir, file);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    if (file.includes('sse-test')) {
      return true;
    }
    
    if (file === 'index.html') {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('MCP');
      } catch (err) {
        console.log(`Unable to read ${file}: ${err.message}`);
        return false;
      }
    }
    
    return false;
  });
  
  for (const file of mcpFiles) {
    const sourcePath = path.join(publicDir, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(mcpDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Moved ${file} to mcp directory`);
      
      // If it's the index.html file with MCP content, remove it from public root
      if (file === 'index.html') {
        fs.unlinkSync(sourcePath);
        console.log(`✅ Removed MCP index.html from public root`);
      }
    }
  }
  
  // Step 2: Build the application using the built-in npm scripts
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 3: Copy the MCP directory to the dist directory
  console.log('\n📂 Copying MCP directory to dist...');
  const distMcpDir = path.join(__dirname, 'dist', 'public', 'mcp');
  
  if (!fs.existsSync(distMcpDir)) {
    fs.mkdirSync(distMcpDir, { recursive: true });
    console.log(`✅ Created dist/public/mcp directory`);
  }
  
  // Copy all files from the MCP directory to the dist directory
  const sourceDir = path.join(__dirname, 'public', 'mcp');
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(distMcpDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to dist/public/mcp directory`);
  }
  
  // Step 4: Create a README in the dist directory
  const readmeContent = `# Production Build
  
This is the production build of the application.

## How to run

To run this application in production mode, use:

\`\`\`
npm run start
\`\`\`

or directly:

\`\`\`
NODE_ENV=production node index.js
\`\`\`

## Important notes

- Make sure all environment variables are set correctly
- The application expects to find the PostgreSQL database at the URL specified in DATABASE_URL
- MCP testing tools are available at /mcp
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  console.log('\n✅ Deployment build completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the run command to: npm run start');
  console.log('   (This runs: NODE_ENV=production node dist/index.js)');
  console.log('3. Complete the deployment process\n');
  
} catch (error) {
  console.error('❌ Deployment build failed:', error);
  process.exit(1);
}