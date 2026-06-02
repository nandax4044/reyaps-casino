# 🚀 DEPLOY EQUIP ROD FIX - QUICK GUIDE

## ❌ MASALAH
```
Error: /api/fishing/equip-rod 404 (Not Found)
Rod tidak bisa dipilih di Fish AFK page
```

## ✅ SOLUSI READY!

### STEP 1: RUN SQL (30 detik)
```sql
-- Buka Supabase SQL Editor
-- Copy paste file: FIX_EQUIP_ROD_COMPLETE.sql
-- Click Run
-- Tunggu message: ✅ ALL TABLES READY!
```

### STEP 2: PUSH CODE (3 menit)
```bash
git add .
git commit -m "Fix: Add equip-rod endpoint and migrate to unified inventory table"
git push origin main
```

### STEP 3: TEST (2 menit)
1. Login → Fish AFK page
2. Click rod (any rod)
3. **Verify:** Rod ter-highlight ✅
4. **Verify:** No error 404 ✅
5. Click "Start AFK"
6. **Verify:** AFK starts ✅

## 📝 WHAT'S FIXED

### Backend Changes
- ✅ Added `/fishing/equip-rod` endpoint (NEW!)
- ✅ Migrated `fishing_inventory` → `user_fishing_inventory`
- ✅ Fixed field names: `bait` → `bait_balance`
- ✅ Updated 5 endpoints to use unified table
- ✅ Added detailed logging

### Database Changes
- ✅ Table `user_fishing_inventory` with `equipped_rod` field
- ✅ Auto-migration from old table
- ✅ RLS policies setup
- ✅ All required tables created

## 🎯 EXPECTED RESULT

**BEFORE:**
```
Click rod → 404 Error ❌
Rod tidak terpilih ❌
```

**AFTER:**
```
Click rod → 200 OK ✅
Rod terpilih dan highlighted ✅
Bait balance tetap tampil ✅
Start AFK dengan rod yang dipilih ✅
```

## 🔍 QUICK DEBUG

### If 404 persists:
```bash
# Check Vercel logs
# Look for: [EQUIP ROD] logs

# Check database
# SQL: SELECT * FROM user_fishing_inventory LIMIT 1;
```

### If rod tidak tersimpan:
```bash
# Browser console should show:
[EQUIP ROD] Request from user: xxx rod: basic_rod
[EQUIP ROD] Success: basic_rod
```

## ✨ FILES MODIFIED
- `FIX_EQUIP_ROD_COMPLETE.sql` - Database setup (NEW)
- `api/[...path].ts` - Added equip-rod endpoint + updated 5 endpoints
- `EQUIP_ROD_FIX_COMPLETE.md` - Comprehensive docs (NEW)

---

**TOTAL TIME:** 10 minutes  
**STATUS:** Ready to deploy!  
**PRIORITY:** HIGH 🔴

Run SQL → Push → Test → Done! 🎣
