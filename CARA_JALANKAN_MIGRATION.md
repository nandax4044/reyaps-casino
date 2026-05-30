# 🚀 CARA JALANKAN MIGRATION - LANGKAH DEMI LANGKAH

## ✅ File SQL Sudah Diperbaiki!

File `migration_add_enterprise_features.sql` sudah diperbaiki dan siap dijalankan.

---

## 📋 LANGKAH-LANGKAH (Ikuti Urutan Ini!)

### Langkah 1: Buka Supabase Dashboard
1. Buka browser
2. Pergi ke: https://supabase.com/dashboard
3. Login dengan akun kamu
4. Pilih project ReyaBet kamu

### Langkah 2: Buka SQL Editor
1. Di sidebar kiri, cari menu **"SQL Editor"**
2. Klik menu tersebut
3. Klik tombol **"New query"** (atau gunakan query yang sudah ada)

### Langkah 3: Copy Script Migration
1. Buka VS Code
2. Buka file: `migration_add_enterprise_features.sql`
3. Tekan `Ctrl + A` (pilih semua)
4. Tekan `Ctrl + C` (copy)

### Langkah 4: Paste dan Jalankan
1. Kembali ke Supabase SQL Editor
2. Tekan `Ctrl + V` (paste script)
3. Pastikan SEMUA script ter-paste (scroll ke bawah untuk cek)
4. Klik tombol **"Run"** (biasanya warna hijau di pojok kanan bawah)

### Langkah 5: Tunggu Selesai
- Script akan berjalan beberapa detik
- Tunggu sampai muncul hasil

### Langkah 6: Cek Hasil
Kamu akan melihat tabel seperti ini:

```
table_name       | row_count | users_with_role
-----------------+-----------+----------------
users            | 2         | 2
chat_messages    | 0         | 0
online_sessions  | 0         | 0
site_content     | 9         | 0
role_badges      | 5         | 0
```

**Kalau muncul tabel ini = BERHASIL!** ✅

---

## ✅ Apa yang Ditambahkan?

### Kolom Baru di Tabel Users:
- ✅ `role` - Role user (Player, VIP, Moderator, Administrator, Owner)
- ✅ `avatar_url` - URL avatar user
- ✅ `last_seen` - Terakhir online

### Tabel Baru:
1. ✅ `chat_messages` - Pesan chat global
2. ✅ `chat_bans` - Ban user dari chat
3. ✅ `online_sessions` - Tracking pemain online
4. ✅ `site_content` - Konten website (CMS)
5. ✅ `news_posts` - Sistem berita
6. ✅ `media_library` - Manager file
7. ✅ `analytics_events` - Analytics
8. ✅ `role_badges` - Konfigurasi badge role

### Data Default:
- ✅ 9 konten website
- ✅ 5 role badges (Owner, Admin, Moderator, VIP, Player)

---

## 🎉 Setelah Migration Berhasil

### 1. Deploy ke Vercel
```bash
vercel --prod
```

### 2. Test Website
1. Buka website kamu
2. Login dengan akun
3. Lihat sidebar kanan:
   - ✅ Online Players (harus muncul)
   - ✅ Global Chat (harus bisa kirim pesan)
4. Main game (semua harus jalan)

---

## 🐛 Kalau Masih Error

### Error: "column role does not exist"
**Penyebab:** Script belum selesai dijalankan atau ada bagian yang terlewat

**Solusi:**
1. Pastikan kamu copy SEMUA isi file (dari baris pertama sampai terakhir)
2. Jalankan ulang script
3. Tunggu sampai selesai

### Error: "relation already exists"
**Ini NORMAL!** Script akan skip tabel yang sudah ada.

### Error: "permission denied"
**Solusi:** Pastikan kamu login sebagai owner project di Supabase

---

## 📊 Verifikasi Manual

Setelah migration, kamu bisa cek manual:

### Cek Kolom Role Ada:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';
```

Harus return: `role | character varying`

### Cek Tabel Baru:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_messages', 'online_sessions', 'site_content');
```

Harus return 3 tabel.

### Cek Data Default:
```sql
SELECT COUNT(*) FROM site_content;
SELECT COUNT(*) FROM role_badges;
```

Harus return: 9 dan 5

---

## ✅ Checklist

Sebelum deploy, pastikan:
- [ ] Migration script berhasil dijalankan
- [ ] Tabel `chat_messages` ada
- [ ] Tabel `online_sessions` ada
- [ ] Tabel `site_content` ada (9 rows)
- [ ] Tabel `role_badges` ada (5 rows)
- [ ] Kolom `role` ada di tabel `users`
- [ ] Build berhasil: `npm run build`

Kalau semua ✅, kamu siap deploy!

---

## 🚀 Deploy Sekarang!

```bash
# Build dulu (pastikan no error)
npm run build

# Deploy ke Vercel
vercel --prod

# Test website
# Buka URL Vercel kamu
```

---

**Status:** ✅ Script sudah diperbaiki
**File:** migration_add_enterprise_features.sql
**Siap:** Ya, langsung jalankan!

🎉 **Selamat mencoba!** 🎉
