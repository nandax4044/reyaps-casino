# 🔧 Database Fix Package

## 📁 File-file Penting

### 1. `cleanup_database.sql` ⭐ **WAJIB DIJALANKAN DULU!**
Script untuk membersihkan database dari data duplikat dan memastikan semua permission benar.

**Cara pakai:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file ini
3. Klik RUN
4. Restart server

### 2. `verify_database.sql` ✅ **Untuk Cek Status**
Script untuk mengecek apakah database sudah benar atau masih ada masalah.

**Cara pakai:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file ini
3. Klik RUN
4. Lihat hasilnya:
   - ✅ = Bagus
   - ⚠️ = Warning (tidak masalah)
   - ❌ = Error (harus diperbaiki)

### 3. `schema_final.sql` 🏗️ **Schema Lengkap**
Schema database lengkap dengan semua tabel, trigger, dan permission.

**Kapan dipakai:**
- Jika mau reset database dari awal
- Jika tabel hilang atau rusak
- Jika mau setup database baru

**PERINGATAN:** Script ini akan **HAPUS SEMUA DATA**! Backup dulu jika perlu.

### 4. `FIX_INSTRUCTIONS.md` 📖 **Panduan Lengkap**
Panduan step-by-step untuk memperbaiki semua masalah.

**Isi:**
- Penjelasan masalah
- Langkah-langkah perbaikan
- Cara test semua fitur
- Troubleshooting

## 🚀 Quick Start (Perbaikan Cepat)

### Jika website error "Cannot coerce to single JSON object":

```bash
# 1. Jalankan cleanup_database.sql di Supabase SQL Editor
# 2. Restart server
npm run dev
# 3. Test chest game dan wheel game
```

### Jika item tidak masuk inventory:

```bash
# 1. Jalankan cleanup_database.sql di Supabase SQL Editor
# 2. Jalankan verify_database.sql untuk cek RLS status
# 3. Restart server
npm run dev
# 4. Test lagi
```

### Jika admin tidak bisa save config:

```sql
-- Jalankan di Supabase SQL Editor:
UPDATE public.users 
SET is_staff = true 
WHERE username = 'nanddev'; -- ganti dengan username kamu
```

## 📊 Status Checklist

Setelah menjalankan `cleanup_database.sql`, pastikan:

- [ ] Server restart tanpa error
- [ ] Tidak ada log error "Cannot coerce..." di terminal
- [ ] Chest game bisa dibuka
- [ ] Item masuk ke inventory setelah buka chest
- [ ] Wheel game bisa di-spin
- [ ] Item masuk ke inventory setelah spin wheel
- [ ] Admin bisa save config
- [ ] Admin bisa reset config
- [ ] Admin bisa clear inventory

## 🆘 Masih Error?

1. **Jalankan `verify_database.sql`** untuk lihat status detail
2. **Screenshot error** dari:
   - Terminal server
   - Browser console (F12)
   - Supabase SQL Editor
3. **Kirim screenshot** untuk analisis lebih lanjut

## 📝 Catatan Teknis

### Penyebab Error "Cannot coerce to single JSON object"

Error ini terjadi karena:
1. Ada **data duplikat** di tabel `game_configs`
2. Query menggunakan `.single()` tapi dapat multiple rows
3. Supabase tidak tahu row mana yang harus dipilih

### Solusi yang Diterapkan

1. **Di server.ts**: Query diubah dari `.single()` ke `.select()` (return array)
2. **Di cleanup script**: Hapus semua duplikat dengan `DELETE FROM game_configs`
3. **Di reset endpoint**: Hapus dulu sebelum insert (prevent future duplicates)

### Kenapa RLS Disabled?

RLS (Row Level Security) di-disable untuk development karena:
1. Lebih mudah untuk testing
2. Tidak perlu setup policy yang kompleks
3. Semua operasi langsung berhasil tanpa permission error

**PENTING:** Untuk production, sebaiknya RLS di-enable lagi dengan policy yang benar!

## 🎯 Next Steps

Setelah semua berfungsi:

1. **Backup database** secara berkala
2. **Monitor logs** untuk error baru
3. **Test semua fitur** setelah update code
4. **Setup RLS** untuk production (optional)

---

**Last Updated:** 2026-05-29
**Status:** Ready to use ✅
