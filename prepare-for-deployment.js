/**
 * Deployment Preparation Helper
 * 
 * This script helps prepare your application for deployment.
 * Instead of modifying the build process, it ensures your application 
 * structure is correct for deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean up any stray HTML files in public that might interfere with React
const publicFiles = ['index.html', 'redirect.html'];
publicFiles.forEach(file => {
  const filePath = path.join(__dirname, 'public', file);
  if (fs.existsSync(filePath)) {
    console.log(`Removing ${file} from public folder...`);
    fs.unlinkSync(filePath);
  }
});

// Ensure MCP tools are available in a dedicated subdirectory
const mcpDir = path.join(__dirname, 'public', 'mcp');
if (!fs.existsSync(mcpDir)) {
  console.log('Creating MCP tools directory...');
  fs.mkdirSync(mcpDir, { recursive: true });
}

// Copy SSE test tool to MCP directory if it's not already there
const sseTestSource = path.join(__dirname, 'public', 'sse-test.html');
const sseTestDest = path.join(mcpDir, 'sse-test.html');
if (fs.existsSync(sseTestSource) && !fs.existsSync(sseTestDest)) {
  console.log('Copying SSE test tool to MCP directory...');
  fs.copyFileSync(sseTestSource, sseTestDest);
}

// Check if we have an MCP testing interface in the archive
const mcpTestingSource = path.join(__dirname, 'archive', 'mcp-testing.html');
const mcpTestingDest = path.join(mcpDir, 'index.html');
if (fs.existsSync(mcpTestingSource) && !fs.existsSync(mcpTestingDest)) {
  console.log('Copying MCP testing interface to MCP directory...');
  fs.copyFileSync(mcpTestingSource, mcpTestingDest);
}

console.log('\nDeployment preparation complete!');
console.log('\nTo deploy your application:');
console.log('1. Make sure the application is running correctly in development');
console.log('2. Click the "Deploy" button in Replit');
console.log('3. Your application should load properly without showing the MCP tools interface first');