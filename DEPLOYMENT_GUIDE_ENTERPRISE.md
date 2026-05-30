# 🚀 ReyaBet Enterprise - Complete Deployment Guide

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Setup (Supabase)
- [ ] Supabase project created
- [ ] Database schema applied (`schema_enterprise.sql`)
- [ ] All 11 tables created successfully
- [ ] Default data inserted (site_content, role_badges)
- [ ] RLS disabled for development (or configured for production)

### 2. Environment Variables
- [ ] `.env` file configured with:
  - `SUPABASE_URL`
  - `SUPABASE_KEY` (anon key)
  - `SUPABASE_SERVICE_KEY` (optional, for admin operations)

### 3. Code Verification
- [ ] `npm run build` successful
- [ ] No TypeScript errors
- [ ] All components imported correctly
- [ ] API endpoints tested locally

---

## 📦 STEP 1: DATABASE SETUP

### Apply Enterprise Schema

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor

2. **Run Schema Script**
   ```sql
   -- Copy entire contents of schema_enterprise.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```

3. **Verify Tables Created**
   - Go to Table Editor
   - Confirm these tables exist:
     - ✅ users
     - ✅ inventory
     - ✅ game_configs
     - ✅ chat_messages
     - ✅ chat_bans
     - ✅ online_sessions
     - ✅ site_content
     - ✅ news_posts
     - ✅ media_library
     - ✅ analytics_events
     - ✅ role_badges

4. **Check Default Data**
   ```sql
   -- Verify site content
   SELECT * FROM site_content;
   
   -- Verify role badges
   SELECT * FROM role_badges;
   ```

---

## 🔐 STEP 2: ENVIRONMENT CONFIGURATION

### Create `.env` File

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Optional: Node Environment
NODE_ENV=production
```

### Get Supabase Keys

1. Go to Supabase Dashboard
2. Navigate to Settings > API
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` (keep secret!)

---

## 🏗️ STEP 3: BUILD PROJECT

### Local Build Test

```bash
# Install dependencies
npm install

# Build project
npm run build

# Expected output:
# ✓ 1690 modules transformed
# ✓ built in ~60s
```

### Verify Build Output

```bash
# Check dist folder
ls dist/

# Should contain:
# - index.html
# - assets/index-*.css
# - assets/index-*.js
```

---

## 🚀 STEP 4: DEPLOY TO VERCEL

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables when prompted
```

### Option B: Vercel Dashboard

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the project

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Settings > Environment Variables
   - Add:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `SUPABASE_SERVICE_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live URL

---

## 🔧 STEP 5: POST-DEPLOYMENT VERIFICATION

### Test Core Features

1. **Authentication**
   - [ ] Register new account
   - [ ] Login with credentials
   - [ ] Logout and re-login

2. **Games**
   - [ ] Case Opening loads all 15 chests
   - [ ] Wheel Spinner works
   - [ ] Crash Game functions
   - [ ] Items save to inventory

3. **Enterprise Features**
   - [ ] Global Chat displays messages
   - [ ] Can send chat messages
   - [ ] Online Players list shows users
   - [ ] Player activities display correctly

4. **Admin Features** (if staff account)
   - [ ] Admin Dashboard accessible
   - [ ] Can view all users
   - [ ] Can edit user balances
   - [ ] Can view inventories
   - [ ] Can edit game configs

### Check API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Expected response:
# {"status":"ok","database":"supabase","supabaseUrl":"..."}

# Chat messages (public)
curl https://your-app.vercel.app/api/chat/messages

# Expected response:
# {"messages":[...]}

# Online players (public)
curl https://your-app.vercel.app/api/users/online

# Expected response:
# {"players":[...],"onlineCount":7}
```

---

## 🐛 TROUBLESHOOTING

### Issue: "500 Internal Server Error"

**Cause:** Environment variables not set

**Solution:**
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add all required variables
3. Redeploy

### Issue: "Chests not loading"

**Cause:** API route not accessible or CORS issue

**Solution:**
1. Check `/api/games/config/cases` endpoint
2. Verify CORS headers in `api/index.ts`
3. Check browser console for errors

### Issue: "Chat not working"

**Cause:** Database table missing or auth token invalid

**Solution:**
1. Verify `chat_messages` table exists in Supabase
2. Check browser localStorage for `auth_token`
3. Try logout and login again

### Issue: "Online players not showing"

**Cause:** API endpoint returning wrong format

**Solution:**
1. Check `/api/users/online` endpoint
2. Verify response has `players` array
3. Check browser console for errors

### Issue: "Build fails on Vercel"

**Cause:** TypeScript errors or missing dependencies

**Solution:**
1. Run `npm run build` locally first
2. Fix any TypeScript errors
3. Commit and push changes
4. Redeploy

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks
- [ ] Check Vercel deployment status
- [ ] Monitor Supabase database usage
- [ ] Review error logs in Vercel
- [ ] Check user registrations

### Weekly Maintenance
- [ ] Review chat messages for spam
- [ ] Check inventory data integrity
- [ ] Monitor game config changes
- [ ] Review analytics (when implemented)

### Monthly Tasks
- [ ] Database backup (Supabase auto-backups)
- [ ] Review user feedback
- [ ] Update dependencies
- [ ] Performance optimization

---

## 🔒 SECURITY BEST PRACTICES

### Production Checklist
- [ ] Use service role key only in server-side code
- [ ] Never expose service role key in client
- [ ] Enable RLS policies in production
- [ ] Use HTTPS only (Vercel default)
- [ ] Implement rate limiting for API
- [ ] Add CAPTCHA for registration (optional)
- [ ] Monitor for suspicious activity

### Environment Variables Security
- ✅ Store in Vercel environment variables (encrypted)
- ✅ Never commit `.env` to Git
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically

---

## 📈 SCALING CONSIDERATIONS

### Current Limits (Free Tier)
- Supabase: 500MB database, 2GB bandwidth/month
- Vercel: 100GB bandwidth/month, 100 deployments/day

### When to Upgrade
- Database > 400MB → Upgrade Supabase
- Bandwidth > 80GB/month → Upgrade Vercel
- Users > 1000 active → Consider caching
- Chat messages > 10k/day → Implement pagination

### Performance Optimization
- [ ] Enable Vercel Edge Caching
- [ ] Implement Redis for chat (optional)
- [ ] Add CDN for static assets
- [ ] Optimize images (WebP format)
- [ ] Lazy load components

---

## 🎯 FEATURE ROADMAP

### Phase 1: Core Features (COMPLETE ✅)
- ✅ Authentication system
- ✅ Case Opening (15 chests)
- ✅ Wheel Spinner
- ✅ Crash Game
- ✅ User Dashboard
- ✅ Admin Dashboard
- ✅ Inventory system

### Phase 2: Enterprise Features (IN PROGRESS ⏳)
- ✅ Global Chat
- ✅ Online Player Tracking
- ✅ Database Schema
- ⏳ CMS Admin Panel
- ⏳ Role Badge System (images)

### Phase 3: Advanced Features (PLANNED 📋)
- 📋 News Manager
- 📋 Media Library
- 📋 Analytics Dashboard
- 📋 Chat Moderation
- 📋 Permission System

---

## 📞 SUPPORT & RESOURCES

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

### Common Commands
```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Vercel
vercel --prod

# Check logs
vercel logs

# Environment variables
vercel env ls
vercel env add VARIABLE_NAME
```

### Getting Help
1. Check `ENTERPRISE_FEATURES.md` for feature status
2. Review browser console for errors
3. Check Vercel deployment logs
4. Verify Supabase database connection
5. Test API endpoints directly

---

## ✅ DEPLOYMENT SUCCESS CHECKLIST

### Before Going Live
- [ ] Database schema applied
- [ ] Environment variables set
- [ ] Build successful locally
- [ ] All tests passing
- [ ] Admin account created
- [ ] Test user account created

### After Deployment
- [ ] Site loads correctly
- [ ] Authentication works
- [ ] All games functional
- [ ] Chat working
- [ ] Online players showing
- [ ] Admin dashboard accessible
- [ ] No console errors

### Final Steps
- [ ] Share URL with users
- [ ] Monitor first 24 hours
- [ ] Collect user feedback
- [ ] Plan next features

---

## 🎉 CONGRATULATIONS!

Your ReyaBet Enterprise platform is now live! 🚀

**Live URL:** https://your-app.vercel.app

**Admin Access:** Login with staff account to access admin dashboard

**Next Steps:**
1. Create role badge images (`/public/roles/*.png`)
2. Implement CMS admin panel
3. Add news manager
4. Enable chat moderation
5. Build analytics dashboard

---

**Deployment Date:** May 30, 2026
**Version:** 2.0.0-enterprise
**Status:** Production Ready ✅
