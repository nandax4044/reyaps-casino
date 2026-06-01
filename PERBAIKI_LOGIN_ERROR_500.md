# 🚨 PERBAIKI ERROR LOGIN 500

## ❌ Masalah
Saat mencoba login, muncul error:
```
/api/auth/login:1  Failed to load resource: the server responded with a status of 500 ()
HTTP error! Status: 500
```

## 🔍 Penyebab
Error ini terjadi karena **API Key Supabase yang salah**. File `.env` menggunakan key dengan format `sb_publishable_...` yang bukan format key Supabase yang valid.

Key Supabase yang benar harus dimulai dengan `eyJ...` (format JWT/JSON Web Token).

## ✅ Solusi Lengkap

### 🔑 Langkah 1: Dapatkan API Keys yang Benar

1. **Buka Supabase Dashboard:**
   - Kunjungi: https://supabase.com/dashboard
   - Login dengan akun Anda

2. **Pilih Project:**
   - Klik project: `rwngqiakigebtwxohiri`

3. **Buka Settings API:**
   - Klik ikon **⚙️ Settings** di sidebar kiri
   - Klik **API** di menu Settings
   - Atau langsung ke: https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/settings/api

4. **Copy Keys:**
   Anda akan melihat dua keys penting:
   
   **a) Project API keys:**
   - `anon` `public` - Key ini untuk operasi user biasa
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.XXXXXXXXXXXXXXXX
     ```
   
   **b) Service role key:**
   - `service_role` `secret` - Key ini untuk operasi admin (bypass RLS)
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.XXXXXXXXXXXXXXXX
     ```

5. **Copy Keys:**
   - Klik tombol **Copy** di sebelah masing-masing key
   - Simpan di notepad sementara

### 📝 Langkah 2: Update File .env

1. **Buka file `.env`** di root project

2. **Ganti semua keys** dengan yang benar:

```env
# ═══════════════════════════════════════════════════════════════════════════════
# SUPABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# ANON PUBLIC KEY - Paste key "anon public" dari Supabase Dashboard
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_ANON_KEY_DISINI

# SERVICE ROLE KEY - Paste key "service_role" dari Supabase Dashboard
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.PASTE_SERVICE_ROLE_KEY_DISINI

# ═══════════════════════════════════════════════════════════════════════════════
# VITE ENVIRONMENT VARIABLES (Frontend)
# ═══════════════════════════════════════════════════════════════════════════════

VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# Gunakan ANON PUBLIC KEY yang sama seperti SUPABASE_KEY
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_ANON_KEY_DISINI
```

3. **Simpan file** (Ctrl+S)

### 🗄️ Langkah 3: Setup Database

1. **Buka Supabase SQL Editor:**
   - Kunjungi: https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/sql
   - Atau dari Dashboard > SQL Editor

2. **Buat New Query:**
   - Klik tombol **+ New query**

3. **Copy SQL Fix:**
   - Buka file `FIX_LOGIN_ERROR.sql` di project ini
   - Copy semua isinya (Ctrl+A, Ctrl+C)

4. **Paste dan Run:**
   - Paste ke SQL Editor (Ctrl+V)
   - Klik tombol **Run** atau tekan `Ctrl+Enter`

5. **Tunggu hingga selesai:**
   - Anda akan melihat pesan sukses
   - SQL ini akan membuat tabel, policies, dan trigger yang diperlukan

### 🔄 Langkah 4: Restart Server

1. **Stop server yang sedang berjalan:**
   - Tekan `Ctrl+C` di terminal

2. **Restart server:**
   ```bash
   npm run dev
   ```

3. **Tunggu hingga server siap:**
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

### 🧪 Langkah 5: Test Login

1. **Buka browser:**
   - Kunjungi: http://localhost:5173

2. **Coba login dengan akun admin:**
   - **Username:** `admin`
   - **Password:** `admin123`

3. **Atau buat akun baru:**
   - Klik "Register"
   - Isi form registrasi
   - Login dengan akun baru

## ✅ Verifikasi Berhasil

Jika berhasil, Anda akan:
- ✅ Tidak melihat error 500 lagi
- ✅ Berhasil login dan masuk ke dashboard
- ✅ Melihat saldo dan fitur lainnya

## 🔍 Troubleshooting

### ❌ Masih Error 500?

**1. Cek Console Browser (F12):**
```javascript
// Buka Developer Tools (F12)
// Lihat tab Console
// Cari error message merah
```

**2. Cek Server Logs:**
```bash
# Di terminal tempat npm run dev berjalan
# Cari log yang dimulai dengan [LOGIN]
# Contoh:
[LOGIN] Request received: { loginKey: 'admin', hasPassword: true }
[LOGIN] Attempting login for: admin
[LOGIN] Looking up username: admin
[LOGIN] Found email for username: admin@staff.com
[LOGIN] Attempting Supabase auth with email: admin@staff.com
[LOGIN] Auth successful, fetching user profile: xxx-xxx-xxx
[LOGIN] Login successful for user: admin
```

**3. Verifikasi Keys:**
```bash
# Pastikan keys di .env benar
# Cek apakah dimulai dengan eyJ
# Cek tidak ada spasi atau enter di tengah key
```

**4. Cek Database:**
```sql
-- Jalankan di Supabase SQL Editor
-- Cek apakah tabel users ada
SELECT * FROM public.users LIMIT 5;

-- Cek RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Cek trigger
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

### ❌ Error "Username tidak ditemukan"?

**Penyebab:** User belum terdaftar atau tabel users belum dibuat

**Solusi:**
1. Jalankan `FIX_LOGIN_ERROR.sql` di Supabase
2. Atau buat akun baru dengan Register

### ❌ Error "Profil user tidak ditemukan"?

**Penyebab:** User ada di `auth.users` tapi tidak ada di `public.users`

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor
INSERT INTO public.users (id, email, username, balance, is_staff)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  0.00,
  FALSE
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### ❌ Error "Invalid API Key"?

**Penyebab:** Key yang digunakan salah atau expired

**Solusi:**
1. Dapatkan key baru dari Supabase Dashboard
2. Pastikan copy key yang benar (anon untuk SUPABASE_KEY, service_role untuk SUPABASE_SERVICE_KEY)
3. Pastikan tidak ada spasi atau karakter tambahan

## 📞 Butuh Bantuan Lebih Lanjut?

Jika masih ada masalah setelah mengikuti semua langkah:

1. **Screenshot error:**
   - Browser console (F12 > Console tab)
   - Network tab (F12 > Network tab > klik request yang error)
   - Server logs dari terminal

2. **Informasi yang perlu disertakan:**
   - Error message lengkap
   - Langkah mana yang sudah dilakukan
   - Hasil dari query verifikasi database

3. **Hubungi developer** dengan informasi di atas

## 📋 Checklist

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Buka Supabase Dashboard dan dapatkan anon key
- [ ] Dapatkan service_role key dari Supabase Dashboard
- [ ] Update file .env dengan kedua keys yang benar
- [ ] Pastikan keys dimulai dengan `eyJ...`
- [ ] Jalankan FIX_LOGIN_ERROR.sql di Supabase SQL Editor
- [ ] Verifikasi SQL berhasil dijalankan (tidak ada error)
- [ ] Stop server development (Ctrl+C)
- [ ] Restart server (npm run dev)
- [ ] Buka browser dan test login
- [ ] Login berhasil tanpa error 500

## 🎉 Selesai!

Setelah semua langkah selesai, aplikasi Anda seharusnya berfungsi normal dan login tidak akan error lagi.

---

**Catatan Penting:**
- Jangan share API keys ke publik atau commit ke Git
- Service role key sangat powerful, jaga kerahasiaannya
- Jika keys bocor, regenerate di Supabase Dashboard
