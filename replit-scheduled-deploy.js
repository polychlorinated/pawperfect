/**
 * Replit Scheduled Deployment Script
 * 
 * This script prepares the application for scheduled deployment on Replit.
 * It creates a simple standalone server script that will work reliably in Replit's scheduled environment.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Replit scheduled deployment preparation...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create a standalone server script
  console.log('\n📝 Creating standalone server script...');
  
  const serverJs = `
// Standalone server for Replit scheduled deployment
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Import API routes - we'll do this from the pre-bundled index.js
console.log('Initializing server...');
import('./index.js')
  .then(() => {
    console.log('API routes initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize API routes:', err);
    
    // Fallback routes if API initialization fails
    app.get('/api/*', (req, res) => {
      res.status(500).json({ error: 'API server initialization failed' });
    });
    
    // Serve frontend as fallback
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'public', 'index.html'));
    });
  });

// Create HTTP server
const server = http.createServer(app);

// Start the server with explicit port and host binding
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Access your application at: https://\${process.env.REPL_SLUG}.\${process.env.REPL_OWNER}.repl.co\`);
});
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), serverJs);
  console.log('✅ Created standalone server.js');
  
  // Step 3: Create an optimized package.json for deployment
  const deployPackageJson = {
    "name": "pawperfect-deploy",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "NODE_ENV=production node server.js"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "express": "^4.18.2"
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'package.json'), 
    JSON.stringify(deployPackageJson, null, 2)
  );
  console.log('✅ Created optimized package.json for deployment');
  
  // Step 4: Add MCP test pages to the public directory
  console.log('\n📂 Organizing MCP tools...');
  const mcpDir = path.join(__dirname, 'public', 'mcp');
  const distMcpDir = path.join(__dirname, 'dist', 'public', 'mcp');
  
  if (!fs.existsSync(mcpDir)) {
    fs.mkdirSync(mcpDir, { recursive: true });
  }
  
  if (!fs.existsSync(distMcpDir)) {
    fs.mkdirSync(distMcpDir, { recursive: true });
  }
  
  // Move MCP test files to the mcp directory
  const mcpFiles = ['sse-test.html', 'index.html'].filter(file => {
    const filePath = path.join(__dirname, 'public', file);
    return fs.existsSync(filePath);
  });
  
  for (const file of mcpFiles) {
    const sourcePath = path.join(__dirname, 'public', file);
    const destPath = path.join(mcpDir, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      
      // Also copy to dist directory
      fs.copyFileSync(sourcePath, path.join(distMcpDir, file));
      console.log(`✅ Copied ${file} to mcp directories`);
    }
  }
  
  // Step 5: Create a README in the dist directory
  const readmeContent = `# Replit Scheduled Deployment

This is the production build of the PawPerfect application for scheduled deployment on Replit.

## How to deploy on Replit

1. Click the "Deploy" button in Replit
2. In the deployment settings:
   - Set the deployment type to "Scheduled"
   - Set the run command to: \`node server.js\`
   - Keep all other settings as default
3. Complete the deployment process

## Important notes

- The application will be available at your Replit domain
- MCP testing tools are available at /mcp/
- Ensure that the DATABASE_URL environment variable is set correctly
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  console.log('\n✅ Scheduled deployment preparation completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the deployment type to "Scheduled"');
  console.log('3. Set the run command to: node server.js');
  console.log('4. Complete the deployment process\n');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
}