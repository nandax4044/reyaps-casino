# 🚀 Panduan Deploy ke Vercel - Galaxy Casino

## ⚠️ PENTING: Persiapan Sebelum Deploy

### 1. Pastikan Database Sudah Bersih
```bash
# Jalankan cleanup_database.sql di Supabase SQL Editor
# Pastikan tidak ada error "Cannot coerce to single JSON object"
```

### 2. Test Lokal Dulu
```bash
npm run dev
# Test semua fitur:
# ✅ Chest game
# ✅ Wheel game
# ✅ Crash game
# ✅ Admin panel
# ✅ Inventory
```

---

## 📋 Langkah-Langkah Deploy ke Vercel

### LANGKAH 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### LANGKAH 2: Login ke Vercel
1. Buka https://vercel.com
2. Sign up / Login dengan GitHub
3. Klik "Add New" → "Project"

### LANGKAH 3: Import Project dari GitHub

#### A. Push ke GitHub Dulu (Jika Belum)
```bash
# Di folder project
git init
git add .
git commit -m "Initial commit - Galaxy Casino"

# Buat repo baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

#### B. Import di Vercel
1. Di Vercel Dashboard, klik "Import Project"
2. Pilih repository GitHub kamu
3. Klik "Import"

### LANGKAH 4: Configure Environment Variables

Di Vercel Project Settings → Environment Variables, tambahkan:

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0
NODE_ENV=production
```

**PENTING:** Jangan commit file `.env` ke GitHub!

### LANGKAH 5: Configure Build Settings

Di Vercel Project Settings → Build & Development Settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### LANGKAH 6: Deploy!

1. Klik "Deploy"
2. Tunggu proses build selesai (2-5 menit)
3. Jika sukses, akan dapat URL: `https://your-project.vercel.app`

---

## ⚠️ MASALAH UMUM & SOLUSI

### ❌ Build Failed: "Cannot find module"

**Solusi:**
```bash
# Pastikan semua dependencies terinstall
npm install
npm run build  # Test build lokal dulu
```

### ❌ Runtime Error: "Cannot coerce to single JSON object"

**Solusi:**
1. Jalankan `cleanup_database.sql` di Supabase
2. Redeploy di Vercel (klik "Redeploy")

### ❌ Error: "Port already in use"

**Solusi:**
- Ini tidak akan terjadi di Vercel (Vercel auto-assign port)
- Jika terjadi lokal, restart server

### ❌ Images Tidak Muncul

**Solusi:**
1. Pastikan folder `public/images` sudah di-commit ke GitHub
2. Check path image di code (harus relative: `/images/chest.png`)

### ❌ WebSocket Error

**Solusi:**
- Vercel tidak support WebSocket untuk serverless functions
- Hapus atau disable WebSocket code di `server.ts`

---

## 🔧 Optimasi untuk Production

### 1. Disable WebSocket (Vercel Limitation)

Edit `server.ts`, comment out WebSocket code:

```typescript
// ─── WebSocket Setup (DISABLED for Vercel) ─────────────────────────────────
/*
const wss = new WebSocketServer({ port: 24678 });
wss.on('connection', (ws) => {
  // ... WebSocket logic
});
*/
```

### 2. Update CORS Settings

Edit `server.ts`, tambahkan CORS untuk production:

```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

### 3. Optimize Build Size

```bash
# Remove unused dependencies
npm prune --production
```

---

## 🎯 Checklist Sebelum Deploy

- [ ] ✅ Database sudah bersih (jalankan cleanup_database.sql)
- [ ] ✅ Test lokal berhasil (npm run dev)
- [ ] ✅ Semua fitur berfungsi (chest, wheel, crash, admin)
- [ ] ✅ File .env TIDAK di-commit ke GitHub
- [ ] ✅ File .gitignore sudah benar
- [ ] ✅ Build lokal berhasil (npm run build)
- [ ] ✅ Environment variables sudah di-set di Vercel
- [ ] ✅ WebSocket code sudah di-disable (optional)

---

## 🚀 Deploy Otomatis (CI/CD)

Setelah setup awal, setiap kali push ke GitHub:
```bash
git add .
git commit -m "Update feature X"
git push
```

Vercel akan **otomatis deploy** dalam 2-5 menit! 🎉

---

## 📊 Monitoring & Logs

### Cek Logs di Vercel:
1. Buka Vercel Dashboard
2. Pilih project
3. Klik tab "Logs"
4. Filter by "Errors" untuk lihat error

### Cek Database di Supabase:
1. Buka Supabase Dashboard
2. Klik "Table Editor"
3. Check tables: users, inventory, game_configs

---

## 🆘 Troubleshooting Deployment

### Build Berhasil tapi Website Error

1. **Check Vercel Logs:**
   - Buka Vercel Dashboard → Logs
   - Cari error message

2. **Check Environment Variables:**
   - Pastikan SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY sudah benar
   - Pastikan tidak ada typo

3. **Check Database:**
   - Jalankan `verify_database.sql` di Supabase
   - Pastikan tidak ada duplikat di game_configs

4. **Redeploy:**
   - Klik "Redeploy" di Vercel Dashboard

### Website Lambat

1. **Optimize Images:**
   - Compress images di folder `public/images`
   - Use WebP format

2. **Enable Caching:**
   - Vercel auto-cache static files
   - Check Vercel Analytics untuk performance

3. **Database Query Optimization:**
   - Add indexes (sudah ada di schema_final.sql)
   - Use connection pooling

---

## 🎉 Setelah Deploy Berhasil

### Test Production:
1. Buka URL Vercel: `https://your-project.vercel.app`
2. Register akun baru
3. Test semua fitur:
   - ✅ Chest game
   - ✅ Wheel game
   - ✅ Crash game
   - ✅ Inventory
   - ✅ Admin panel (jika admin)

### Setup Custom Domain (Optional):
1. Beli domain (Namecheap, GoDaddy, dll)
2. Di Vercel Dashboard → Settings → Domains
3. Add custom domain
4. Update DNS records sesuai instruksi Vercel

---

## 📝 Catatan Penting

### Vercel Limitations:
- ❌ **No WebSocket support** (serverless functions)
- ❌ **10 second timeout** for API routes (free plan)
- ✅ **Unlimited bandwidth** (free plan)
- ✅ **Auto SSL certificate**
- ✅ **Global CDN**

### Alternative Hosting (Jika Butuh WebSocket):
- **Railway.app** - Support WebSocket, easy deploy
- **Render.com** - Free tier, support WebSocket
- **Heroku** - Classic choice, paid
- **DigitalOcean App Platform** - More control

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Repo: (your repo URL)

---

**Last Updated:** 2026-05-29
**Status:** ✅ Ready to Deploy
**Estimated Deploy Time:** 5-10 minutes
