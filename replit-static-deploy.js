/**
 * Replit Static Deployment Script
 * 
 * This script prepares the application for static deployment on Replit.
 * It creates a simple static HTML wrapper that loads the application.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Replit static deployment preparation...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create a static loader file
  console.log('\n📝 Creating static loader file...');
  
  const loaderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PawPerfect - Dog Care Management</title>
  <meta http-equiv="refresh" content="0;url=/index.html">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f9f9f9;
      color: #333;
      text-align: center;
      padding: 50px 20px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    h1 {
      color: #4f46e5;
      font-size: 2.5rem;
      margin-bottom: 20px;
    }
    p {
      font-size: 1.1rem;
      margin-bottom: 15px;
    }
    .loading {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 5px solid rgba(79, 70, 229, 0.3);
      border-radius: 50%;
      border-top-color: #4f46e5;
      animation: spin 1s ease-in-out infinite;
      margin-top: 30px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <h1>PawPerfect</h1>
  <p>Loading your dog care management platform...</p>
  <p>If you are not redirected automatically, <a href="/index.html">click here</a>.</p>
  <div class="loading"></div>

  <script>
    // Backup in case meta refresh doesn't work
    window.onload = function() {
      window.location.href = '/index.html';
    }
  </script>
</body>
</html>`;

  // Write to both the root and dist directory
  fs.writeFileSync(path.join(__dirname, '404.html'), loaderHtml);
  fs.writeFileSync(path.join(__dirname, 'dist', '404.html'), loaderHtml);
  console.log('✅ Created 404.html static loader file');
  
  // Also copy it to index.html in the dist directory root
  fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), loaderHtml);
  console.log('✅ Created root index.html static loader file');
  
  // Step 3: Create a server.js file that will be used for deployment
  const serverJs = `
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configure CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apiKey', 'x-api-key'],
  credentials: true,
  maxAge: 86400
}));

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the frontend application
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Handle all other routes by serving index.html (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start the server on the port provided by Replit or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), serverJs);
  console.log('✅ Created server.js for static deployment');
  
  // Step 4: Create a static deployment package.json
  const staticPackageJson = {
    "name": "pawperfect-static",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "node server.js"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "express": "^4.18.2"
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'package.json'), 
    JSON.stringify(staticPackageJson, null, 2)
  );
  console.log('✅ Created package.json for static deployment');
  
  // Step 5: Create a README in the dist directory
  const readmeContent = `# Replit Static Deployment

This is a static deployment build of the PawPerfect application.

## How to deploy on Replit

1. Click the "Deploy" button in Replit
2. Set the deployment type to "Static"
3. Set the "Output directory" to "dist/public"
4. Complete the deployment process

## Accessing the application

After deployment, the application will be available at your Replit domain:
https://your-replit-app.replit.app/

## Important notes

- MCP testing tools are available at /mcp/
- If you see a "Not Found" error, check your deployment settings
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  console.log('\n✅ Static deployment preparation completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the deployment type to "Static"');
  console.log('3. Set the "Output directory" to "dist/public"');
  console.log('4. Complete the deployment process\n');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
}