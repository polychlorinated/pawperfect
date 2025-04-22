# How to Deploy PawPerfect on Replit

Follow these step-by-step instructions to successfully deploy your PawPerfect application on Replit.

## Before Deployment

1. Make sure your project has been built:
   ```
   npm run build
   ```

## Deployment Steps

### Option 1: HTTP Service Deployment (Recommended)

This method deploys the frontend as a static site with a lightweight Express server.

1. Click the **Run** button in Replit to ensure your application builds successfully
2. Click the **Deploy** button in the top-right corner of the Replit interface
3. In the deployment settings:
   - Set the deployment type to: **HTTP Service**
   - Set the run command to: `node replit-deploy-server.js`
   - Leave all other settings at their defaults
4. Click **Deploy**

### Option 2: Static Deployment

If the HTTP Service deployment doesn't work, try a static-only deployment:

1. Click the **Deploy** button in Replit
2. In the deployment settings:
   - Set the deployment type to: **Static**
   - Set the output directory to: `dist/public`
   - Leave all other settings at their defaults
3. Click **Deploy**

## Troubleshooting Deployment Issues

If your deployment shows a 502 Bad Gateway error:

1. **Check server logs**: Look for errors in the deployment logs
2. **Verify PORT usage**: Make sure the server is using the PORT environment variable
3. **Check memory usage**: Replit has limits; make sure your app isn't exceeding them
4. **Try clearing cache**: Sometimes deployment cache can cause issues

## Important Notes

- The static deployment only includes the frontend; backend functionality will not work
- If you need full functionality, use the HTTP Service deployment option
- For database functionality, ensure your DATABASE_URL environment variable is set correctly
- Deployment can take a few minutes to propagate changes

## Testing Your Deployment

After deployment, test your application by:

1. Visiting the deployed URL
2. Checking the `/health` endpoint to verify the server is running
3. Verifying that the UI loads correctly

If you continue having issues, please contact Replit support.