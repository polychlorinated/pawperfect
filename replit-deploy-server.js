// Replit-optimized deployment server
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Explicitly set no-cache headers for all responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apiKey, x-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Serve static files from dist/public
const staticPath = join(__dirname, 'dist', 'public');
app.use(express.static(staticPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Replit deployment server is running',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Custom 404 handling for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not available in static deployment',
    message: 'This is a static deployment without backend functionality',
    requestPath: req.path,
    timestamp: new Date().toISOString()
  });
});

// Fallback route - serve index.html for all other requests
app.get('*', (req, res) => {
  res.sendFile(join(staticPath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⭐ Replit deployment server running on port ${PORT}`);
  console.log(`📂 Serving static files from: ${staticPath}`);
  console.log(`🌐 Server started at: ${new Date().toISOString()}`);
});