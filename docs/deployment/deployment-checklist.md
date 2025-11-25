# Deployment Checklist

Use this checklist to ensure a successful deployment of the Imboni app.

## ✅ Pre-Deployment

### Code Quality

- [ ] Code is pushed to Git repository (GitHub/GitLab/Bitbucket)
- [ ] All tests pass locally (`npm run build` succeeds)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (or acceptable warnings)
- [ ] Code is reviewed and approved
- [ ] Environment variables documented

### Local Testing

- [ ] Application runs successfully in development mode
- [ ] Production build completes without errors (`npm run build`)
- [ ] Production server starts correctly (`npm start`)
- [ ] All features tested locally
- [ ] No console errors or warnings

## 🔐 Environment Variables Setup

### Required Variables

- [ ] `NEXT_PUBLIC_MOONDREAM_API_KEY` - Moondream API key configured
- [ ] `NEXT_PUBLIC_MOONDREAM_API_URL` - Moondream API endpoint (optional, has default)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key configured

### Optional Variables

- [ ] `ELEVENLABS_API_KEY` - ElevenLabs API key (if using TTS)
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - For push notifications (if using)
- [ ] `NEXT_PUBLIC_TURN_URL` - Custom WebRTC TURN server (if using)
- [ ] `NEXT_PUBLIC_TURN_USERNAME` - TURN server username (if using)
- [ ] `NEXT_PUBLIC_TURN_CREDENTIAL` - TURN server credential (if using)

### Environment Variable Configuration

- [ ] All variables added for **Production** environment
- [ ] All variables added for **Preview** environment
- [ ] All variables added for **Development** environment (if needed)
- [ ] Variable values verified and correct
- [ ] No sensitive data committed to repository

## 🚀 Vercel Configuration

### Project Setup

- [ ] Project imported from Git repository
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (auto-detected)
- [ ] Install command: `npm install` (default)
- [ ] Node.js version: 18.x or higher

### Build Settings

- [ ] Build command verified
- [ ] Environment variables configured for all environments
- [ ] Root directory set correctly (if not root)
- [ ] Ignored build step: None (unless needed)

## 🗄️ Supabase Configuration

### Authentication Setup

- [ ] Redirect URLs added in Supabase Dashboard:
  - `https://your-project.vercel.app/auth/callback`
  - `https://your-project.vercel.app/callback`
- [ ] Site URL set to: `https://your-project.vercel.app`
- [ ] Email templates configured (if using email auth)
- [ ] OAuth providers configured (if using)

### Database Setup

- [ ] Database migrations applied
- [ ] `analysis_history` table created (if using)
- [ ] Row Level Security (RLS) policies configured
- [ ] Database backups enabled (recommended)

## 🚢 Post-Deployment

### Initial Verification

- [ ] Build completed successfully
- [ ] Deployment URL accessible
- [ ] No build errors in Vercel logs
- [ ] No runtime errors in browser console
- [ ] Homepage loads correctly

### Functionality Testing

- [ ] Authentication works (sign up, login, logout)
- [ ] Camera access works (requires HTTPS - Vercel provides this)
- [ ] Vision analysis API calls work
- [ ] Text-to-speech works (if enabled)
- [ ] Settings page functional
- [ ] Navigation works correctly
- [ ] All routes accessible

### API Endpoints

- [ ] API routes respond correctly
- [ ] Error handling works
- [ ] API authentication (if required) works
- [ ] Rate limiting configured (if needed)

## 🧪 Testing

### Browser Testing

- [ ] Test on **Chrome** (desktop)
- [ ] Test on **Firefox** (desktop)
- [ ] Test on **Safari** (desktop)
- [ ] Test on **Chrome** (mobile)
- [ ] Test on **Safari** (mobile/iOS)

### Feature Testing

- [ ] Camera functionality works
- [ ] Vision analysis works
- [ ] Text-to-speech works
- [ ] Authentication flow works
- [ ] Settings save correctly
- [ ] History saves correctly (if authenticated)
- [ ] Error handling works
- [ ] Loading states display correctly

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG standards

## ⚡ Performance

### Metrics

- [ ] Page load time acceptable (< 3 seconds)
- [ ] Images optimized
- [ ] No unnecessary network requests
- [ ] Bundle size reasonable
- [ ] Lighthouse score acceptable (optional)

### Optimization

- [ ] Images optimized (Next.js Image component)
- [ ] Code splitting working
- [ ] Lazy loading implemented where appropriate
- [ ] Caching configured correctly

## 🔒 Security

### Security Checklist

- [ ] Environment variables not exposed in client code
- [ ] API keys secured (server-side only where possible)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS configured correctly (if needed)
- [ ] Input validation implemented
- [ ] SQL injection prevention (if using raw queries)
- [ ] XSS prevention measures in place

### Supabase Security

- [ ] Row Level Security (RLS) enabled
- [ ] RLS policies tested
- [ ] Service role key not exposed
- [ ] Anonymous key used correctly

## 📊 Monitoring

### Analytics & Logging

- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Logs accessible in Vercel dashboard
- [ ] Performance monitoring configured

### Alerts

- [ ] Deployment notifications configured
- [ ] Error alerts set up (if using error tracking)
- [ ] Uptime monitoring configured (optional)

## 🌐 Custom Domain (Optional)

### Domain Configuration

- [ ] Custom domain added in Vercel
- [ ] DNS configured correctly
- [ ] SSL certificate issued (automatic)
- [ ] Domain verified

### Post-Domain Setup

- [ ] Supabase redirect URLs updated with custom domain
- [ ] Site URL updated in Supabase
- [ ] All functionality tested with custom domain
- [ ] HTTPS working correctly

## 🔄 Continuous Deployment

### Git Integration

- [ ] Automatic deployments enabled
- [ ] Branch protection configured (if needed)
- [ ] Preview deployments working
- [ ] Production deployments working

## 📝 Documentation

### Documentation Updates

- [ ] README updated with deployment URL
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide updated

## 🐛 Troubleshooting Commands

If deployment fails, use these commands to diagnose:

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

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](../README.md)
- [Deployment Guide](./vercel-deployment.md)

---

**Note:** This checklist should be completed for each deployment to ensure consistency and reliability.
