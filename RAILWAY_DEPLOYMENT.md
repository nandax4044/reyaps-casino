# 🚂 Deploy ke Railway.app - Panduan Lengkap

## ✅ Kenapa Railway?

- ✅ **Tidak perlu refactor code** - Deploy langsung!
- ✅ **Support full Node.js server** - Vite dev server works!
- ✅ **Gratis $5 credit** untuk trial
- ✅ **Auto SSL certificate**
- ✅ **Custom domain support**
- ✅ **Auto deploy** dari GitHub
- ✅ **Easy setup** - 5 menit selesai!

---

## 🚀 Langkah-Langkah Deploy (5 MENIT)

### LANGKAH 1: Push ke GitHub (Jika Belum)

```bash
# Di folder project
cd c:\reyagachav2

# Init git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Buat repo baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### LANGKAH 2: Buat Akun Railway

1. Buka https://railway.app
2. Klik **"Login"** atau **"Start a New Project"**
3. Pilih **"Login with GitHub"**
4. Authorize Railway untuk akses GitHub

✅ Kamu dapat **$5 credit gratis** untuk trial!

---

### LANGKAH 3: Create New Project

1. Di Railway Dashboard, klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository kamu (galaxy-casino atau nama repo kamu)
4. Railway akan auto-detect settings

---

### LANGKAH 4: Configure Environment Variables

1. Klik project yang baru dibuat
2. Klik tab **"Variables"**
3. Klik **"New Variable"**
4. Tambahkan satu per satu:

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0
NODE_ENV=production
PORT=3000
```

5. Klik **"Add"** untuk setiap variable

---

### LANGKAH 5: Deploy!

1. Railway akan **auto-deploy** setelah environment variables di-set
2. Tunggu proses build (2-5 menit)
3. Lihat logs di tab **"Deployments"**
4. Jika sukses, akan muncul **"Success"** ✅

---

### LANGKAH 6: Get Public URL

1. Klik tab **"Settings"**
2. Scroll ke **"Networking"**
3. Klik **"Generate Domain"**
4. Railway akan generate URL: `https://your-project.up.railway.app`
5. **COPY URL** ini!

---

### LANGKAH 7: Test Website

1. Buka URL Railway di browser
2. Test semua fitur:
   - ✅ Register akun baru
   - ✅ Login
   - ✅ Chest game
   - ✅ Wheel game
   - ✅ Crash game
   - ✅ Inventory
   - ✅ Admin panel (jika admin)

---

## 🔧 Troubleshooting

### ❌ Build Failed

**Error:** "npm install failed"

**Solusi:**
```bash
# Test build lokal dulu
npm install
npm run dev

# Jika berhasil, push lagi
git add .
git commit -m "Fix build"
git push
```

Railway akan auto-redeploy.

---

### ❌ Runtime Error: "Cannot find module"

**Solusi:**

1. Check `package.json` - pastikan semua dependencies ada
2. Check Railway logs - lihat error detail
3. Redeploy:
   - Klik tab "Deployments"
   - Klik "Redeploy" pada deployment terakhir

---

### ❌ Database Connection Error

**Solusi:**

1. Check environment variables di Railway
2. Pastikan SUPABASE_URL dan SUPABASE_KEY benar
3. Test connection di Supabase Dashboard
4. Redeploy setelah fix

---

### ❌ Port Error

**Solusi:**

Railway auto-assign port. Pastikan `server.ts` menggunakan:

```typescript
const PORT = process.env.PORT || 3000;
```

Jika belum, update dan push lagi.

---

## 📊 Monitoring & Logs

### Cek Logs Real-time:

1. Buka Railway Dashboard
2. Pilih project
3. Klik tab **"Deployments"**
4. Klik deployment yang aktif
5. Scroll ke bawah untuk lihat logs

### Cek Metrics:

1. Klik tab **"Metrics"**
2. Lihat:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

---

## 💰 Pricing & Limits

### Free Trial:
- ✅ **$5 credit gratis**
- ✅ Cukup untuk 1-2 bulan (usage rendah)
- ✅ No credit card required

### Hobby Plan ($5/month):
- ✅ $5 credit per bulan
- ✅ Unlimited projects
- ✅ Custom domains
- ✅ Priority support

### Usage Estimates:
- **Low traffic** (10-100 users/day): ~$2-3/month
- **Medium traffic** (100-1000 users/day): ~$5-10/month
- **High traffic** (1000+ users/day): ~$10-20/month

---

## 🎯 Custom Domain (Optional)

### LANGKAH 1: Beli Domain

Beli domain di:
- Namecheap.com
- GoDaddy.com
- Cloudflare.com

### LANGKAH 2: Add Domain di Railway

1. Klik tab **"Settings"**
2. Scroll ke **"Networking"**
3. Klik **"Custom Domain"**
4. Masukkan domain kamu (misal: `galaxycasino.com`)
5. Railway akan kasih DNS records

### LANGKAH 3: Update DNS

1. Login ke domain provider
2. Add DNS records dari Railway:
   - Type: **CNAME**
   - Name: **@** atau **www**
   - Value: (dari Railway)
3. Save changes
4. Tunggu 5-60 menit untuk propagasi

### LANGKAH 4: Verify

1. Buka domain kamu di browser
2. Jika berhasil, website akan muncul!
3. Railway auto-generate SSL certificate

---

## 🔄 Auto Deploy dari GitHub

Setelah setup awal, setiap kali push ke GitHub:

```bash
git add .
git commit -m "Update feature X"
git push
```

Railway akan **auto-deploy** dalam 2-5 menit! 🎉

---

## 📋 Checklist Deployment

- [ ] ✅ Code sudah di-push ke GitHub
- [ ] ✅ Railway project sudah dibuat
- [ ] ✅ Environment variables sudah di-set
- [ ] ✅ Build berhasil (check logs)
- [ ] ✅ Public URL sudah di-generate
- [ ] ✅ Website bisa diakses
- [ ] ✅ Register/login berfungsi
- [ ] ✅ Chest game berfungsi
- [ ] ✅ Wheel game berfungsi
- [ ] ✅ Crash game berfungsi
- [ ] ✅ Inventory berfungsi
- [ ] ✅ Admin panel berfungsi (jika admin)

---

## 🎉 Selesai!

Website kamu sekarang **LIVE** di Railway! 🚀

**Next Steps:**
1. Share URL ke teman/user
2. Monitor logs untuk errors
3. Collect feedback
4. Update features (auto-deploy dari GitHub)

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

---

**Deployment Time:** ~5 menit
**Difficulty:** ⭐ Easy
**Success Rate:** 99%
**Cost:** $0 (trial) atau $5/month
