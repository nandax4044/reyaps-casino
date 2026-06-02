# 🔧 CARA FIX: Fishing Access Error

## ❌ ERROR YANG TERJADI

```
Gagal memberikan akses: Could not find the table 'public.fishing_access' in the schema cache
```

## 🎯 ROOT CAUSE

Table `fishing_access` **TIDAK ADA** di database Supabase. Backend code mencoba insert ke table yang tidak exist.

## ✅ SOLUSI LENGKAP (3 LANGKAH)

---

### 📋 LANGKAH 1: Buka Supabase SQL Editor

1. Buka browser → https://supabase.com/dashboard
2. Login ke account Supabase
3. Pilih project: **rwngqiakigebtwxohiri**
4. Klik menu **SQL Editor** (di sidebar kiri)
5. Klik **+ New Query** (tombol hijau)

---

### 📋 LANGKAH 2: Jalankan SQL Script

1. Buka file: **`FIX_FISHING_ACCESS_TABLE.sql`** (file ini ada di root project)
2. Copy **SELURUH ISI** file tersebut
3. Paste ke SQL Editor di Supabase
4. Klik tombol **RUN** (atau tekan Ctrl+Enter)
5. Tunggu sampai muncul pesan:
   ```
   🎉 SUCCESS! ALL FISHING TABLES READY!
   ```

**Apa yang dibuat oleh script ini?**
- ✅ Table `fishing_access` (untuk track user yang punya akses fishing)
- ✅ Table `user_rods` (untuk track rod ownership)
- ✅ Table `fishing_inventory` (untuk track bait & fishing saldo)
- ✅ Table `fish_inventory` (untuk log ikan yang ditangkap)
- ✅ RLS Policies (untuk security)
- ✅ Permissions (untuk service_role & authenticated users)

---

### 📋 LANGKAH 3: Test Grant Access

1. **Login sebagai admin** di aplikasi
2. Pergi ke **Admin Panel → Fishing Management**
3. Tab **"Access Management"**
4. Klik **"Beri Akses Baru"**
5. Pilih user dari dropdown
6. Set duration: **7 hari**
7. Klik **Grant**

**Expected Result:**
- ✅ Muncul alert: "Akses fishing berhasil diberikan!"
- ✅ Access list langsung update
- ✅ User muncul di list dengan status "Active"
- ✅ **TIDAK ADA ERROR** lagi!

---

## 🧪 VERIFICATION CHECKLIST

Setelah menjalankan SQL script, verify di Supabase:

### Cek Tables di Supabase
1. Buka Supabase Dashboard
2. Klik **Table Editor** (di sidebar)
3. Verify tables ada:
   - ✅ `fishing_access`
   - ✅ `user_rods`
   - ✅ `fishing_inventory`
   - ✅ `fish_inventory`

### Cek Schema dari Table fishing_access
Klik table `fishing_access` → Verify columns:
- ✅ `id` (uuid, primary key)
- ✅ `user_id` (uuid, foreign key to auth.users)
- ✅ `granted_by` (uuid, nullable)
- ✅ `expires_at` (timestamptz)
- ✅ `is_active` (boolean)
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

---

## 🚨 TROUBLESHOOTING

### Error: "relation auth.users does not exist"

**Solusi**: Ganti `auth.users` dengan `users` di SQL script:
```sql
-- BEFORE
REFERENCES auth.users(id) ON DELETE CASCADE

-- AFTER
REFERENCES users(id) ON DELETE CASCADE
```

### Error: "permission denied for table"

**Solusi**: Jalankan grant permissions lagi:
```sql
GRANT ALL ON fishing_access TO service_role, anon, authenticated;
GRANT ALL ON user_rods TO service_role, anon, authenticated;
GRANT ALL ON fishing_inventory TO service_role, anon, authenticated;
GRANT ALL ON fish_inventory TO service_role, anon, authenticated;
```

### Error masih muncul setelah run SQL

**Solusi**: Clear Supabase cache
1. Di Supabase Dashboard → klik **Settings**
2. Klik **API**
3. Klik **Restart Server** (tombol merah)
4. Tunggu 30 detik
5. Test lagi

---

## 📊 BEFORE vs AFTER

### ❌ BEFORE (ERROR)
```
Admin clicks "Grant Access"
↓
Backend tries: INSERT INTO fishing_access ...
↓
ERROR: table 'fishing_access' does not exist
↓
Frontend shows: "Gagal memberikan akses: Could not find the table..."
```

### ✅ AFTER (SUCCESS)
```
Admin clicks "Grant Access"
↓
Backend: INSERT INTO fishing_access (user_id, granted_by, expires_at, ...)
↓
SUCCESS: Row inserted with ID abc-123-def
↓
Frontend: "Akses fishing berhasil diberikan!"
↓
Access list updates with new user
```

---

## 🎯 QUICK REFERENCE

**File SQL**: `FIX_FISHING_ACCESS_TABLE.sql`

**Supabase Project**: `rwngqiakigebtwxohiri`

**URL**: https://rwngqiakigebtwxohiri.supabase.co

**Tables Created**:
1. fishing_access
2. user_rods
3. fishing_inventory
4. fish_inventory

**Test Endpoint**: `/api/admin/fishing/grant-access` (POST)

**Expected Behavior**: Insert row ke `fishing_access`, return success response

---

## ✅ SUCCESS INDICATORS

Kamu tahu fix berhasil jika:

1. ✅ SQL script run tanpa error
2. ✅ Verification message muncul di SQL Editor
3. ✅ Table `fishing_access` muncul di Table Editor
4. ✅ Grant access dari Admin Panel berhasil tanpa error
5. ✅ Access list langsung update dengan username yang benar
6. ✅ User yang diberi access muncul dengan status "Active"

---

## 🚀 DEPLOY SETELAH FIX

Setelah tables dibuat, deploy ulang API:

```powershell
git add .
git commit -m "fix: create missing fishing_access table"
git push origin main
```

Deployment time: ~2-3 menit

---

## 👥 NOTIFY USERS

Setelah fix berhasil:

1. Test sendiri dulu (grant access ke test user)
2. Verify user bisa lihat Fishing page
3. Notify users: "Fishing access system sudah fixed! Silakan request akses ke admin."

---

**STATUS**: ⏳ WAITING FOR SQL EXECUTION

**NEXT**: Jalankan `FIX_FISHING_ACCESS_TABLE.sql` di Supabase SQL Editor
