// CommonJS format for highest compatibility
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Static files (if they exist)
const staticPath = path.join(__dirname, 'dist/public');
if (fs.existsSync(staticPath)) {
  console.log(`📂 Serving static files from: ${staticPath}`);
  app.use(express.static(staticPath));
}

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  });
});

// Database test endpoint
app.get('/db-test', (req, res) => {
  // Only expose if DB URL is available
  if (process.env.DATABASE_URL) {
    res.status(200).json({ 
      dbConfigured: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({ 
      dbConfigured: false,
      message: 'Database connection not configured',
    });
  }
});

// Add fallback HTML for testing
app.get('*', (req, res) => {
  // Check if index.html exists in static path
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML for diagnostics
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PawPerfect - Server Running</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { color: #4f46e5; }
            .card { background: #f9f9f9; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>PawPerfect Server</h1>
          <div class="card">
            <h2>Server Status: Running</h2>
            <p>The server is running correctly, but no static files were found.</p>
            <p>Server time: ${new Date().toLocaleString()}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            <p>Database configured: ${Boolean(process.env.DATABASE_URL)}</p>
          </div>
          <div class="card">
            <h2>Available Endpoints</h2>
            <ul>
              <li><code>/health</code> - Health check endpoint</li>
              <li><code>/db-test</code> - Database connection test</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⭐ Ultra-compatible server running on port ${PORT}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
});