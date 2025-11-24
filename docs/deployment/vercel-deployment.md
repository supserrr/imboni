# Vercel Deployment Guide

This guide provides detailed instructions for deploying the Imboni app to Vercel.

## Quick Start

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in Vercel
3. Set environment variables
4. Deploy

## Required Environment Variables

### Core Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_MOONDREAM_API_KEY` | Yes | Your Moondream API key | `sk-...` |
| `NEXT_PUBLIC_MOONDREAM_API_URL` | No | Moondream API endpoint (defaults to `https://api.moondream.ai/v1`) | `https://api.moondream.ai/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key | `eyJ...` |

### Optional Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | For push notifications |
| `NEXT_PUBLIC_TURN_URL` | No | Custom WebRTC TURN server URL |
| `NEXT_PUBLIC_TURN_USERNAME` | No | TURN server username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | No | TURN server credential |

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to a Git repository:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

1. In the project setup, go to "Environment Variables"
2. Add each required variable:
   - Click "Add Another"
   - Enter variable name and value
   - Select environments (Production, Preview, Development)
3. Click "Add" for each variable

**Important:** You must set environment variables for all environments where you want them available.

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-5 minutes)
3. Your app will be live automatically

### 5. Verify Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Check the browser console for errors
3. Test core functionality:
   - Camera access
   - Authentication (if enabled)
   - API calls

## Build Configuration

Vercel automatically detects Next.js and uses these settings:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x (auto-detected)

No additional configuration is needed unless you have custom requirements.

## Supabase Configuration

### Update Redirect URLs

After deployment, update your Supabase project settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URLs to "Redirect URLs":
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/callback`
3. Add to "Site URL": `https://your-project.vercel.app`

### Database Migrations

If you haven't run migrations yet:

1. Use Supabase Dashboard SQL Editor, or
2. Use Supabase CLI:
   ```bash
   supabase db push
   ```

## Troubleshooting

### Build Errors

**Error: "Missing Supabase environment variables"**
- Solution: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Error: "Missing Moondream API key"**
- Solution: Add `NEXT_PUBLIC_MOONDREAM_API_KEY`

**Error: TypeScript errors**
- Solution: Fix TypeScript errors locally first, then push

### Runtime Errors

**Camera not working**
- Ensure you're using HTTPS (Vercel provides this)
- Check browser permissions
- Test in a modern browser (Chrome, Firefox, Safari)

**Authentication redirects failing**
- Update Supabase redirect URLs to include your Vercel domain
- Check that environment variables are set correctly

**API calls failing**
- Verify API keys are correct
- Check network tab in browser DevTools
- Ensure CORS is configured correctly on API side

## Continuous Deployment

Vercel automatically deploys on every push to your main branch:

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches and pull requests
- **Development**: Deploys from development branches (if configured)

## Performance Optimization

Vercel automatically optimizes Next.js apps:

- Edge Network: Global CDN
- Automatic HTTPS
- Image Optimization
- Automatic Compression
- Edge Functions (if using)

No additional configuration needed for basic optimization.

## Monitoring

Vercel provides built-in monitoring:

1. Go to your project dashboard
2. View deployment logs
3. Check function logs
4. Monitor analytics (if enabled)

## Support

For issues specific to:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **This Project**: Check the main README.md

