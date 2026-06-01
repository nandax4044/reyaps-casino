# 🔧 PANDUAN LENGKAP MEMPERBAIKI ERROR DEPLOYMENT

## 📋 Daftar Masalah yang Diperbaiki

1. ❌ **Error bait_count saat grant fishing access**
   - Error: `column "bait_count" of relation "user_fishing_inventory" does not exist`
   
2. ❌ **Error "Endpoint not found" saat grant rod**
   - Endpoint `/admin/fishing/grant-rod` belum ada

3. ✅ **Grant bait sudah benar** (tidak perlu diperbaiki)

4. ❌ **Error edit price config & data LB kosong**
   - Endpoint price config belum ada
   - Tabel leaderboard belum ada

---

## 🚀 LANGKAH PERBAIKAN

### STEP 1: Jalankan SQL Fix di Supabase

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda
   - Klik **SQL Editor** di sidebar kiri

2. **Copy & Paste SQL Fix**
   - Buka file: `FIX_DEPLOYMENT_ISSUES.sql`
   - Copy semua isi file
   - Paste ke SQL Editor
   - Klik **Run** atau tekan `Ctrl+Enter`

3. **Verifikasi Hasil**
   - Pastikan muncul pesan: `🎉 ALL FIXES APPLIED SUCCESSFULLY!`
   - Jika ada error, screenshot dan kirim ke saya

---

### STEP 2: Deploy Perubahan API ke Vercel

File `api/index.ts` sudah diperbaiki dengan endpoint baru:
- ✅ `/admin/fishing/grant-rod` - Grant rod access
- ✅ `/admin/fishing/revoke-rod` - Revoke rod access
- ✅ `/admin/fishing/user-rods/:userId` - Get user rods
- ✅ `/admin/fishing/access-list` - Get fishing access list
- ✅ `/admin/fishing/revoke-access` - Revoke fishing access
- ✅ `/admin/fishing/active` - Get active fishers
- ✅ `/admin/fishing/price-config` - Get/Update price config
- ✅ `/admin/fishing/price-config/reset` - Reset price config

**Deploy ke Vercel:**

```bash
# Commit perubahan
git add .
git commit -m "fix: Add missing fishing admin endpoints and fix bait_count error"

# Push ke repository
git push origin main
```

Vercel akan otomatis deploy perubahan Anda.

---

### STEP 3: Verifikasi Setelah Deploy

#### Test 1: Grant Fishing Access
1. Login sebagai admin
2. Buka Admin Dashboard → Fishing Management
3. Pilih user dan duration
4. Klik "Grant Access"
5. **Expected:** Sukses tanpa error `bait_count`

#### Test 2: Grant Rod Access
1. Masih di Fishing Management
2. Klik tab "Rod Management"
3. Pilih user dan rod
4. Klik "Grant Rod"
5. **Expected:** Sukses tanpa error `Endpoint not found`

#### Test 3: Grant Bait
1. Klik tab "Bait Management"
2. Pilih user dan amount
3. Klik "Grant Bait"
4. **Expected:** Sukses (sudah benar sebelumnya)

#### Test 4: Edit Price Config
1. Klik tab "Price Configuration"
2. Edit harga fish
3. Klik "Save Changes"
4. **Expected:** Sukses tanpa error

#### Test 5: Leaderboard
1. Buka halaman Fishing Game
2. Catch beberapa fish
3. Cek leaderboard
4. **Expected:** Data muncul dengan benar

---

## 🔍 TROUBLESHOOTING

### Jika masih error "bait_count does not exist"

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE user_fishing_inventory 
ADD COLUMN IF NOT EXISTS bait_balance INTEGER DEFAULT 0 NOT NULL;

-- Jika ada kolom bait_count, migrate data
UPDATE user_fishing_inventory 
SET bait_balance = COALESCE(bait_count, 0)
WHERE bait_count IS NOT NULL;

-- Drop kolom lama
ALTER TABLE user_fishing_inventory 
DROP COLUMN IF EXISTS bait_count;
```

### Jika masih error "Endpoint not found"

**Cek:**
1. Apakah file `api/index.ts` sudah ter-commit?
2. Apakah Vercel sudah selesai deploy?
3. Cek Vercel logs untuk error

**Vercel Logs:**
- Buka https://vercel.com/dashboard
- Pilih project Anda
- Klik tab "Deployments"
- Klik deployment terakhir
- Cek "Function Logs"

### Jika leaderboard kosong

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor
CREATE TABLE IF NOT EXISTS fish_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_id INTEGER NOT NULL,
  fish_name TEXT NOT NULL,
  lb NUMERIC(10, 2) NOT NULL,
  caught_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rod_used TEXT,
  is_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fish_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY fish_leaderboard_select_all ON fish_leaderboard 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_leaderboard_insert_own ON fish_leaderboard 
  FOR INSERT WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON fish_leaderboard TO service_role;
```

### Jika price config error

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor
CREATE TABLE IF NOT EXISTS fish_price_config (
  id TEXT PRIMARY KEY,
  fish_name TEXT NOT NULL,
  price_per_lb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default prices
INSERT INTO fish_price_config (id, fish_name, price_per_lb) VALUES
  ('wigly', 'Wigly', 5),
  ('cotd', 'Cotd', 30),
  ('goldenrod', 'Golden Rod', 2500),
  ('hatfishing', 'Fishing Hat', 7000),
  ('tgrod', 'Thanks Giving Rod', 10000)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE fish_price_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY fish_price_config_select_all ON fish_price_config 
  FOR SELECT USING (TRUE);

CREATE POLICY fish_price_config_update_admin ON fish_price_config 
  FOR UPDATE USING (TRUE);

-- Grant permissions
GRANT ALL ON fish_price_config TO service_role;
```

---

## ✅ CHECKLIST SETELAH DEPLOY

- [ ] SQL fix berhasil dijalankan di Supabase
- [ ] Kolom `bait_balance` ada di tabel `user_fishing_inventory`
- [ ] Trigger `create_fishing_inventory_on_access` ada
- [ ] Function `grant_bait` ada dan menggunakan `bait_balance`
- [ ] Tabel `fish_leaderboard` ada
- [ ] Tabel `fish_price_config` ada
- [ ] API changes ter-commit dan ter-push
- [ ] Vercel deployment sukses
- [ ] Test grant fishing access: ✅
- [ ] Test grant rod access: ✅
- [ ] Test grant bait: ✅
- [ ] Test edit price config: ✅
- [ ] Test leaderboard: ✅

---

## 📞 BANTUAN LEBIH LANJUT

Jika masih ada error setelah mengikuti panduan ini:

1. **Screenshot error message**
2. **Copy error dari console browser (F12)**
3. **Copy error dari Vercel logs**
4. **Kirim ke saya untuk analisis lebih lanjut**

---

## 🎯 RINGKASAN PERUBAHAN

### Database (Supabase)
- ✅ Kolom `bait_count` → `bait_balance`
- ✅ Trigger menggunakan `bait_balance`
- ✅ Function `grant_bait` menggunakan `bait_balance`
- ✅ Tabel `fish_leaderboard` dibuat
- ✅ Tabel `fish_price_config` dibuat
- ✅ RLS policies diperbaiki

### API (Vercel)
- ✅ Endpoint grant rod ditambahkan
- ✅ Endpoint revoke rod ditambahkan
- ✅ Endpoint get user rods ditambahkan
- ✅ Endpoint access list ditambahkan
- ✅ Endpoint revoke access ditambahkan
- ✅ Endpoint active fishers ditambahkan
- ✅ Endpoint price config ditambahkan
- ✅ Endpoint reset price config ditambahkan

---

**Semua perubahan sudah siap untuk deployment! 🚀**
