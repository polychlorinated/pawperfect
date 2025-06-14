# Detailed Deployment Guide

This guide provides detailed information about deploying this application on Replit, with particular focus on resolving the tsx loader issues and ensuring proper organization of the MCP testing tools.

## 1. Understanding the Architecture

This application consists of:
- A React frontend built with Vite
- A Node.js/Express backend with TypeScript
- Model Context Protocol (MCP) implementation using Server-Sent Events (SSE)
- PostgreSQL database via Drizzle ORM

## 2. The Build Process

The custom build process addresses several specific requirements:

1. **Resolving TSX Loader Issues**: The application uses tsx for development, which can cause issues during deployment. Our build process bundles the server-side code using esbuild and creates a pure JavaScript entry point.

2. **Organizing MCP Testing Tools**: The build process ensures that the MCP testing tools are properly organized into a /mcp directory to prevent them from appearing as the default landing page.

3. **Production-Ready Setup**: The build process creates a clear separation between development and production code.

## 3. Deployment Steps

### Prerequisites
- Make sure your application is working correctly in development mode
- Ensure all changes are committed

### Step 1: Prepare for Deployment
```
node deploy.js
```

This script:
1. Organizes the MCP tools into the public/mcp directory
2. Builds the React frontend with Vite
3. Bundles the server code with esbuild
4. Creates a production-ready start script

### Step 2: Deploy on Replit
1. Click the "Deploy" button in Replit
2. In the deployment settings:
   - Set the run command to: `NODE_ENV=production node dist/start.js`
   - Leave other settings at default values
3. Save settings and complete deployment

## 4. Troubleshooting

### TSX Loader Errors
If you see errors related to the tsx loader, ensure:
- You are using the correct run command (`NODE_ENV=production node dist/start.js`)
- You're running from the dist directory, not the source code

### MCP Tools Not Accessible
If the MCP tools are not accessible at the /mcp path:
- Verify that the prepare-for-deployment.js script ran correctly
- Check that the public/mcp directory exists and contains the necessary files
- Ensure that the build-for-deployment.js script copied these files to dist/public/mcp

### Database Connectivity Issues
- Ensure the DATABASE_URL environment variable is properly set in your deployment
- Verify that the PostgreSQL database is running and accessible

### Static Assets Not Loading
- Check that the Vite build completed successfully
- Verify paths in the HTML and CSS files

## 5. Environment Variables

Ensure these environment variables are properly set in your Replit deployment:

- `NODE_ENV`: Set to 'production'
- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption

## 6. Monitoring and Logging

- Replit provides built-in monitoring for your deployment
- Console logs are accessible through the Replit interface
- Consider adding structured logging for production

## 7. Post-Deployment Verification

After deployment, verify:

1. The main application loads properly at the root URL
2. The MCP tools are accessible at /mcp
3. Authentication and database operations work correctly
4. SSE connections establish properly

## 8. Scaling Considerations

While Replit provides excellent hosting for small to medium applications, consider:

- Implementing proper caching strategies
- Using connection pooling for database operations
- Adding rate limiting for public APIs

## Contact

If you encounter issues not covered by this guide, please create an issue in the repository or contact the development team.