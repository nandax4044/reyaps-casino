# 🚀 MULAI DISINI - Quick Start Guide

## ⚡ Langkah Cepat (5 Menit)

### 1️⃣ Setup API Keys (WAJIB!)

**Dapatkan keys dari Supabase:**
👉 https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/settings/api

**Update file `.env`:**
```env
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=<PASTE_ANON_PUBLIC_KEY_DISINI>
SUPABASE_SERVICE_KEY=<PASTE_SERVICE_ROLE_KEY_DISINI>
VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
VITE_SUPABASE_KEY=<PASTE_ANON_PUBLIC_KEY_DISINI>
```

📖 **Panduan lengkap:** Baca `CARA_DAPATKAN_API_KEYS.md`

---

### 2️⃣ Setup Database (WAJIB!)

**Jalankan SQL di Supabase:**
👉 https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/sql

1. Buka file `FIX_LOGIN_ERROR.sql`
2. Copy semua isinya
3. Paste ke SQL Editor
4. Klik **Run**

---

### 3️⃣ Jalankan Aplikasi

**Satu command untuk menjalankan semuanya:**
```bash
npm run dev
```

**PENTING:** Server sekarang **TIDAK auto-restart** untuk menjaga stabilitas!
- ✅ Cocok untuk production/live
- ✅ AFK fishing berjalan tanpa gangguan
- ✅ User tidak ter-disconnect
- ⚠️ Perlu restart manual jika ada perubahan code

**Jika sedang development dan ingin auto-reload:**
```bash
npm run dev:watch
```
⚠️ **Jangan gunakan watch mode saat ada user bermain!**

Ini akan menjalankan:
- ✅ Backend API (Express) di port 3000
- ✅ Frontend (Vite) di port 5173

**Tunggu hingga muncul:**
```
[1] VITE v5.x.x  ready in xxx ms
[1] ➜  Local:   http://localhost:5173/
[0] Server running on http://localhost:3000
```

---

### 4️⃣ Buka Browser

**Akses aplikasi:**
👉 http://localhost:5173

**Login dengan:**
- Username: `admin`
- Password: `admin123`

---

## ❌ Troubleshooting Cepat

### Error 404 pada `/api/auth/login`

**Penyebab:** Backend server tidak berjalan

**Solusi:**
```bash
# Stop server (Ctrl+C)
# Jalankan ulang
npm run dev
```

**Cek apakah backend berjalan:**
```bash
curl http://localhost:3000/api/health
```

Harus return:
```json
{"status":"ok","database":"supabase"}
```

---

### Error 500 pada login

**Penyebab:** API keys salah atau database belum di-setup

**Solusi:**
1. Cek file `.env` - keys harus dimulai dengan `eyJ...`
2. Jalankan `FIX_LOGIN_ERROR.sql` di Supabase
3. Restart server

📖 **Panduan lengkap:** Baca `PERBAIKI_LOGIN_ERROR_500.md`

---

### Port sudah digunakan

**Port 3000 digunakan:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Port 5173 digunakan:**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📚 Dokumentasi Lengkap

- 🔑 **CARA_DAPATKAN_API_KEYS.md** - Cara mendapatkan API keys dari Supabase
- 🔧 **PERBAIKI_LOGIN_ERROR_500.md** - Fix error login 500
- 🚀 **CARA_JALANKAN_APLIKASI.md** - Panduan lengkap menjalankan aplikasi
- 📋 **FIX_LOGIN_ERROR.sql** - SQL untuk setup database

---

## ✅ Checklist

- [ ] Dapatkan anon public key dari Supabase
- [ ] Dapatkan service_role key dari Supabase
- [ ] Update file `.env` dengan keys yang benar
- [ ] Jalankan `FIX_LOGIN_ERROR.sql` di Supabase SQL Editor
- [ ] Install dependencies: `npm install`
- [ ] Jalankan aplikasi: `npm run dev`
- [ ] Buka browser: http://localhost:5173
- [ ] Login dengan admin/admin123

---

## 🎯 Yang Sudah Diperbaiki

✅ **Vite config** - Ditambahkan proxy untuk `/api`
✅ **Package.json** - Script `dev` sekarang menjalankan backend + frontend
✅ **API error handling** - Error messages lebih informatif
✅ **Dokumentasi lengkap** - Panduan step-by-step

---

## 🆘 Masih Butuh Bantuan?

1. Baca dokumentasi di folder ini
2. Cek browser console (F12) untuk error
3. Cek terminal logs untuk error backend
4. Screenshot error dan hubungi developer

---

**Selamat mencoba! 🎉**
