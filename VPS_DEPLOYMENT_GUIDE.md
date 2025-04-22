# PawPerfect VPS Deployment Guide

This guide provides instructions for deploying PawPerfect on your own VPS (Virtual Private Server).

## Prerequisites

- Node.js 18+ installed on your server
- PostgreSQL database installed and running
- Git for cloning the repository
- A domain name (optional, but recommended)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/pawperfect.git
cd pawperfect
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/pawperfect

# Server Configuration
PORT=3000
NODE_ENV=production

# MCP Configuration
MCP_ENABLE_SSE=true
MCP_ENABLE_WEBSOCKETS=true

# Session Secret (generate a strong random string)
SESSION_SECRET=your_secret_key_here
```

> ⚠️ Make sure to replace the values with your actual database credentials and generate a secure session secret.

## Step 4: Set Up the Database

```bash
# Create the database if it doesn't exist
psql -U postgres -c "CREATE DATABASE pawperfect;"

# Push the schema to the database
npm run db:push
```

## Step 5: Build the Application

```bash
npm run build
```

This will create a `dist` directory with the compiled application.

## Step 6: Start the Application

For development/testing:
```bash
npm run start
```

For production with PM2 (recommended):
```bash
npm install -g pm2
pm2 start dist/index.js --name pawperfect
pm2 save
pm2 startup
```

## Step 7: Configure Nginx (Optional but Recommended)

If you want to use Nginx as a reverse proxy (recommended for production):

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/pawperfect
```

3. Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/pawperfect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Set up SSL with Certbot (optional but recommended):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Troubleshooting

- **Database Connection Issues**: Verify your DATABASE_URL is correct and that PostgreSQL is running.
- **Permission Issues**: Make sure your user has permission to access the required directories.
- **Port Already in Use**: If port 3000 is already in use, change the PORT in your .env file.
- **WebSockets Not Working**: Check if your proxy server (if used) is properly configured for WebSocket connections.

## Updating the Application

To update the application:

```bash
git pull
npm install
npm run build
pm2 restart pawperfect
```