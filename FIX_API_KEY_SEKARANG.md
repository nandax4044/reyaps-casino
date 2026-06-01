# 🔑 FIX API KEY SEKARANG - URGENT!

## ❌ Error yang Terjadi

```
[AFK-FISHING] Error fetching active sessions: 
{message: 'Invalid API key', hint: 'Double check your Supabase `anon` or `service_role` API key.'}
```

## 🔍 Penyebab

File `.env` masih menggunakan **placeholder** bukan API key yang sebenarnya:
```
SUPABASE_KEY=YOUR_ANON_KEY_HERE  ← INI SALAH!
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY_HERE  ← INI SALAH!
```

---

## ✅ SOLUSI CEPAT (2 MENIT)

### Langkah 1: Dapatkan API Keys dari Supabase

1. **Buka link ini:**
   👉 https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/settings/api

2. **Copy 2 keys:**
   
   **A) anon public key:**
   - Cari bagian "Project API keys"
   - Copy key yang ada di bawah "anon" "public"
   - Key dimulai dengan `eyJ...`
   
   **B) service_role key:**
   - Scroll ke bawah
   - Copy key yang ada di bawah "service_role" "secret"
   - Key dimulai dengan `eyJ...`

### Langkah 2: Update File .env

Buka file `.env` dan ganti:

```env
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# Paste anon public key di sini (ganti YOUR_ANON_KEY_HERE)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_ANON_KEY_DISINI

# Paste service_role key di sini (ganti YOUR_SERVICE_ROLE_KEY_HERE)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.PASTE_SERVICE_ROLE_KEY_DISINI

VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# Paste anon public key yang sama di sini
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_ANON_KEY_DISINI
```

**PENTING:**
- Ganti `PASTE_ANON_KEY_DISINI` dengan anon public key yang Anda copy
- Ganti `PASTE_SERVICE_ROLE_KEY_DISINI` dengan service_role key yang Anda copy
- Keys harus dimulai dengan `eyJ...`
- Jangan ada spasi atau enter di tengah key

### Langkah 3: Restart Server

```bash
# Stop server (Ctrl+C)

# Start ulang
npm run dev
```

---

## 🧪 Verifikasi

Setelah restart, cek console:

**✅ Berhasil:**
```
[SUPABASE STATUS] Configured ✅ Connecting to https://rwngqiakigebtwxohiri.supabase.co
[AFK-FISHING] Supabase configured ✅
```

**❌ Masih error:**
```
[AFK-FISHING] Error fetching active sessions: Invalid API key
```
→ Berarti key masih salah, ulangi langkah 1-2

---

## 📸 Screenshot Panduan

### Di Supabase Dashboard:

1. **Buka Settings > API**
2. **Lihat bagian "Project API keys"**
3. **Copy kedua keys:**

```
Project API keys
────────────────────────────────────────

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[Copy] [Reveal]

service_role secret  
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[Copy] [Reveal]
```

---

## ⚠️ PENTING untuk Vercel

Jika sudah deploy ke Vercel, Anda juga harus set environment variables di Vercel:

1. Buka: https://vercel.com/dashboard
2. Pilih project Anda
3. Klik **Settings** > **Environment Variables**
4. Tambahkan:
   ```
   SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
   SUPABASE_KEY=<paste_anon_key>
   SUPABASE_SERVICE_KEY=<paste_service_role_key>
   ```
5. Klik **Save**
6. **Redeploy** project

---

## 🔍 Troubleshooting

### Keys tidak muncul di Supabase Dashboard?

- Pastikan Anda sudah login
- Pastikan Anda memilih project yang benar
- Refresh halaman

### Keys terlalu panjang?

- Itu normal! Keys Supabase memang panjang (200+ karakter)
- Pastikan copy semua tanpa terpotong

### Masih error setelah update?

1. Cek apakah keys dimulai dengan `eyJ...`
2. Cek tidak ada spasi atau enter di tengah key
3. Cek tidak ada tanda kutip di awal/akhir key
4. Restart server dengan `npm run dev`

---

## ✅ Checklist

- [ ] Buka Supabase Dashboard > Settings > API
- [ ] Copy anon public key
- [ ] Copy service_role key
- [ ] Update file .env dengan keys yang benar
- [ ] Pastikan keys dimulai dengan `eyJ...`
- [ ] Save file .env
- [ ] Restart server: `npm run dev`
- [ ] Verifikasi tidak ada error "Invalid API key"
- [ ] (Jika deploy) Set environment variables di Vercel
- [ ] (Jika deploy) Redeploy project

---

## 🎯 Hasil Akhir

Setelah fix, AFK fishing akan berjalan normal:

```
[AFK-FISHING] Supabase configured ✅
[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...
[AFK-FISHING] Found 3 active session(s) to resume
[AFK-FISHING] ✅ Successfully resumed fishing for user123
```

---

**PERBAIKI SEKARANG agar AFK fishing bisa berjalan! 🚀**
