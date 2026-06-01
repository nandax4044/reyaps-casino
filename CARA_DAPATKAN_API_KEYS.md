# 🔑 Cara Mendapatkan API Keys dari Supabase

## 📍 Link Langsung
Klik link ini untuk langsung ke halaman API Settings:
👉 **https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/settings/api**

## 📋 Langkah-Langkah

### 1️⃣ Login ke Supabase
- Buka https://supabase.com/dashboard
- Login dengan akun Anda

### 2️⃣ Pilih Project
- Klik project: **rwngqiakigebtwxohiri**

### 3️⃣ Buka Settings API
- Klik ikon **⚙️ Settings** di sidebar kiri
- Klik **API** di menu Settings

### 4️⃣ Copy Keys

Anda akan melihat halaman seperti ini:

```
Project API keys
────────────────────────────────────────────────────────────────

Project URL
https://rwngqiakigebtwxohiri.supabase.co

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.XXXXXXXXXXXXXXXX
[Copy] [Reveal]

service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.XXXXXXXXXXXXXXXX
[Copy] [Reveal]
```

### 5️⃣ Copy Kedua Keys

**A) Copy ANON PUBLIC Key:**
1. Klik tombol **[Copy]** di sebelah "anon public"
2. Paste ke notepad sementara
3. Key ini akan digunakan untuk:
   - `SUPABASE_KEY`
   - `VITE_SUPABASE_KEY`

**B) Copy SERVICE_ROLE Key:**
1. Klik tombol **[Reveal]** untuk melihat key
2. Klik tombol **[Copy]** di sebelah "service_role secret"
3. Paste ke notepad sementara
4. Key ini akan digunakan untuk:
   - `SUPABASE_SERVICE_KEY`

## 📝 Update File .env

Setelah mendapatkan kedua keys, buka file `.env` dan update:

```env
# Ganti YOUR_ANON_KEY_HERE dengan anon public key yang sudah di-copy
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_DISINI

# Ganti YOUR_SERVICE_ROLE_KEY_HERE dengan service_role key yang sudah di-copy
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.PASTE_DISINI

# Gunakan anon public key yang sama
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_DISINI
```

## ✅ Verifikasi

Pastikan:
- ✅ Kedua keys dimulai dengan `eyJ...`
- ✅ Keys tidak terpotong atau ada spasi di tengah
- ✅ `SUPABASE_KEY` dan `VITE_SUPABASE_KEY` menggunakan key yang sama (anon public)
- ✅ `SUPABASE_SERVICE_KEY` menggunakan service_role key

## 🔄 Langkah Selanjutnya

Setelah update .env:
1. Jalankan `FIX_LOGIN_ERROR.sql` di Supabase SQL Editor
2. Restart server: `npm run dev`
3. Test login

## ⚠️ Keamanan

**PENTING:**
- ❌ Jangan share keys ke publik
- ❌ Jangan commit .env ke Git
- ❌ Jangan screenshot keys dan share
- ✅ Simpan keys dengan aman
- ✅ Jika keys bocor, regenerate di Supabase Dashboard

## 🆘 Troubleshooting

### Keys tidak muncul?
- Pastikan Anda sudah login ke Supabase
- Pastikan Anda memilih project yang benar
- Refresh halaman dan coba lagi

### Tombol Copy tidak berfungsi?
- Copy manual dengan select text dan Ctrl+C
- Pastikan copy dari awal `eyJ` sampai akhir key

### Keys terlalu panjang?
- Itu normal! Keys Supabase memang panjang (200+ karakter)
- Pastikan copy semua tanpa terpotong

---

**Selesai!** Setelah mendapatkan keys dan update .env, lanjutkan ke langkah berikutnya di `PERBAIKI_LOGIN_ERROR_500.md`
