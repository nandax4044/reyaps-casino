# 🚀 DEPLOY KE VERCEL - PANDUAN LENGKAP

## ✅ Apa yang Sudah Diperbaiki?
1. ✅ **vercel.json** - Menghapus konfigurasi runtime yang invalid
2. ✅ **API endpoints** - Login dan register sudah dalam format Vercel yang benar
3. ✅ **TypeScript error** - Sudah diperbaiki (TS2448)
4. ✅ **.vercelignore** - Dibuat untuk mengabaikan file yang tidak perlu

## 📋 LANGKAH DEPLOYMENT:

### 1. Commit dan Push ke GitHub
```powershell
# Add semua perubahan
git add .

# Commit dengan pesan yang jelas
git commit -m "Fix Vercel deployment - remove invalid runtime config"

# Push ke GitHub
git push origin main
```

### 2. Deploy Otomatis di Vercel
Setelah push, Vercel akan **otomatis deploy** jika sudah terkoneksi dengan GitHub repo.

### 3. Set Environment Variables di Vercel Dashboard
Buka Vercel Dashboard → Project Settings → Environment Variables, lalu tambahkan:

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.hJkWYlilL9RsklMb7mfSaHBq2LFq0y-a6YGXDngalXo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0
```

**PENTING**: Set untuk **Production**, **Preview**, dan **Development**!

### 4. Redeploy (jika perlu)
Jika environment variables baru ditambahkan, klik **"Redeploy"** di Vercel Dashboard.

---

## 🔍 Verifikasi Deployment:

### Test Login API:
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginKey":"admin","password":"admin123"}'
```

### Test Register API:
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"test123"}'
```

---

## 📁 Struktur File yang Di-Deploy:

```
✅ dist/                    # Build output dari Vite
✅ api/auth/login.ts        # Login endpoint
✅ api/auth/register.ts     # Register endpoint
✅ api/index.ts             # Main API handler
✅ vercel.json              # Vercel config (FIXED!)
✅ .vercelignore            # Files to ignore
✅ package.json             # Dependencies
```

---

## ⚠️ Troubleshooting:

### Jika masih error "Invalid runtime":
1. Pastikan `vercel.json` tidak ada `"version": 2` atau `"functions"` config
2. Hapus `.vercel` folder lokal: `Remove-Item -Recurse -Force .vercel`
3. Push ulang ke GitHub

### Jika API 404:
1. Cek apakah file `api/auth/login.ts` dan `api/auth/register.ts` ada
2. Cek routing di `vercel.json`
3. Cek Vercel build logs untuk error

### Jika environment variables tidak terbaca:
1. Pastikan sudah di-set di Vercel Dashboard
2. Redeploy setelah menambahkan env vars
3. Cek apakah nama variable sama persis (case-sensitive)

---

## ✅ Checklist Sebelum Deploy:

- [x] TypeScript error sudah diperbaiki
- [x] vercel.json sudah diperbaiki (no invalid runtime)
- [x] API endpoints sudah ada dan benar
- [x] .vercelignore sudah dibuat
- [ ] Git commit dan push
- [ ] Environment variables sudah di-set di Vercel
- [ ] Test login dan register setelah deploy

---

**STATUS**: ✅ SIAP DEPLOY!
**URGENT**: Banyak user menunggu - deploy sekarang!

## 🎯 Quick Deploy Command:
```powershell
git add . && git commit -m "Fix Vercel deployment" && git push origin main
```

Setelah push, cek Vercel Dashboard untuk melihat progress deployment!
