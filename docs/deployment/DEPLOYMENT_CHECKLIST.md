# Vercel Deployment Checklist

Use this checklist to ensure your deployment is successful.

## Pre-Deployment

- [ ] Code is pushed to Git repository (GitHub/GitLab/Bitbucket)
- [ ] All tests pass locally (`npm run build` succeeds)
- [ ] No TypeScript errors
- [ ] No ESLint errors (or acceptable warnings)
- [ ] Environment variables documented

## Environment Variables Setup

### Required Variables
- [ ] `NEXT_PUBLIC_MOONDREAM_API_KEY` - Your Moondream API key
- [ ] `NEXT_PUBLIC_MOONDREAM_API_URL` - Moondream API endpoint (optional, has default)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional Variables
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - For push notifications (if using)
- [ ] `NEXT_PUBLIC_TURN_URL` - Custom WebRTC TURN server (if using)
- [ ] `NEXT_PUBLIC_TURN_USERNAME` - TURN server username (if using)
- [ ] `NEXT_PUBLIC_TURN_CREDENTIAL` - TURN server credential (if using)

## Vercel Configuration

- [ ] Project imported from Git repository
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (auto-detected)
- [ ] Node.js version: 18.x or higher
- [ ] All environment variables added for Production, Preview, and Development

## Post-Deployment

- [ ] Build completed successfully
- [ ] Deployment URL accessible
- [ ] No console errors in browser
- [ ] Homepage loads correctly
- [ ] Authentication works (if enabled)
- [ ] Camera access works (requires HTTPS - Vercel provides this)
- [ ] API endpoints respond correctly
- [ ] Supabase redirect URLs updated

## Supabase Configuration

- [ ] Redirect URLs added in Supabase Dashboard:
  - `https://your-project.vercel.app/auth/callback`
  - `https://your-project.vercel.app/callback`
- [ ] Site URL set to: `https://your-project.vercel.app`
- [ ] Database migrations applied (if needed)

## Testing

- [ ] Test on desktop browser (Chrome, Firefox, Safari)
- [ ] Test on mobile browser
- [ ] Test camera functionality
- [ ] Test authentication flow
- [ ] Test API calls
- [ ] Test error handling
- [ ] Verify HTTPS is working (required for camera)

## Performance

- [ ] Page load time acceptable
- [ ] Images optimized
- [ ] No unnecessary network requests
- [ ] Lighthouse score acceptable (optional)

## Security

- [ ] Environment variables not exposed in client code
- [ ] API keys secured
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS configured correctly (if needed)

## Monitoring

- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Logs accessible in Vercel dashboard

## Custom Domain (Optional)

- [ ] Custom domain added in Vercel
- [ ] DNS configured correctly
- [ ] SSL certificate issued (automatic)
- [ ] Supabase redirect URLs updated with custom domain

## Troubleshooting

If deployment fails:

1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for TypeScript/ESLint errors
5. Verify Node.js version compatibility
6. Check API endpoint availability
7. Review error messages in deployment logs

## Quick Commands

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Start production server locally
npm run build && npm start
```

