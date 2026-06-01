# 🔧 FIX: Column "bait_count" Does Not Exist

## 🐛 ERROR

```
Gagal memberikan akses: Failed to grant fishing access: 
column "bait_count" of relation "user_fishing_inventory" does not exist
```

## 🔍 PENYEBAB

Ada **trigger atau function database** yang masih menggunakan kolom lama `bait_count`, padahal kolom tersebut sudah diganti menjadi `bait_balance`.

### Kemungkinan Penyebab:
1. ✅ Trigger `create_fishing_inventory_on_access` masih pakai `bait_count`
2. ✅ Function `create_fishing_inventory_for_user()` masih pakai `bait_count`
3. ✅ Function `grant_bait()` masih pakai `bait_count`

## ✅ SOLUSI

### Step 1: Jalankan SQL Fix di Supabase

1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Pilih project: `rwngqiakigebtwxohiri`

2. **Buka SQL Editor**
   - Klik menu **SQL Editor** di sidebar kiri
   - Klik **New Query**

3. **Copy & Paste SQL Fix**
   - Buka file: `FIX_BAIT_COUNT_TRIGGER.sql`
   - Copy semua isinya
   - Paste ke SQL Editor

4. **Run Query**
   - Klik tombol **Run** atau tekan `Ctrl+Enter`
   - Tunggu sampai selesai (sekitar 5-10 detik)

5. **Verifikasi Output**
   Pastikan muncul pesan:
   ```
   ✅ Column bait_balance exists
   ✅ Column bait_count does not exist (correct)
   ✅ grant_bait function works! New balance: 100
   ✅ FIX COMPLETED - BAIT_COUNT TRIGGER UPDATED
   ```

### Step 2: Test di Production

1. **Login sebagai Admin**
   - Email: `satriarizkyananda27@gmail.com`
   - Password: `nanda900`

2. **Buka Admin Dashboard**
   - Klik menu **Admin** atau **Dashboard**

3. **Coba Berikan Akses Fishing**
   - Pilih user yang ingin diberi akses
   - Klik **Grant Fishing Access**
   - Masukkan durasi (misal: 30 hari)
   - Klik **Submit**

4. **Verifikasi**
   - Seharusnya muncul pesan sukses
   - Tidak ada error lagi

## 📝 APA YANG DIPERBAIKI

### 1. **Trigger Updated**
```sql
-- SEBELUM (Error)
INSERT INTO user_fishing_inventory (
  user_id,
  bait_count,  -- ❌ Kolom ini tidak ada
  ...
)

-- SESUDAH (Fixed)
INSERT INTO user_fishing_inventory (
  user_id,
  bait_balance,  -- ✅ Kolom yang benar
  ...
)
```

### 2. **Function grant_bait() Updated**
```sql
-- SEBELUM (Error)
UPDATE user_fishing_inventory
SET bait_count = bait_count + p_amount  -- ❌ Error

-- SESUDAH (Fixed)
UPDATE user_fishing_inventory
SET bait_balance = bait_balance + p_amount  -- ✅ Fixed
```

### 3. **Trigger create_fishing_inventory_on_access Updated**
Trigger sekarang menggunakan `bait_balance` di semua tempat.

## 🔍 VERIFIKASI

### Check Kolom di Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Check kolom yang ada
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
```

**Expected Output:**
```
column_name       | data_type
------------------|-----------
user_id           | uuid
bait_balance      | integer    ✅ (bukan bait_count)
fishing_saldo     | integer
total_fish_caught | integer
equipped_rod      | text
created_at        | timestamp
updated_at        | timestamp
```

### Check Trigger

```sql
-- Check trigger yang aktif
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'afk_access';
```

**Expected Output:**
```
trigger_name                          | event_object_table
--------------------------------------|-------------------
create_fishing_inventory_on_access    | afk_access
```

## 🚨 TROUBLESHOOTING

### Error: "bait_count still exists"

**Penyebab**: Kolom `bait_count` masih ada di database  
**Solusi**: Jalankan query ini untuk menghapusnya:

```sql
-- Hapus kolom bait_count jika masih ada
ALTER TABLE user_fishing_inventory 
DROP COLUMN IF EXISTS bait_count;

-- Pastikan bait_balance ada
ALTER TABLE user_fishing_inventory 
ADD COLUMN IF NOT EXISTS bait_balance INTEGER DEFAULT 0;
```

### Error: "function grant_bait does not exist"

**Penyebab**: Function belum dibuat  
**Solusi**: Jalankan `FIX_BAIT_COUNT_TRIGGER.sql` lagi

### Error: "permission denied"

**Penyebab**: RLS policy terlalu ketat  
**Solusi**: Pastikan menggunakan service_role key di environment variables

## 📋 CHECKLIST

Sebelum test, pastikan:

- [ ] SQL fix sudah dijalankan di Supabase
- [ ] Tidak ada error saat run SQL
- [ ] Verifikasi output menunjukkan ✅ semua
- [ ] Kolom `bait_balance` ada di tabel
- [ ] Kolom `bait_count` TIDAK ada di tabel
- [ ] Trigger `create_fishing_inventory_on_access` aktif
- [ ] Function `grant_bait` berfungsi

## 🎯 EXPECTED RESULT

Setelah fix:

1. ✅ Bisa memberikan akses fishing ke user tanpa error
2. ✅ User fishing inventory otomatis dibuat
3. ✅ Bait balance dimulai dari 0
4. ✅ Equipped rod default adalah `ez_rod`

## 📞 JIKA MASIH ERROR

Jika setelah menjalankan fix masih ada error:

1. **Screenshot error message**
2. **Check Supabase logs**:
   - Go to: Supabase Dashboard → Logs → Postgres Logs
   - Cari error terbaru
3. **Verify environment variables**:
   - `SUPABASE_URL` sudah benar
   - `SUPABASE_SERVICE_KEY` sudah benar (bukan anon key)

## 🔗 FILE TERKAIT

- `FIX_BAIT_COUNT_TRIGGER.sql` - SQL fix untuk trigger
- `FIX_ALL_FISHING_ISSUES.sql` - Fix kolom bait_balance
- `SCHEMA_COMPLETE.sql` - Schema lengkap database

---

**Last Updated**: 1 Juni 2026  
**Status**: ✅ READY TO FIX
