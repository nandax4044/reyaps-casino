# 🔧 Fix Login Error 500

## ❌ Error

```
HTTP error! Status: 500
```

Saat mencoba login.

## 🔍 Kemungkinan Penyebab

1. **JSON import error** - Vercel tidak bisa load JSON files
2. **Supabase connection error** - Environment variables salah
3. **Code error** - Ada bug di handleLogin function

## ✅ Solusi yang Sudah Dilakukan

### 1. Fix JSON Import
- ✅ Ganti dari `import` ke `readFileSync`
- ✅ Tambah fallback data jika file tidak ditemukan
- ✅ Tambah try-catch untuk handle error

### 2. Tambah Logging
- ✅ Log setiap step di handleLogin
- ✅ Log error dengan stack trace
- ✅ Log environment variables status

---

## 🚀 Cara Fix & Redeploy

### LANGKAH 1: Commit & Push

```bash
git add .
git commit -m "Fix login error 500 - add logging and error handling"
git push
```

### LANGKAH 2: Tunggu Vercel Deploy

Vercel akan auto-deploy dalam 2-5 menit.

### LANGKAH 3: Check Logs di Vercel

1. Buka Vercel Dashboard
2. Klik project kamu
3. Klik tab **"Logs"**
4. Filter by **"Errors"**
5. Cari log yang dimulai dengan `[LOGIN]` atau `[API ERROR]`

### LANGKAH 4: Test Login Lagi

1. Buka website
2. Coba login
3. Jika masih error 500, check logs di Vercel

---

## 🔍 Debug dengan Logs

Setelah redeploy, logs akan menunjukkan detail error:

### Log Normal (Success):
```
[LOGIN] Request received: { loginKey: 'nanddev', hasPassword: true }
[LOGIN] Attempting login for: nanddev
[LOGIN] Looking up username: nanddev
[LOGIN] Found email for username: nand@example.com
[LOGIN] Attempting Supabase auth with email: nand@example.com
[LOGIN] Auth successful, fetching user profile: xxx-xxx-xxx
[LOGIN] Login successful for user: nanddev
```

### Log Error (Failure):
```
[LOGIN] Request received: { loginKey: 'nanddev', hasPassword: true }
[LOGIN] Attempting login for: nanddev
[API ERROR] Cannot read property 'from' of null
[API ERROR STACK] TypeError: Cannot read property 'from' of null
    at handleLogin (api/index.ts:123:45)
```

---

## 🔧 Troubleshooting Berdasarkan Log

### Error: "Cannot read property 'from' of null"

**Penyebab:** `supabase` client null (environment variables salah)

**Solusi:**
1. Check environment variables di Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_KEY`
2. Pastikan tidak ada typo
3. Redeploy setelah fix

### Error: "Failed to load JSON files"

**Penyebab:** JSON files tidak ter-include di build

**Solusi:**
1. Check `vercel.json`:
   ```json
   "config": {
     "includeFiles": ["api/*.json"]
   }
   ```
2. Check folder `/api` ada file:
   - `case_opening.json`
   - `roda.json`
   - `permainan.json`
3. Push lagi jika tidak ada

### Error: "Invalid login credentials"

**Penyebab:** Password salah atau user tidak ada

**Solusi:**
1. Register akun baru
2. Atau reset password di Supabase Dashboard

### Error: "Profil user tidak ditemukan"

**Penyebab:** User ada di auth tapi tidak ada di table `users`

**Solusi:**
1. Jalankan `FIX_RLS_ERROR.sql` di Supabase
2. Check trigger `on_auth_user_created` aktif
3. Register ulang

---

## 📋 Checklist Debug

- [ ] ✅ Push code dengan logging
- [ ] ✅ Tunggu Vercel deploy selesai
- [ ] ✅ Test login
- [ ] ✅ Check logs di Vercel
- [ ] ✅ Identify error dari logs
- [ ] ✅ Fix berdasarkan error
- [ ] ✅ Redeploy
- [ ] ✅ Test lagi

---

## 🆘 Jika Masih Error

### Option 1: Test API Langsung

```bash
# Test health endpoint
curl https://your-project.vercel.app/api/health

# Test login endpoint
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginKey":"nanddev","password":"yourpassword"}'
```

### Option 2: Test Lokal Dulu

```bash
# Test lokal
npm run dev

# Test login di localhost:3000
# Jika berhasil lokal tapi gagal di Vercel, berarti masalah environment
```

### Option 3: Check Environment Variables

Di Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

Pastikan semua ada dan benar!

---

## 🎯 Next Steps

1. **Push code** dengan logging
2. **Check logs** di Vercel untuk detail error
3. **Fix** berdasarkan error yang ditemukan
4. **Redeploy** dan test lagi

---

**TL;DR:** Code sudah ditambahkan logging detail. Push ke GitHub, tunggu deploy, test login, check logs di Vercel untuk lihat error detail, fix berdasarkan logs!
