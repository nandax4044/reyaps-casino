# Quick Fix Guide - Fishing System

## 🚨 Problem
- Balance tidak bertambah saat dapat ikan
- Total ikan tetap 0
- Bait selalu 0

## ✅ Solution (3 Steps)

### Step 1: Run SQL Fix
1. Buka Supabase Dashboard
2. Go to SQL Editor
3. Copy isi file `FIX_RLS_POLICIES.sql`
4. Paste dan Run
5. Tunggu success message

### Step 2: Restart Server
```bash
# Stop server (Ctrl+C di terminal)
# Start lagi
npm run dev
```

### Step 3: Grant Bait
1. Login sebagai admin (nanddev / nanda900)
2. Buka Admin Dashboard
3. Klik "Fishing Management"
4. Klik tab "Bait Management"
5. Pilih user
6. Masukkan jumlah bait (contoh: 100)
7. Klik "Grant Bait"

## 🎣 Test Fishing

1. Login sebagai user
2. Buka "Fishing AFK"
3. Cek bait balance (harus muncul angka)
4. Pilih rod (EZ Rod)
5. Klik "Start AFK Fishing"
6. Tunggu beberapa detik
7. Cek console log (harus ada "Caught ...")
8. Cek balance (harus naik)
9. Cek total fish (harus naik)
10. Cek bait (harus turun 1 per catch)

## ✅ Expected Results

```
Balance: 0 → 5 → 12 → 18 ... (naik terus)
Total Fish: 0 → 1 → 2 → 3 ... (naik terus)
Bait: 100 → 99 → 98 → 97 ... (turun 1 per catch)
```

## 📝 Console Log Example
```
[AFK-FISHING] user_id: Caught Orca 45LB → +9 WL (Bait: 100 → 99)
[AFK-FISHING] user_id: Caught Salmon 23LB → +4 WL (Bait: 99 → 98)
```

## ❓ Still Not Working?

### Check 1: Bait Balance
```sql
-- Run in Supabase SQL Editor
SELECT * FROM user_fishing_inventory 
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb';
```
Should show `bait_balance > 0`

### Check 2: RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename IN ('user_fishing_inventory', 'fish_inventory', 'fishing_logs');
```
Should show policies with `_system` suffix

### Check 3: Server Logs
Look for errors in terminal:
- ❌ "RLS policy violation" = Run FIX_RLS_POLICIES.sql
- ❌ "No bait" = Grant bait via admin panel
- ✅ "Caught ..." = Working correctly!

## 🎉 Success Indicators

- ✅ Balance increases every 5-10 seconds
- ✅ Total fish count goes up
- ✅ Bait decreases by 1 per catch
- ✅ Console shows catch logs
- ✅ No errors in console

## Files to Run
1. `FIX_RLS_POLICIES.sql` - Run in Supabase (REQUIRED)
2. Server restart - `npm run dev` (REQUIRED)
3. Grant bait - Via admin panel (REQUIRED)

That's it! 🚀
