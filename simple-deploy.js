/**
 * Extremely Simple Deployment Script
 * 
 * This script creates a minimal standalone server that can run on Replit
 * without any dependencies on the original codebase.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting minimal deployment preparation...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create a standalone minimal Express server
  console.log('\n📝 Creating standalone minimal server...');
  
  const serverJs = `
// Minimal Express server for Replit deployment
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Basic CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Simple request logging
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.url}\`);
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(\`Server running on port \${port}\`);
  console.log(\`Access URL: http://localhost:\${port}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
});
`;

  // Create a directory for the deploy package
  const deployDir = path.join(__dirname, 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  // Write the server file
  fs.writeFileSync(path.join(deployDir, 'server.js'), serverJs);
  console.log('✅ Created minimal server.js');
  
  // Create a package.json for the deployment
  const packageJson = {
    "name": "pawperfect-static",
    "version": "1.0.0",
    "type": "module",
    "main": "server.js",
    "scripts": {
      "start": "node server.js"
    },
    "dependencies": {
      "express": "^4.18.2"
    }
  };
  
  fs.writeFileSync(
    path.join(deployDir, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
  );
  console.log('✅ Created package.json');
  
  // Copy the public directory to the deploy directory
  const publicSrcDir = path.join(__dirname, 'dist', 'public');
  const publicDestDir = path.join(deployDir, 'public');
  
  if (!fs.existsSync(publicDestDir)) {
    fs.mkdirSync(publicDestDir, { recursive: true });
  }
  
  // Copy all files from public directory
  console.log('📂 Copying static files...');
  execSync(`cp -R ${publicSrcDir}/* ${publicDestDir}/`, { stdio: 'inherit' });
  console.log('✅ Copied static files');
  
  // Create a simple start script in the root
  const startScript = `
#!/bin/bash
cd deploy
npm start
`;

  fs.writeFileSync(path.join(__dirname, 'start.sh'), startScript);
  execSync('chmod +x start.sh', { stdio: 'inherit' });
  console.log('✅ Created start.sh script');
  
  // Create a README file
  const readmeContent = `# PawPerfect Static Deployment

This is a minimal static deployment of PawPerfect that requires only:
- Node.js
- Express

## How to deploy on Replit

1. Click the "Deploy" button in Replit
2. Set the deployment type to "HTTP Service"
3. Set the run command to: \`./start.sh\`
4. Complete the deployment process

## Important notes

- This is a static deployment with minimal server capabilities
- The database functionality is not included in this deployment
- If you need full functionality, use the standard deployment method
`;

  fs.writeFileSync(path.join(deployDir, 'README.md'), readmeContent);
  
  console.log('\n✅ Minimal deployment preparation completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the deployment type to "HTTP Service"');
  console.log('3. Set the run command to: ./start.sh');
  console.log('4. Complete the deployment process\n');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
}