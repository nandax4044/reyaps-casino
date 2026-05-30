# 🔧 Fix Vercel Deployment Error

## ❌ Masalah

Error: `500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED`

**Penyebab:**
- `server.ts` menggunakan Vite dev server yang tidak compatible dengan Vercel serverless
- Vercel butuh static build, bukan dev server

## ✅ Solusi: Deploy sebagai Static Site + API Routes

### OPSI 1: Deploy ke Vercel (Static + Serverless API) ⭐ RECOMMENDED

#### LANGKAH 1: Update package.json

Tambahkan script build:

```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### LANGKAH 2: Buat vercel.json baru

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}
```

#### LANGKAH 3: Pindahkan API ke folder api/

Struktur folder:
```
/api
  /auth.ts          → Handle /api/auth/*
  /user.ts          → Handle /api/user/*
  /games.ts         → Handle /api/games/*
  /admin.ts         → Handle /api/admin/*
```

#### LANGKAH 4: Deploy

```bash
# Push ke GitHub
git add .
git commit -m "Fix Vercel deployment"
git push

# Deploy di Vercel
# - Import GitHub repo
# - Framework: Vite
# - Build Command: npm run build
# - Output Directory: dist
# - Set environment variables
```

---

### OPSI 2: Deploy ke Railway.app ⭐ LEBIH MUDAH!

Railway support full Node.js server (tidak perlu refactor!)

#### LANGKAH 1: Buat akun Railway

1. Buka https://railway.app
2. Sign up dengan GitHub
3. Klik "New Project"

#### LANGKAH 2: Deploy dari GitHub

1. Pilih "Deploy from GitHub repo"
2. Pilih repository kamu
3. Railway auto-detect settings

#### LANGKAH 3: Set Environment Variables

Di Railway Dashboard → Variables:
```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
PORT=3000
```

#### LANGKAH 4: Deploy!

Railway akan auto-deploy. Tunggu 2-5 menit, website live!

**URL:** `https://your-project.up.railway.app`

---

### OPSI 3: Deploy ke Render.com ⭐ GRATIS + MUDAH!

#### LANGKAH 1: Buat akun Render

1. Buka https://render.com
2. Sign up dengan GitHub

#### LANGKAH 2: Create Web Service

1. Klik "New" → "Web Service"
2. Connect GitHub repository
3. Settings:
   - **Name:** galaxy-casino
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run dev`
   - **Plan:** Free

#### LANGKAH 3: Set Environment Variables

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

#### LANGKAH 4: Deploy!

Render akan auto-deploy. Website live dalam 5-10 menit!

---

## 🎯 Perbandingan Platform

| Platform | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Vercel** | ⚡ Super cepat, CDN global | ❌ Perlu refactor code | ⭐⭐⭐ (jika mau refactor) |
| **Railway** | ✅ No refactor needed, mudah | 💰 $5/month setelah trial | ⭐⭐⭐⭐⭐ (RECOMMENDED!) |
| **Render** | ✅ Gratis, no refactor | ⏱️ Agak lambat (free tier) | ⭐⭐⭐⭐ (Good alternative) |

---

## 🚀 Quick Fix: Deploy ke Railway (5 MENIT)

```bash
# 1. Push ke GitHub (jika belum)
git add .
git commit -m "Ready for deployment"
git push

# 2. Buka https://railway.app
# 3. Sign up dengan GitHub
# 4. Klik "New Project" → "Deploy from GitHub repo"
# 5. Pilih repository kamu
# 6. Set environment variables (SUPABASE_URL, SUPABASE_KEY, dll)
# 7. Deploy!

# ✅ SELESAI! Website live dalam 5 menit!
```

---

## 📝 Kesimpulan

### Untuk Vercel:
- ❌ **Tidak recommended** karena perlu refactor besar
- ⚠️ Vercel tidak support Vite dev server di production
- ✅ Bisa dipakai jika mau refactor ke static + API routes

### Untuk Railway/Render:
- ✅ **RECOMMENDED!** Tidak perlu refactor
- ✅ Support full Node.js server
- ✅ Deploy langsung tanpa perubahan code
- ✅ Gratis (Render) atau trial $5 credit (Railway)

---

## 🆘 Jika Masih Mau Pakai Vercel

Saya bisa bantu refactor code untuk Vercel, tapi akan butuh:
1. Split server.ts menjadi multiple API routes
2. Build frontend sebagai static files
3. Update routing logic
4. Test ulang semua fitur

**Estimasi waktu:** 30-60 menit

**Atau pakai Railway/Render:** 5 menit, no refactor! 🚀

---

**Recommendation:** Deploy ke **Railway.app** untuk solusi tercepat dan termudah!
