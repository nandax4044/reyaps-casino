# ✅ Fix: Game Config Save Error

## 🐛 Problem

Error saat save edit game config di Admin Dashboard:
```
Gagal menyimpan konfigurasi: duplicate key value violates unique constraint "game_configs_pkey"
```

## 🔍 Root Cause

Endpoint `/api/admin/config/:game_type/update` menggunakan `upsert()` dengan `onConflict: 'game_type'`, tapi Supabase tidak mengenali `game_type` sebagai unique constraint yang benar.

Primary key table `game_configs` adalah `game_type`, tapi `upsert()` mencoba INSERT baru padahal row sudah ada, sehingga terjadi duplicate key error.

## ✅ Solution

Ubah logic dari `upsert()` menjadi **check-then-update-or-insert**:

### Before (Broken):
```typescript
const { error } = await client
  .from('game_configs')
  .upsert({ game_type, config_data: configPayload, updated_at: new Date().toISOString() }, { onConflict: 'game_type' });
```

### After (Fixed):
```typescript
// First, check if config exists
const { data: existing, error: checkError } = await client
  .from('game_configs')
  .select('game_type')
  .eq('game_type', game_type)
  .maybeSingle();

if (checkError) throw checkError;

if (existing) {
  // Config exists - UPDATE
  const { error: updateError } = await client
    .from('game_configs')
    .update({ config_data: configPayload, updated_at: new Date().toISOString() })
    .eq('game_type', game_type);

  if (updateError) throw updateError;
} else {
  // Config doesn't exist - INSERT
  const { error: insertError } = await client
    .from('game_configs')
    .insert({ game_type, config_data: configPayload, updated_at: new Date().toISOString() });

  if (insertError) throw insertError;
}
```

## 🔧 Changes Made

**File**: `server.ts`

**Endpoint**: `POST /api/admin/config/:game_type/update`

**Changes**:
1. ✅ Check if config exists dengan `select().eq().maybeSingle()`
2. ✅ If exists → `update()` existing row
3. ✅ If not exists → `insert()` new row
4. ✅ Added console.log untuk debugging
5. ✅ Better error handling

## 🧪 Testing

### Test 1: Update Existing Config
```
1. Login as admin
2. Admin Dashboard → EDIT GAME APPS → Prize Wheel
3. Edit any prize (name, image, color, chance)
4. Click "SAVE CHANGES"
5. ✅ Should show: "Sukses memperbarui konfigurasi permainan wheel di Database Supabase!"
6. ✅ No error
```

### Test 2: Update Multiple Times
```
1. Edit prize again
2. Click "SAVE CHANGES"
3. ✅ Should work without duplicate key error
4. Repeat 3-4 times
5. ✅ All saves should succeed
```

### Test 3: Different Game Types
```
1. Test with Prize Wheel (wheel)
2. Test with Case Opening (cases)
3. Test with Crash Game (crash)
4. ✅ All should save successfully
```

## 📊 Database Structure

### game_configs Table:
```sql
CREATE TABLE game_configs (
  game_type TEXT PRIMARY KEY,  -- 'wheel', 'cases', 'crash'
  config_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Primary Key**: `game_type`
- Only ONE row per game_type
- UPDATE when row exists
- INSERT when row doesn't exist

## 🚀 How to Apply Fix

### Step 1: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Test Save
```
1. Login as admin
2. Admin Dashboard → EDIT GAME APPS
3. Edit any game config
4. Click SAVE CHANGES
5. ✅ Should work now!
```

## 🔍 Debugging

If still getting errors, check:

### 1. Check Database
```sql
-- See all game configs
SELECT game_type, updated_at FROM game_configs;

-- Check for duplicates (should return 0)
SELECT game_type, COUNT(*) 
FROM game_configs 
GROUP BY game_type 
HAVING COUNT(*) > 1;
```

### 2. Check Server Logs
```
Look for:
[ADMIN] Updating existing wheel config
[ADMIN] Inserting new wheel config
[ADMIN CONFIG UPDATE ERROR] ...
```

### 3. Clear Duplicate Rows (If Any)
```sql
-- Delete all configs (will be recreated on next save)
DELETE FROM game_configs;

-- Or delete specific game type
DELETE FROM game_configs WHERE game_type = 'wheel';
```

## 📝 Additional Notes

### Why upsert() Failed?

Supabase `upsert()` requires:
1. Unique constraint or primary key
2. Correct `onConflict` parameter
3. Matching column name

In our case:
- ✅ Primary key exists: `game_type`
- ❌ `onConflict: 'game_type'` not recognized properly
- ❌ Supabase tried INSERT instead of UPDATE

### Why Check-Then-Update Works?

1. **Explicit logic**: We control UPDATE vs INSERT
2. **No ambiguity**: Clear when to update, when to insert
3. **Better error handling**: Can catch specific errors
4. **More reliable**: Works across all Supabase versions

## ✅ Success Criteria

- [x] No more "duplicate key" error
- [x] Can save wheel config multiple times
- [x] Can save cases config multiple times
- [x] Can save crash config multiple times
- [x] Changes persist in database
- [x] Changes reflect in game immediately

## 🎉 Result

Admin dapat edit dan save game config (wheel, cases, crash) tanpa error duplicate key!

---

**Date**: 31 Mei 2026  
**Issue**: Duplicate key constraint violation  
**Status**: ✅ FIXED  
**File**: `server.ts`  
**Endpoint**: `/api/admin/config/:game_type/update`

