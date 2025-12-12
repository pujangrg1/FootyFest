# Footy Fest - Production Deployment Guide

This guide provides step-by-step instructions for deploying the Footy Fest web application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher installed
- npm or yarn package manager
- Git repository set up
- Firebase project configured
- Domain name (optional but recommended)

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Tested the production build locally: `npm run build:web && npm run serve:web`
- [ ] Reviewed Firebase Security Rules in Firebase Console
- [ ] Set up environment variables (see below)
- [ ] Updated `app.json` with production URLs (if using custom domain)
- [ ] Removed or commented out development-only console.logs
- [ ] Tested all critical features in production build

## Environment Variables Setup

### Required Environment Variables

The following environment variables must be set in your hosting platform:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
NODE_ENV=production
```

### Setting Environment Variables

#### Vercel
1. Go to your project in Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable for Production environment
4. Redeploy after adding variables

#### Netlify
1. Go to your site in Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable
4. Redeploy after adding variables

#### AWS Amplify
1. Go to your app in AWS Amplify Console
2. Navigate to App settings > Environment variables
3. Add each variable
4. Redeploy after adding variables

#### Firebase Hosting
1. Use GitHub Actions with secrets (recommended)
2. Or set in CI/CD pipeline environment

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros:** Easiest setup, automatic SSL, great performance, free tier available

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Or use GitHub Integration:**
   - Connect your GitHub repository in Vercel dashboard
   - Push to `main` branch to auto-deploy
   - Set environment variables in Vercel dashboard

**Custom Domain:**
- Add domain in Vercel dashboard > Settings > Domains
- Update DNS records as instructed
- SSL certificate is automatically provisioned

### Option 2: Netlify

**Pros:** Good free tier, easy setup, automatic SSL

**Steps:**

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Initialize (first time only):**
   ```bash
   netlify init
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

**Custom Domain:**
- Add domain in Netlify dashboard > Site settings > Domain management
- Configure DNS
- SSL is automatically provisioned

### Option 3: Firebase Hosting

**Pros:** Integrated with Firebase, good for Firebase projects

**Steps:**

1. **Install Firebase CLI:**
   ```bash
   npm i -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize (first time only):**
   ```bash
   firebase init hosting
   ```
   - Select existing project
   - Set `web-build` as public directory
   - Configure as single-page app: Yes
   - Set up automatic builds: No (or Yes if using GitHub)

4. **Deploy:**
   ```bash
   npm run build:web
   firebase deploy --only hosting
   ```

**Custom Domain:**
- Go to Firebase Console > Hosting
- Click "Add custom domain"
- Follow DNS setup instructions

### Option 4: AWS Amplify

**Pros:** AWS integration, scalable, good for enterprise

**Steps:**

1. **Install AWS CLI:**
   ```bash
   brew install awscli  # Mac
   # Or download from AWS website
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Install Amplify CLI:**
   ```bash
   npm i -g @aws-amplify/cli
   ```

4. **Initialize:**
   ```bash
   amplify init
   ```

5. **Add hosting:**
   ```bash
   amplify add hosting
   ```

6. **Deploy:**
   ```bash
   amplify publish
   ```

**Custom Domain:**
- Configure in AWS Amplify Console > Domain management

### Option 5: GitHub Pages

**Pros:** Free, simple for static sites

**Steps:**

1. **Push code to GitHub**

2. **GitHub Actions will automatically deploy** (if workflow is set up)
   - See `.github/workflows/deploy-production.yml`
   - Requires GitHub Secrets to be configured

3. **Enable GitHub Pages:**
   - Go to repository Settings > Pages
   - Select source: GitHub Actions

## CI/CD Setup

### GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-production.yml`) that:

- Builds the app on push to `main` branch
- Deploys to Vercel, Netlify, or Firebase (based on configured secrets)
- Can be triggered manually via `workflow_dispatch`

**Required GitHub Secrets:**

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for Vercel)
- `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (for Netlify)
- `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID` (for Firebase)
- All `REACT_APP_FIREBASE_*` environment variables

## Post-Deployment

### Verification Steps

1. **Test the production URL:**
   - Verify the app loads correctly
   - Test authentication flow
   - Test critical features

2. **Check browser console:**
   - Look for any errors
   - Verify Firebase connection

3. **Test on multiple devices:**
   - Desktop browsers (Chrome, Firefox, Safari, Edge)
   - Mobile devices
   - Different screen sizes

4. **Verify real-time features:**
   - Test match updates
   - Test live timer
   - Test notifications

### Monitoring

- **Error Tracking:** Errors are logged via the error tracking utility
- **Performance:** Monitor using browser DevTools > Network tab
- **Analytics:** Set up Google Analytics or Firebase Analytics (optional)

### SSL Certificate

Most hosting platforms automatically provision SSL certificates:
- **Vercel:** Automatic via Let's Encrypt
- **Netlify:** Automatic via Let's Encrypt
- **Firebase:** Automatic via Google
- **AWS:** Automatic via AWS Certificate Manager

Wait 5-15 minutes after adding domain for SSL to be provisioned.

## Troubleshooting

### Build Fails

**Issue:** `npm run build:web` fails

**Solutions:**
- Clear cache: `rm -rf node_modules .expo web-build && npm install --legacy-peer-deps`
- Check Node.js version: Should be 18+
- Verify all dependencies are installed

### Environment Variables Not Working

**Issue:** Firebase connection fails in production

**Solutions:**
- Verify environment variables are set in hosting platform
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check hosting platform logs for errors

### Routing Issues

**Issue:** Direct URL access returns 404

**Solutions:**
- Verify rewrite rules are configured (already set in `vercel.json`, `netlify.toml`, `firebase.json`)
- Check that SPA routing is enabled
- Clear browser cache

### Firebase Connection Errors

**Issue:** Cannot connect to Firebase in production

**Solutions:**
- Verify Firebase config environment variables
- Check Firebase Security Rules allow access
- Verify Firebase project is active
- Check browser console for specific error messages

### Performance Issues

**Issue:** App loads slowly

**Solutions:**
- Check bundle size: `npm run build:web` and review output
- Enable compression in hosting platform
- Verify CDN is enabled (automatic on most platforms)
- Check image sizes and formats

### CORS Errors

**Issue:** CORS errors when accessing Firebase

**Solutions:**
- Verify Firebase project settings allow your domain
- Check Firebase Security Rules
- Verify environment variables are correct

## Support

For issues or questions:
1. Check this deployment guide
2. Review Firebase documentation
3. Check hosting platform documentation
4. Review application logs

## Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure analytics (optional)
3. Set up staging environment for testing
4. Plan for scaling if needed
5. Collect user feedback


