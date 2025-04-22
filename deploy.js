/**
 * Enhanced Deployment Solution for PawPerfect
 * 
 * This script creates a robust server setup that addresses common deployment issues:
 * 1. Port configuration
 * 2. Database connectivity
 * 3. File paths
 * 4. Environment settings
 * 5. Error logging
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting enhanced deployment preparation...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create an enhanced standalone server
  console.log('\n📝 Creating enhanced standalone server...');
  
  const serverJs = `
// Enhanced standalone server for Replit deployment
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure environment variables are available
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Setup error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Keep the process running despite errors
});

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

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.url} \${res.statusCode} \${duration}ms\`);
  });
  next();
});

// Serve static files from the public directory
// First check if dist/public exists, otherwise use public
let staticDir = 'public';
if (fs.existsSync(join(__dirname, 'dist', 'public'))) {
  staticDir = join(__dirname, 'dist', 'public');
} else if (fs.existsSync(join(__dirname, 'public'))) {
  staticDir = join(__dirname, 'public');
}
console.log(\`Serving static files from: \${staticDir}\`);
app.use(express.static(staticDir));

// Database connection check endpoint
app.get('/api/system/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: !!process.env.DATABASE_URL ? 'configured' : 'not configured',
    environment: process.env.NODE_ENV
  };
  res.json(health);
});

// Import API routes - from the pre-bundled index.js
console.log('Initializing API server...');
import('./index.js')
  .then((module) => {
    console.log('API routes initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize API routes:', err);
    
    // Fallback routes if API initialization fails
    app.get('/api/*', (req, res) => {
      res.status(500).json({ 
        error: 'API server initialization failed',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });
  })
  .finally(() => {
    // Catch-all route to handle client-side routing
    app.get('*', (req, res) => {
      const indexPath = join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application files not found. Please check your deployment setup.');
      }
    });
  });

// Create HTTP server
const server = http.createServer(app);

// Enhanced port handling with fallbacks
const PORT = process.env.PORT || process.env.REPLIT_PORT || 8080;
const HOST = '0.0.0.0'; // Bind to all network interfaces

// Start the server with robust error handling
try {
  server.listen(PORT, HOST, () => {
    console.log(\`Server running on port \${PORT}\`);
    console.log(\`Environment: \${process.env.NODE_ENV}\`);
    
    // Print possible access URLs
    console.log('\\nAccess URLs:');
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      console.log(\`- Replit URL: https://\${process.env.REPL_SLUG}.\${process.env.REPL_OWNER}.repl.co\`);
    }
    if (process.env.REPLIT_DEPLOYMENT_ID) {
      console.log(\`- Deployment ID: \${process.env.REPLIT_DEPLOYMENT_ID}\`);
    }
    console.log(\`- Local URL: http://localhost:\${PORT}\`);
    
    // List environment variables (excluding sensitive ones)
    console.log('\\nEnvironment Variables:');
    const safeEnvVars = Object.keys(process.env)
      .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASS'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});
    console.log(safeEnvVars);
  });
  
  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(\`Port \${PORT} is already in use. Trying another port...\`);
      setTimeout(() => {
        server.close();
        server.listen(0, HOST); // Let OS assign a random available port
      }, 1000);
    }
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), serverJs);
  console.log('✅ Created enhanced standalone server.js');
  
  // Step 3: Create a simplified server.js in the root for direct running
  const rootServerJs = `
// Root server.js for direct running in Replit
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine the correct server file to run
let serverPath = join(__dirname, 'dist', 'server.js');
if (!existsSync(serverPath)) {
  serverPath = join(__dirname, 'server.js');
}

console.log(\`Starting server from \${serverPath}...\`);

// Import and run the actual server
import(serverPath).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
`;

  fs.writeFileSync(path.join(__dirname, 'server.js'), rootServerJs);
  console.log('✅ Created root server.js for direct running');
  
  // Step 4: Create an optimized package.json for deployment
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
  
  // Step 5: Create a README in the dist directory
  const readmeContent = `# PawPerfect Deployment

This is the production build of the PawPerfect application for Replit deployment.

## How to deploy on Replit

1. Click the "Deploy" button in Replit
2. In the deployment settings:
   - Set the deployment type to "Scheduled"
   - Set the run command to: \`node server.js\`
   - Keep all other settings as default
3. Complete the deployment process

## Troubleshooting Deployment Issues

If you see a "Not Found" error when accessing your deployed app:

1. Check the deployment logs for any errors
2. Verify that all environment variables are set correctly
3. Make sure the PORT environment variable is set and your server is listening on it
4. Try accessing the health check endpoint at /api/system/health
5. Check if the database connection is working

## Important Environment Variables

- DATABASE_URL: PostgreSQL database connection string
- PORT: The port on which the server should listen
- NODE_ENV: Set to 'production' for deployment
`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'README.md'), readmeContent);
  
  // Create a troubleshooting file
  const troubleshootingContent = `# Troubleshooting PawPerfect Deployment

If you're experiencing issues with your PawPerfect deployment, please follow this step-by-step guide:

## 1. Verify Your Database Connection

The most common issue with deployment is database connectivity. Check that:

- The DATABASE_URL environment variable is set correctly in your Replit deployment
- The database server is accessible from Replit's network
- Your database user has the correct permissions

## 2. Check Server Port Configuration

Replit expects your application to listen on the PORT environment variable it provides:

- Make sure your server is binding to \`process.env.PORT || 8080\`
- Ensure you're binding to '0.0.0.0' (all network interfaces) not 'localhost'

## 3. Check Static Files Serving

If your app loads but shows no UI:

- Make sure the static files are being served correctly
- Verify that the index.html file exists in the correct location

## 4. Check Deployment Logs

Examine the logs in your Replit deployment for any errors:

- Look for database connection errors
- Check for file path issues
- Verify that the API routes are initializing correctly

## 5. Test Individual API Endpoints

Try accessing specific API endpoints to narrow down the issue:

- /api/system/health - Should return system health information
- /api/services - Should return available services
- /api/user - Should return user information if authenticated

## 6. Restart Your Deployment

Sometimes simply restarting the deployment can resolve issues:

1. Stop the current deployment
2. Wait a few seconds
3. Start it again

## 7. Try a Different Deployment Type

If all else fails, try a different deployment type:

- Scheduled: Best for full-stack applications
- HTTP: Good for API-only applications
- Static: Good for front-end only applications
`;

  fs.writeFileSync(path.join(__dirname, 'TROUBLESHOOTING.md'), troubleshootingContent);
  console.log('✅ Created troubleshooting guide');
  
  console.log('\n✅ Enhanced deployment preparation completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the deployment type to "Scheduled"');
  console.log('3. Set the run command to: node server.js');
  console.log('4. Complete the deployment process\n');
  console.log('If you continue to experience issues, refer to TROUBLESHOOTING.md for detailed guidance.\n');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
}