# 🚀 Arkade Zaps Deployment Guide

Complete guide to deploy Nostrudel with Arkade support + Arkadeos wallet to the web.

---

## 🎯 Deployment Strategy

We'll deploy:
1. **Nostrudel Arkade** - Main client (`nostrudel-arkade.vercel.app`)
2. **Arkadeos Wallet** - Wallet with NWC (`arkadeos.vercel.app`)
3. **Landing Page** - Info page linking to both (`arkade-demo.vercel.app`)

---

## ⚙️ Option 1: Vercel (Recommended - FREE)

### Advantages
- ✅ Free hosting with generous bandwidth
- ✅ Automatic HTTPS (required for PWA)
- ✅ Global CDN (fast worldwide)
- ✅ Automatic deployments on git push
- ✅ Custom domain support (free)
- ✅ Perfect for PWAs

---

## 📦 Part 1: Deploy Nostrudel with Arkade

### Step 1: Build Nostrudel

```bash
cd C:\Users\peper\Documents\dev\nostrarkadezap\VersionNIPWallet\nostrudel

# Clean install (optional but recommended)
rm -rf node_modules
rm -rf dist
npm install --legacy-peer-deps

# Production build
npm run build
```

This creates a `dist/` folder with optimized static files.

### Step 2: Create GitHub Repository

```bash
# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Nostrudel with Arkade Zaps support - production ready"

# Create repository on GitHub
# Go to: https://github.com/new
# Name: "nostrudel-arkade"
# Public repository

# Add remote
git remote add origin https://github.com/YOUR-USERNAME/nostrudel-arkade.git

# Push
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com
2. Sign up with GitHub account
3. Click **"New Project"**
4. Import `YOUR-USERNAME/nostrudel-arkade`
5. Framework Preset: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Click **"Deploy"**

Vercel will:
- Build your project
- Deploy to `nostrudel-arkade.vercel.app` (or similar)
- Enable HTTPS automatically
- Configure PWA support

#### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd nostrudel
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: nostrudel-arkade
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist

# Production deployment
vercel --prod
```

### Step 4: Configure PWA (if needed)

Nostrudel should already have PWA configuration. Verify in `dist/`:
- ✅ `manifest.json` exists
- ✅ Service worker configured
- ✅ Icons in correct sizes

Test PWA on mobile:
1. Visit deployed URL
2. Browser should prompt "Add to Home Screen"
3. Install and test offline functionality

---

## 📱 Part 2: Deploy Arkadeos Wallet

### Step 1: Prepare Arkadeos Repository

```bash
cd C:\Users\peper\Documents\dev\nostrarkadezap\[YOUR-ARKADEOS-FOLDER]

# Build production version
npm run build
# (Or whatever build command your wallet uses)

# Create GitHub repo
git init
git add .
git commit -m "Arkadeos wallet with NIP-47 NWC support"

# Create on GitHub: arkadeos-wallet
git remote add origin https://github.com/YOUR-USERNAME/arkadeos-wallet.git
git push -u origin main
```

### Step 2: Deploy to Vercel

Same process as Nostrudel:
1. Go to Vercel dashboard
2. Click **"New Project"**
3. Import `arkadeos-wallet`
4. Configure build settings
5. Deploy

Result: `arkadeos-wallet.vercel.app`

---

## 🏠 Part 3: Create Landing Page

Create a simple landing page that explains the setup and links to both apps.

### Create Landing Page Repository

```bash
mkdir arkade-demo-landing
cd arkade-demo-landing

# Initialize
npm init -y
```

I'll create a simple HTML landing page in the next step.

---

## 🌍 Part 4: Custom Domain (Optional)

If you have your own domain (e.g., `arkadezaps.com`):

### On Vercel:

1. Go to Project Settings → Domains
2. Add custom domain: `nostrudel.arkadezaps.com`
3. Add DNS records (Vercel provides exact records):
   ```
   Type: CNAME
   Name: nostrudel
   Value: cname.vercel-dns.com
   ```
4. Repeat for wallet: `wallet.arkadezaps.com`
5. Landing page: `arkadezaps.com`

### Result:
- Main site: `https://arkadezaps.com`
- Nostrudel: `https://nostrudel.arkadezaps.com`
- Wallet: `https://wallet.arkadezaps.com`

---

## 🎨 Part 5: Branding Your Fork

### Update Nostrudel Branding

Edit these files before building:

**1. `index.html` - Update title**
```html
<title>Nostrudel Arkade - Nostr Client with Arkade Zaps</title>
```

**2. `public/manifest.json` - Update app name**
```json
{
  "name": "Nostrudel Arkade",
  "short_name": "Nostrudel Arkade",
  "description": "Nostr client with Arkade Zaps support"
}
```

**3. Add Arkade Badge in UI (optional)**

Create a subtle badge showing Arkade support. I can help with this if you want.

---

## ✅ Deployment Checklist

### Before Building
- [ ] Remove all `console.log` debug statements
- [ ] Test locally with `npm run dev`
- [ ] Verify Arkade zaps work end-to-end
- [ ] Update branding/titles if desired
- [ ] Check PWA manifest

### After Building
- [ ] Test `npm run build` completes without errors
- [ ] Verify `dist/` folder is created
- [ ] Check bundle size (should be reasonable)

### After Deployment
- [ ] Visit deployed URL and test
- [ ] Test PWA installation on mobile
- [ ] Test Arkade zap flow with live wallet
- [ ] Verify HTTPS is working
- [ ] Check service worker registration

### Promotion
- [ ] Create demo video/screenshots
- [ ] Post on Nostr about the deployment
- [ ] Share URL with Arkade community
- [ ] Gather feedback from testers

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)

1. Go to Project → Analytics
2. View page views, performance, traffic

### Custom Analytics (Optional)

Add Plausible or Simple Analytics for privacy-friendly tracking:

```html
<!-- In index.html -->
<script defer data-domain="nostrudel-arkade.vercel.app"
        src="https://plausible.io/js/script.js"></script>
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error: Dependencies**
```bash
# Make sure package.json has all dependencies
npm install --save-dev vite
```

**Error: Environment Variables**
- Check Vercel project settings
- Add required env vars (if any)

### PWA Not Installing

- Ensure HTTPS is enabled (Vercel does this automatically)
- Check manifest.json has all required fields
- Verify service worker is registered
- Test on actual mobile device (not emulator)

### Slow Build Times

- Vercel free tier should be sufficient
- If very slow, check bundle size
- Consider code splitting if needed

---

## 🔄 Continuous Deployment

Once set up, updates are automatic:

```bash
# Make changes
git add .
git commit -m "Update: improve Arkade UX"
git push origin main
```

Vercel automatically:
1. Detects push
2. Builds project
3. Deploys to production
4. Updates live site

Preview deployments for branches:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel creates preview URL: `nostrudel-arkade-git-feature-new-feature.vercel.app`

---

## 💡 Pro Tips

1. **Staging Environment**: Use Vercel preview deployments for testing
2. **Performance**: Check Lighthouse scores on deployed site
3. **Caching**: Vercel handles CDN caching automatically
4. **Security**: HTTPS is automatic, but audit dependencies
5. **SEO**: Add meta tags for social sharing

---

## 📱 Testing Your Deployment

### Desktop Testing
1. Visit URL in Chrome/Firefox
2. Open DevTools → Application → Service Workers
3. Verify service worker is active
4. Test offline mode

### Mobile Testing
1. Visit URL on mobile browser
2. Tap "Add to Home Screen"
3. Install as PWA
4. Test Arkade zap flow
5. Verify NWC connection works

---

## 🚀 Next Steps After Deployment

1. **Gather Feedback**: Share with Arkade community
2. **Monitor Usage**: Check Vercel analytics
3. **Iterate**: Fix bugs, improve UX
4. **Document**: Write user guide
5. **Promote**: Post on Nostr, Twitter, etc.
6. **Submit PRs**: Now with live demo link!

---

## 📞 Support

If you encounter issues:
- Vercel docs: https://vercel.com/docs
- Vite deployment: https://vitejs.dev/guide/static-deploy.html
- PWA guide: https://web.dev/progressive-web-apps/

---

**Ready to deploy?** Start with Step 1 of Part 1! 🚀
