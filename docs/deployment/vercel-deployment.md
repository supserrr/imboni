# Vercel Deployment Guide

This guide provides comprehensive instructions for deploying the Imboni app to Vercel.

## 🚀 Quick Start

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

## 📋 Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel account ([sign up here](https://vercel.com))
- All required API keys and credentials

## ⚙️ Required Environment Variables

### Core Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_MOONDREAM_API_KEY` | ✅ Yes | Your Moondream API key | `sk-...` |
| `NEXT_PUBLIC_MOONDREAM_API_URL` | ❌ No | Moondream API endpoint (defaults to `https://api.moondream.ai/v1`) | `https://api.moondream.ai/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anonymous key | `eyJ...` |

### Optional Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | ❌ No | ElevenLabs API key for text-to-speech |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ❌ No | VAPID public key for push notifications |
| `NEXT_PUBLIC_TURN_URL` | ❌ No | Custom WebRTC TURN server URL |
| `NEXT_PUBLIC_TURN_USERNAME` | ❌ No | TURN server username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | ❌ No | TURN server credential |

## 📝 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** or **"Import Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

1. In the project setup, navigate to **"Environment Variables"**
2. Add each required variable:
   - Click **"Add Another"**
   - Enter variable name and value
   - Select environments: **Production**, **Preview**, and **Development**
3. Click **"Add"** for each variable

> **Important:** Set environment variables for all environments where you want them available (Production, Preview, Development).

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your app will be live automatically at `https://your-project.vercel.app`

### Step 5: Verify Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Check the browser console for errors
3. Test core functionality:
   - Camera access
   - Authentication (if enabled)
   - API calls
   - Text-to-speech

## 🔧 Build Configuration

Vercel automatically detects Next.js and uses these settings:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x (auto-detected)

No additional configuration is needed unless you have custom requirements.

## 🗄️ Supabase Configuration

### Update Redirect URLs

After deployment, update your Supabase project settings:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel URLs to **"Redirect URLs"**:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/callback`
3. Set **"Site URL"** to: `https://your-project.vercel.app`

### Database Migrations

If you haven't run migrations yet:

**Option 1: Using Supabase Dashboard**
1. Go to **SQL Editor** in Supabase Dashboard
2. Run the migration from `supabase/migrations/001_create_analysis_history.sql`

**Option 2: Using Supabase CLI**
```bash
supabase db push
```

## 🐛 Troubleshooting

### Build Errors

**Error: "Missing Supabase environment variables"**
- **Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings

**Error: "Missing Moondream API key"**
- **Solution**: Add `NEXT_PUBLIC_MOONDREAM_API_KEY` in Vercel project settings

**Error: TypeScript errors**
- **Solution**: Fix TypeScript errors locally first, then push:
  ```bash
  npx tsc --noEmit
  ```

**Error: Build timeout**
- **Solution**: Check build logs for specific errors, ensure all dependencies are properly installed

### Runtime Errors

**Camera not working**
- Ensure you're using HTTPS (Vercel provides this automatically)
- Check browser permissions
- Test in a modern browser (Chrome, Firefox, Safari)
- Verify camera access is granted in browser settings

**Authentication redirects failing**
- Update Supabase redirect URLs to include your Vercel domain
- Check that environment variables are set correctly
- Verify Supabase project settings match your deployment URL

**API calls failing**
- Verify API keys are correct in Vercel environment variables
- Check network tab in browser DevTools for error messages
- Ensure CORS is configured correctly on API side
- Verify API endpoints are accessible

**Text-to-speech not working**
- Check if `ELEVENLABS_API_KEY` is set (if using ElevenLabs)
- Verify API key is valid and has sufficient credits
- Check browser console for errors

## 🔄 Continuous Deployment

Vercel automatically deploys on every push:

- **Production**: Deploys from `main` branch (or your default branch)
- **Preview**: Deploys from other branches and pull requests
- **Development**: Deploys from development branches (if configured)

### Branch Protection

To prevent automatic production deployments:

1. Go to **Project Settings** → **Git**
2. Configure branch protection rules
3. Require manual approval for production deployments

## ⚡ Performance Optimization

Vercel automatically optimizes Next.js apps:

- **Edge Network**: Global CDN for fast content delivery
- **Automatic HTTPS**: SSL certificates managed automatically
- **Image Optimization**: Next.js Image component optimized
- **Automatic Compression**: Gzip/Brotli compression enabled
- **Edge Functions**: Serverless functions at the edge

No additional configuration needed for basic optimization.

## 📊 Monitoring

Vercel provides built-in monitoring:

1. Go to your project dashboard
2. View **Deployment Logs** for build and runtime information
3. Check **Function Logs** for serverless function execution
4. Monitor **Analytics** (if enabled) for usage statistics

### Enable Analytics

1. Go to **Project Settings** → **Analytics**
2. Enable Vercel Analytics
3. View metrics in the dashboard

## 🌐 Custom Domain (Optional)

### Adding a Custom Domain

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. SSL certificate is issued automatically

### Updating Supabase Redirect URLs

After adding a custom domain, update Supabase:

1. Add new redirect URLs with your custom domain
2. Update Site URL to your custom domain
3. Test authentication flow

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](../README.md)

## ✅ Deployment Checklist

For a complete checklist, see [deployment-checklist.md](./deployment-checklist.md).

---

**Need Help?** Check the [main README](../README.md) or open an issue in the repository.
