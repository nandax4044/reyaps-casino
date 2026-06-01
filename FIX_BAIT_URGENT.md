# 🚨 URGENT FIX - BAIT BALANCE COLUMN MISSING

## ❌ ERROR:
```
column user_fishing_inventory.bait_balance does not exist
```

## ✅ SOLUSI CEPAT (2 LANGKAH):

### LANGKAH 1: RUN SQL FIX

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project: `rwngqiakigebtwxohiri`
3. Klik "SQL Editor" → "New Query"
4. Copy paste SQL berikut:

```sql
-- Add bait_balance column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_fishing_inventory' 
    AND column_name = 'bait_balance'
  ) THEN
    ALTER TABLE user_fishing_inventory 
    ADD COLUMN bait_balance INTEGER DEFAULT 0;
    
    RAISE NOTICE '✅ Added bait_balance column';
    
    -- Migrate from old column if exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_fishing_inventory' 
      AND column_name = 'bait_count'
    ) THEN
      UPDATE user_fishing_inventory 
      SET bait_balance = bait_count;
      
      ALTER TABLE user_fishing_inventory 
      DROP COLUMN bait_count;
      
      RAISE NOTICE '✅ Migrated from bait_count';
    END IF;
  END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
ORDER BY ordinal_position;
```

5. Klik "Run" atau tekan Ctrl+Enter
6. **VERIFY**: Harus muncul list columns, dan ada `bait_balance`

---

### LANGKAH 2: RESTART SERVER

```bash
# Stop server (Ctrl+C)
npm run dev:no-watch
```

---

### LANGKAH 3: GRANT BAIT LAGI

1. Login admin: nanddev / nanda900
2. Admin Dashboard → Fishing Management → Bait Management
3. Grant 700 bait ke user
4. **Cek console**: Harus ada "✅ Grant bait RPC success! New balance: 700"

---

### LANGKAH 4: TEST FISHING

1. Fishing AFK page
2. **Cek Bait Balance**: Harus muncul 700
3. Start AFK Fishing
4. **Cek console**: Harus ada "✅✅✅ Caught ..." (TIDAK ada error ❌)

---

## 🎯 SUCCESS INDICATORS:

### Console Log (HARUS ADA):
```
[AFK-FISHING] user_id: Starting catch attempt...
[AFK-FISHING] user_id: 📊 Current stats - Bait: 700, Balance: 0 WL, Fish: 0
[AFK-FISHING] user_id: 🎣 Generated fish: Orca 45LB → 9 WL
[AFK-FISHING] user_id: ✅ Fish record inserted
[AFK-FISHING] user_id: ✅ Balance updated
[AFK-FISHING] user_id: ✅ Fish count incremented
[AFK-FISHING] user_id: ✅ Bait decreased
[AFK-FISHING] user_id: ✅✅✅ Caught Orca 45LB → +9 WL (Bait: 700 → 699)
```

### UI Display:
```
Bait Balance: 700 (harus muncul!)
Balance: 0 → 9 → 18 ... (naik)
Total Fish: 0 → 1 → 2 ... (naik)
```

---

## ❌ JIKA MASIH ERROR:

### Error: "column bait_balance does not exist"
**Berarti SQL fix belum dijalankan atau gagal**

Solusi:
1. Cek di Supabase SQL Editor apakah ada error saat run SQL
2. Coba run SQL manual:
```sql
ALTER TABLE user_fishing_inventory 
ADD COLUMN bait_balance INTEGER DEFAULT 0;
```
3. Verify dengan:
```sql
SELECT * FROM user_fishing_inventory LIMIT 1;
```
Harus ada column `bait_balance`

---

### Error: "bait_balance is null"
**Berarti column ada tapi tidak ada data**

Solusi:
1. Grant bait lagi via admin panel
2. Atau update manual:
```sql
UPDATE user_fishing_inventory 
SET bait_balance = 700 
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb';
```

---

## 🔍 VERIFY DATABASE:

```sql
-- Check column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_fishing_inventory'
AND column_name = 'bait_balance';

-- Check user data
SELECT user_id, bait_balance, fishing_saldo, total_fish_caught
FROM user_fishing_inventory
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb';
```

**Expected**:
- Column `bait_balance` exists with type `integer`
- User row has `bait_balance = 700` (or whatever you granted)

---

## 📝 SUMMARY:

**Problem**: Database schema outdated, missing `bait_balance` column

**Solution**: 
1. Add column via SQL
2. Restart server
3. Grant bait
4. Test fishing

**Time**: 5 minutes

---

## 🎉 AFTER FIX:

Fishing akan berjalan normal:
- ✅ Bait balance muncul di UI
- ✅ Fishing tidak stop sendiri
- ✅ Balance naik setiap catch
- ✅ Bait turun setiap catch
- ✅ Total fish naik setiap catch

---

**File ini adalah URGENT FIX untuk masalah column missing!**

**Setelah fix ini, lanjutkan dengan `FIX_RLS_POLICIES.sql` untuk fix RLS policies!**
