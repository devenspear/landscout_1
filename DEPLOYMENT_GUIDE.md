# Vercel CLI Deployment Guide

This guide documents the automated deployment process using Vercel CLI with error handling that was successfully implemented for LandScout.

## Key Benefits

- **Automatic Error Detection**: CLI shows real-time build errors with line numbers
- **Iterative Fixes**: Can fix TypeScript/build errors and redeploy immediately  
- **Database Integration**: Handles database schema pushes during build process
- **Environment Variables**: Easy management via CLI commands
- **Build Logs**: Detailed logging for debugging deployment issues

## Setup Process

### 1. Project Linking
```bash
# Link existing project
vercel link --project=project-name --yes

# Or create new project
vercel --prod
```

### 2. Environment Variables
```bash
# Add environment variables
echo "value" | vercel env add VARIABLE_NAME production

# List variables
vercel env ls

# Remove variables  
vercel env rm VARIABLE_NAME production
```

### 3. Database Setup (PostgreSQL)
```bash
# For Neon PostgreSQL via Vercel dashboard:
# 1. Go to project Storage tab
# 2. Create Database → Select Postgres → Name it
# 3. Auto-configures DATABASE_URL

# Push schema to production
DATABASE_URL="connection-string" npx prisma db push

# Seed production database
DATABASE_URL="connection-string" npx prisma db seed
```

### 4. Deployment with Error Handling

```bash
# Deploy with automatic error detection
vercel --prod

# If build fails, check logs
vercel inspect deployment-url --logs

# Fix errors and redeploy immediately
vercel --prod
```

## Common TypeScript/Build Fixes

### JSON Field Issues
Database string fields expecting JSON need serialization:
```typescript
// ❌ Wrong - Arrays/Objects to string fields
photos: candidate.photos,
topReasons: fitScore.topReasons,

// ✅ Correct - Serialize JSON fields  
photos: candidate.photos ? JSON.stringify(candidate.photos) : null,
topReasons: JSON.stringify(fitScore.topReasons),
```

### Prisma Schema Updates
```typescript
// Update schema for PostgreSQL
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")  
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

### Middleware Configuration
```typescript
// Use current Clerk middleware API
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
```

## Build Process Flow

1. **vercel --prod** → Uploads code
2. **npm install** → Installs dependencies  
3. **prisma generate** → Generates Prisma client
4. **prisma db push** → Syncs database schema
5. **next build** → Builds Next.js app
6. **Type checking** → Validates TypeScript
7. **Deploy** → Makes live

## Integration with GitHub

For continuous deployment:
1. Connect Vercel project to GitHub repository
2. Every push to main branch triggers deployment
3. Pull requests get preview deployments
4. Environment variables persist across deployments

## Error Resolution Strategy

1. **Read build logs carefully** - Exact error location provided
2. **Fix TypeScript errors first** - Build won't complete with TS errors
3. **Test database connections** - Ensure proper connection strings
4. **Verify environment variables** - Check all required vars are set
5. **Redeploy immediately** - No need to wait, iterate quickly

## Project Structure for Vercel

```
project/
├── app/                 # Next.js app directory
├── lib/                 # Shared utilities  
├── components/          # React components
├── prisma/             # Database schema & migrations
├── public/             # Static assets
├── .env.local          # Local environment variables
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies & scripts
```

## vercel.json Configuration

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/admin/sources/scan", 
      "schedule": "0 2 * * 0"
    }
  ]
}
```

This deployment process dramatically reduces deployment time and debugging effort through immediate error feedback and iterative fixes.