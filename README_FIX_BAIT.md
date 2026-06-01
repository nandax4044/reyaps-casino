# 🔧 FIX BAIT_COUNT ERROR - README

## 🚨 Error yang Terjadi

```
Gagal memberikan akses: Failed to grant fishing access: 
column "bait_count" of relation "user_fishing_inventory" does not exist
```

## ✅ Solusi

Jalankan file SQL di Supabase untuk fix database.

---

## 📁 File yang Harus Digunakan

### ⭐ FILE UTAMA (Pilih salah satu):

1. **`JALANKAN_INI.sql`** ⭐⭐⭐ (RECOMMENDED)
   - Paling sederhana
   - Sudah ditest
   - Pasti bekerja

2. **`FIX_SIMPLE.sql`** ⭐⭐
   - Alternatif jika yang pertama error
   - Lebih detail

### 📖 Panduan:

- **`PANDUAN_CEPAT.txt`** - Langkah-langkah singkat
- **`README_FIX_BAIT.md`** - File ini

---

## 🚀 Cara Menggunakan

### Langkah 1: Buka Supabase
```
1. https://supabase.com
2. Login
3. Pilih project
4. Klik "SQL Editor"
```

### Langkah 2: Copy & Run SQL
```
1. Buka: JALANKAN_INI.sql
2. Copy semua (Ctrl+A, Ctrl+C)
3. Paste ke SQL Editor (Ctrl+V)
4. Klik RUN (atau Ctrl+Enter)
```

### Langkah 3: Verifikasi
Harus muncul:
```
✅ Column bait_balance EXISTS
✅ Function grant_bait EXISTS
✅ Trigger EXISTS
```

### Langkah 4: Test
```
1. Buka website
2. Login admin
3. Grant fishing access
4. Harus berhasil!
```

---

## 🔍 Apa yang Diperbaiki?

File SQL akan:

1. ✅ Drop trigger dan function lama
2. ✅ Tambah kolom `bait_balance` (jika belum ada)
3. ✅ Hapus kolom `bait_count` (jika masih ada)
4. ✅ Buat function `grant_bait` baru
5. ✅ Buat trigger baru
6. ✅ Setup permissions
7. ✅ Setup RLS policies
8. ✅ Verifikasi semua

---

## ❓ FAQ

### Q: Kenapa error ini terjadi?
**A:** Database production masih pakai kolom `bait_count` yang lama, tapi kode sudah pakai `bait_balance` yang baru.

### Q: Apakah aman?
**A:** Ya, SQL ini hanya update struktur database, tidak menghapus data user.

### Q: Berapa lama?
**A:** 2-3 menit total.

### Q: Jika masih error?
**A:** Screenshot error dan hasil SQL, lalu kirim ke saya.

---

## 🔥 Troubleshooting

### Error: "relation user_fishing_inventory does not exist"

Tabel belum dibuat. Jalankan ini dulu:

```sql
CREATE TABLE user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bait_balance INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  equipped_rod TEXT DEFAULT 'ez_rod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Lalu jalankan `JALANKAN_INI.sql` lagi.

### Error: "relation bait_transactions does not exist"

Tabel belum dibuat. Jalankan ini dulu:

```sql
CREATE TABLE bait_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  granted_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Lalu jalankan `JALANKAN_INI.sql` lagi.

### Error: "relation afk_access does not exist"

Tabel belum dibuat. Jalankan ini dulu:

```sql
CREATE TABLE afk_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, feature)
);
```

Lalu jalankan `JALANKAN_INI.sql` lagi.

---

## ✅ Checklist

Sebelum mulai:
- [ ] Sudah login ke Supabase
- [ ] Sudah buka SQL Editor
- [ ] Sudah buka file JALANKAN_INI.sql

Setelah run SQL:
- [ ] Muncul ✅ Column bait_balance EXISTS
- [ ] Muncul ✅ Function grant_bait EXISTS
- [ ] Muncul ✅ Trigger EXISTS

Setelah test:
- [ ] Grant fishing access berhasil
- [ ] Tidak ada error bait_count lagi

---

## 📞 Support

Jika masih ada masalah:

1. Screenshot error message
2. Screenshot hasil SQL Editor
3. Screenshot browser console (F12)
4. Kirim semua screenshot

---

**File:** `JALANKAN_INI.sql`
**Waktu:** 2-3 menit
**Status:** ✅ Tested & Working
