# Dog Care Manager Deployment Guide

This guide provides instructions for deploying the Dog Care Manager application on Replit, with solutions for the tsx loader issues in Node.js v20.18.1.

## Option 1: Simple Approach (Recommended)

This approach utilizes the built-in npm scripts in package.json and ensures MCP testing tools are properly organized.

### Step 1: Prepare for Deployment
```
node deploy-simple.js
```

This script:
1. Organizes MCP testing tools into the /mcp directory
2. Builds the application using the existing npm scripts
3. Ensures MCP tools are copied to the dist directory

### Step 2: Deploy on Replit
1. Click the "Deploy" button in Replit
2. Set the run command to: `npm run start`
3. Complete the deployment process

### Benefits
- Uses existing build and start scripts in package.json
- Completely avoids tsx in production
- Simple and direct approach

## Option 2: Custom Start Script Approach

If Option 1 doesn't work, this approach creates a custom start script that avoids the tsx loader.

### Step 1: Prepare for Deployment
```
node deploy.js
```

This script:
1. Organizes MCP testing tools
2. Builds the frontend with Vite
3. Bundles the backend with esbuild
4. Creates a custom start script in the dist directory

### Step 2: Deploy on Replit
1. Click the "Deploy" button in Replit
2. Set the run command to: `NODE_ENV=production node dist/start.js`
3. Complete the deployment process

## Troubleshooting

If you encounter deployment issues:

### tsx Loader Errors
- Ensure you're using one of the run commands mentioned above, not one that uses tsx directly
- Verify that the build completed successfully before deployment

### MCP Tools Not Accessible
If the MCP tools are not accessible at the /mcp path:
- Check that the public/mcp and dist/public/mcp directories exist and contain the necessary files
- Verify the deployment script ran successfully

### PostgreSQL Database Connection
- Make sure the DATABASE_URL environment variable is set correctly in your Replit deployment
- Verify the database is running and accessible

## Test Accounts

To test the deployed application, use these accounts:

- Admin user: 
  - Email: admin@pawperfect.com
  - Password: password123

- Customer user:
  - Email: customer@example.com
  - Password: password123

## MCP Testing Tools

After deployment, MCP testing tools will be accessible at:
- https://your-replit-app.replit.app/mcp/

This directory contains:
1. MCP documentation
2. Server-Sent Events (SSE) testing client
3. Links to all available MCP endpoints