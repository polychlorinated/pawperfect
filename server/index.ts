import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { updateDB } from "./db-update";

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apiKey'],
  credentials: true,
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  // Capture response JSON
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request details on finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine.slice(0, 200)); // Truncate long logs
    }
  });

  next();
});

// Main application setup
(async () => {
  try {
    // Seed database and update schema
    await seedDatabase();
    log("Database seeded successfully");
    
    await updateDB();
    log("Database schema updated successfully");

    // Register routes
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const status = (err as any).status || (err as any).statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error: ${message}`, "error-handler");
      
      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      const distPath = path.join(__dirname, '..', 'dist', 'public');
      app.use(express.static(distPath));
      app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
    }

    // Setup Vite in development
    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    // Start server
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    server.listen(port, '0.0.0.0', () => {
        log(`Server running on port ${port}`);
      }).on('error', (err) => {
        console.error('Server startup error:', err);
        process.exit(1);
      });

  } catch (error) {
    log(`Startup error: ${error}`, "startup");
    process.exit(1);
  }
})();