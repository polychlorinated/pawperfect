import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import RateLimit from "express-rate-limit";
import { log } from "./utils";

// Create a custom logger
const viteLogger = createLogger();

// Setup Vite middleware and development server
export async function setupVite(app: Express, server: Server) {
  // Rate limiting configuration
  const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiter
  app.use(limiter);

  // Create Vite server
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    appType: "custom",
  });

  // Use Vite middleware
  app.use(vite.middlewares);

  // Handle all routes for SPA
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Resolve path to client's index.html
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );

      // Read and transform HTML
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      // Transform HTML with Vite
      const page = await vite.transformIndexHtml(url, template);

      // Send transformed HTML
      res.status(200)
        .set({ 
          "Content-Type": "text/html",
          "Content-Security-Policy": "default-src 'self'"
        })
        .send(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Serve static files
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "client", "public");
  
  if (!fs.existsSync(distPath)) {
    log(`Warning: Static assets directory not found: ${distPath}`, "static-serve");
    return;
  }

  // Serve static files
  app.use(express.static(distPath));

  // Fallback to index.html for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}