# Quick Deployment Guide

To deploy this application and fix the tsx loader issues:

## Prepare for Deployment

1. Run the simple deployment script:
   ```
   node deploy-simple.js
   ```

## Deploy on Replit

1. Click the "Deploy" button in Replit
2. In the deployment settings:
   - Set the run command to: `npm run start`
   - Keep all other settings as default
3. Save the settings and complete the deployment

## Important Notes

- This approach uses the built-in npm scripts to avoid any tsx loader issues
- The build process ensures that MCP testing tools are properly organized and accessible at /mcp
- The main application will load as the default page, not the MCP testing tools

## Troubleshooting

If you encounter any issues with the deployment:
1. Make sure the build completed successfully
2. Verify that the DATABASE_URL environment variable is set correctly
3. Check that the MCP tools were properly moved to the /mcp directory

For a more detailed deployment guide with troubleshooting information, see: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)