# 🔑 Cara Mendapatkan ANON KEY yang BENAR

## ⚠️ PENTING!

Key yang Anda berikan **SALAH**:
```
❌ sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
```

Ini BUKAN anon key yang benar! Ini adalah format lama atau key yang salah.

---

## ✅ Format Anon Key yang BENAR

Anon key yang benar harus:
- ✅ Dimulai dengan `eyJ...`
- ✅ Panjang sekitar 200+ karakter
- ✅ Format JWT (JSON Web Token)
- ✅ Mirip dengan service_role key yang sudah Anda berikan

**Contoh format yang BENAR:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 📋 Langkah-Langkah Mendapatkan Anon Key yang Benar

### 1️⃣ Buka Supabase Dashboard

Klik link ini:
👉 **https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/settings/api**

### 2️⃣ Login (jika belum)

Pastikan Anda login dengan akun yang memiliki akses ke project ini.

### 3️⃣ Cari Bagian "Project API keys"

Anda akan melihat halaman seperti ini:

```
═══════════════════════════════════════════════════════════════
Project API keys
───────────────────────────────────────────────────────────────

Project URL
https://rwngqiakigebtwxohiri.supabase.co

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.XXXXXXXXXXXXXXXXXXXXXXXX
[Copy] [Reveal]

service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0
[Copy] [Reveal]
═══════════════════════════════════════════════════════════════
```

### 4️⃣ Copy Anon Public Key

1. **Cari baris "anon public"**
2. **Klik tombol [Copy]** di sebelah key
3. Key yang di-copy harus dimulai dengan `eyJ...`

**JANGAN copy:**
- ❌ `sb_publishable_...` (ini bukan anon key!)
- ❌ Key dari bagian lain
- ❌ Key yang tidak dimulai dengan `eyJ...`

### 5️⃣ Paste ke File .env

Buka file `.env` dan paste key yang sudah di-copy:

```env
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# Paste anon key di sini (ganti GANTI_DENGAN_ANON_KEY_YANG_BENAR_DARI_DASHBOARD)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_DISINI

# Service role key sudah benar
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0

VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co

# Paste anon key yang sama di sini
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.PASTE_DISINI
```

### 6️⃣ Save dan Restart

```bash
# Save file .env (Ctrl+S)

# Stop server (Ctrl+C)

# Start ulang
npm run dev
```

---

## 🔍 Verifikasi Key yang Benar

### ✅ Anon Key yang BENAR:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTY3NDMsImV4cCI6MjA5NTE5Mjc0M30.XXXXXXXXXXXXXXXXXXXXXXXX
```

**Ciri-ciri:**
- ✅ Dimulai dengan `eyJ`
- ✅ Ada 3 bagian dipisahkan titik (.)
- ✅ Panjang 200+ karakter
- ✅ Berisi `"role":"anon"` jika di-decode

### ❌ Key yang SALAH:
```
sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
```

**Kenapa salah:**
- ❌ Dimulai dengan `sb_publishable_`
- ❌ Bukan format JWT
- ❌ Terlalu pendek
- ❌ Ini mungkin key dari platform lain atau format lama

---

## 🧪 Test Setelah Update

Setelah update .env dan restart, cek console:

**✅ Berhasil:**
```
[SUPABASE STATUS] Configured ✅ Connecting to https://rwngqiakigebtwxohiri.supabase.co
[SUPABASE] Config check: { hasUrl: true, hasKey: true, hasServiceKey: true }
[AFK-FISHING] Supabase configured ✅
```

**❌ Masih error:**
```
[AFK-FISHING] Error fetching active sessions: Invalid API key
```
→ Berarti key masih salah, ulangi langkah 1-6

---

## 📞 Butuh Bantuan?

Jika masih kesulitan:

1. **Screenshot halaman Supabase Dashboard > Settings > API**
2. **Pastikan Anda melihat bagian "Project API keys"**
3. **Copy key yang ada di bawah "anon public"**
4. **Key harus dimulai dengan `eyJ...`**

---

## ⚠️ Keamanan

**JANGAN share anon key atau service_role key ke publik!**

- ❌ Jangan commit ke Git
- ❌ Jangan screenshot dan share
- ❌ Jangan paste di forum publik
- ✅ Simpan dengan aman di .env
- ✅ Tambahkan .env ke .gitignore

---

**Dapatkan anon key yang BENAR dan aplikasi Anda akan berjalan normal! 🚀**
