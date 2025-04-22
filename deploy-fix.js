/**
 * URL-Aware Deployment Fix for PawPerfect
 * 
 * This script creates deployment files that are sensitive to the deployment URL.
 * It fixes potential issues when the application URL changes.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting URL-aware deployment preparation...');

try {
  // Step 1: Build the application
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Create an enhanced standalone server with adaptive URLs
  console.log('\n📝 Creating URL-aware server...');
  
  const serverJs = `
// URL-Aware Server for Replit Deployment
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

// Dynamic CORS configuration based on request origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apiKey, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.url} \${res.statusCode} \${duration}ms\`);
  });
  next();
});

// Inject base URL into index.html for client-side use
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const baseUrl = \`\${protocol}://\${host}\`;
    
    // Store in a global variable for other middleware to use
    app.locals.baseUrl = baseUrl;
    
    // Continue to next middleware
  }
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

// System information endpoint
app.get('/api/system/health', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const baseUrl = \`\${protocol}://\${host}\`;
  
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: !!process.env.DATABASE_URL ? 'configured' : 'not configured',
    environment: process.env.NODE_ENV,
    url: baseUrl,
    host: host,
    protocol: protocol
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
        // Pass the correct URL to the client by modifying the HTML
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Add a script tag that sets window.BASE_URL
        const scriptTag = \`
          <script>
            window.BASE_URL = "\${app.locals.baseUrl || ''}";
            console.log('Application running at:', window.BASE_URL);
          </script>
        \`;
        
        // Insert the script tag before the closing </head> tag
        const modifiedHtml = htmlContent.replace('</head>', \`\${scriptTag}</head>\`);
        
        res.send(modifiedHtml);
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
  console.log('✅ Created URL-aware server.js');
  
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
  
  // Step 4: Create an adapter patch for client-side connection
  const adapterScript = `
// URL adapter for client-side connections
// This script allows the application to work with any deployment URL
(function() {
  // Set a default base URL in case window.BASE_URL isn't set
  window.BASE_URL = window.BASE_URL || window.location.origin;

  // Override Socket.IO connection creation
  const originalIO = window.io;
  if (typeof originalIO === 'function') {
    window.io = function(url, options) {
      // If no URL is provided, use the current base URL
      if (!url || typeof url === 'object') {
        options = url;
        url = window.BASE_URL;
      }
      return originalIO(url, options);
    };
    
    // Copy all properties from the original io
    for (const prop in originalIO) {
      if (Object.prototype.hasOwnProperty.call(originalIO, prop)) {
        window.io[prop] = originalIO[prop];
      }
    }
  }

  // Add a global fetch wrapper to handle relative URLs consistently
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Only modify if URL is a string and not an absolute URL
    if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('//')) {
      // If it doesn't start with /, add it
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      
      // Use the base URL for all relative paths
      url = window.BASE_URL + url;
    }
    return originalFetch(url, options);
  };

  console.log('URL adapter initialized with base URL:', window.BASE_URL);
})();
`;

  // Create a directory for the adapter if it doesn't exist
  const adapterDir = path.join(__dirname, 'public', 'js');
  if (!fs.existsSync(adapterDir)) {
    fs.mkdirSync(adapterDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(adapterDir, 'url-adapter.js'), adapterScript);
  console.log('✅ Created URL adapter script for client-side connections');
  
  // Copy the adapter to the dist directory as well
  const distAdapterDir = path.join(__dirname, 'dist', 'public', 'js');
  if (!fs.existsSync(distAdapterDir)) {
    fs.mkdirSync(distAdapterDir, { recursive: true });
  }
  
  fs.copyFileSync(
    path.join(adapterDir, 'url-adapter.js'),
    path.join(distAdapterDir, 'url-adapter.js')
  );
  
  // Step 5: Modify the index.html to include the adapter script
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check if the adapter is already included
      if (!indexContent.includes('url-adapter.js')) {
        // Add the adapter script before the closing </head> tag
        indexContent = indexContent.replace(
          '</head>',
          '  <script src="/js/url-adapter.js"></script>\n</head>'
        );
        
        fs.writeFileSync(indexPath, indexContent);
        console.log('✅ Modified index.html to include URL adapter');
      }
    }

    // Also modify the index.html in the dist directory
    const distIndexPath = path.join(__dirname, 'dist', 'public', 'index.html');
    if (fs.existsSync(distIndexPath)) {
      let distIndexContent = fs.readFileSync(distIndexPath, 'utf8');
      
      // Check if the adapter is already included
      if (!distIndexContent.includes('url-adapter.js')) {
        // Add the adapter script before the closing </head> tag
        distIndexContent = distIndexContent.replace(
          '</head>',
          '  <script src="/js/url-adapter.js"></script>\n</head>'
        );
        
        fs.writeFileSync(distIndexPath, distIndexContent);
        console.log('✅ Modified dist/public/index.html to include URL adapter');
      }
    }
  } catch (error) {
    console.warn('Could not modify index.html:', error.message);
  }
  
  // Step 6: Create a deployment troubleshooting guide
  const troubleshootingContent = `# Troubleshooting URL-Related Deployment Issues

If you're experiencing issues with your PawPerfect deployment after changing the URL, follow these steps:

## 1. Check the Server Logs

Look for any errors related to:
- Socket.IO connection failures
- CORS policy violations
- Missing or incorrect URLs

## 2. Try the Health Check Endpoint

Access \`/api/system/health\` to verify server configuration:
- It should display the current URL being used
- Check if the database connection is working
- Confirm the environment settings

## 3. Clear Your Browser Cache

URL changes can sometimes be affected by cached content:
- Clear your browser cache completely
- Try accessing the site in an incognito/private window
- Try a different browser

## 4. Check Network Requests

Use your browser's developer tools to examine network requests:
- Look for 404 errors for Socket.IO connections
- Check if API requests are going to the correct domain
- Verify WebSocket connection attempts

## 5. Test Individual API Endpoints

Use curl or Postman to test API functionality directly:
\`\`\`
curl https://your-new-domain.com/api/services
\`\`\`

## 6. Examine CORS Headers

Make sure CORS headers are correctly configured:
- The 'Access-Control-Allow-Origin' header should include your new domain
- Check that required headers are permitted

## 7. Try Redeploying with URL-Aware Settings

If all else fails, try redeploying with the URL-aware deployment script:
\`\`\`
node deploy-fix.js
\`\`\`
`;

  fs.writeFileSync(path.join(__dirname, 'URL-TROUBLESHOOTING.md'), troubleshootingContent);
  console.log('✅ Created URL troubleshooting guide');
  
  console.log('\n✅ URL-aware deployment preparation completed successfully!');
  console.log('\n📋 Deployment Instructions:');
  console.log('1. Click the "Deploy" button in Replit');
  console.log('2. Set the deployment type to "Scheduled"');
  console.log('3. Set the run command to: node server.js');
  console.log('4. Complete the deployment process\n');
  console.log('If you continue to experience URL-related issues, refer to URL-TROUBLESHOOTING.md for detailed guidance.\n');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error);
  process.exit(1);
}