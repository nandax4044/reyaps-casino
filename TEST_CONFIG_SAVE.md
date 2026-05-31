# 🧪 Test: Game Config Save Fix

## ✅ Fix Applied

File `server.ts` sudah diperbaiki. Endpoint `/api/admin/config/:game_type/update` sekarang menggunakan check-then-update-or-insert logic.

## 🚀 How to Test

### Step 1: Start Server
```bash
npm run dev
```

Wait for:
```
VITE v5.0.0  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### Step 2: Login as Admin
```
1. Open http://localhost:5173
2. Login with admin account
3. Click "Admin Dashboard" button
```

### Step 3: Test Save Wheel Config
```
1. Click tab "EDIT GAME APPS"
2. Select "Prize Wheel"
3. Edit any prize:
   - Change name: "Test Prize"
   - Change color: #ff0000
   - Change chance: 15
4. Click "SAVE CHANGES" button at bottom
5. ✅ Should show green success message
6. ✅ No error about duplicate key
```

### Step 4: Test Multiple Saves
```
1. Edit same prize again
2. Change name: "Test Prize 2"
3. Click "SAVE CHANGES"
4. ✅ Should work again
5. Repeat 2-3 more times
6. ✅ All saves should succeed
```

### Step 5: Test Other Game Types
```
1. Select "Case Opening"
2. Edit any chest or item
3. Click "SAVE CHANGES"
4. ✅ Should work

5. Select "Crash Game"
6. Edit any setting
7. Click "SAVE CHANGES"
8. ✅ Should work
```

## 🔍 Expected Results

### Success Message:
```
✅ Sukses memperbarui konfigurasi permainan wheel di Database Supabase!
```

### Console Log (Server):
```
[ADMIN] Updating existing wheel config
```
or
```
[ADMIN] Inserting new wheel config
```

### No Errors:
```
❌ Should NOT see:
"Gagal menyimpan konfigurasi: duplicate key value violates unique constraint"
```

## 🐛 If Still Getting Errors

### Option 1: Clear Database
```sql
-- Run in Supabase SQL Editor
DELETE FROM game_configs WHERE game_type = 'wheel';
```

Then try save again (will INSERT new row).

### Option 2: Check Server Logs
```
Look for error messages in terminal:
[ADMIN CONFIG UPDATE ERROR] ...
```

### Option 3: Verify Database Schema
```sql
-- Check primary key
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'game_configs';

-- Should show:
-- game_configs_pkey | PRIMARY KEY
```

### Option 4: Manual Test Query
```sql
-- Test if config exists
SELECT game_type FROM game_configs WHERE game_type = 'wheel';

-- If exists, UPDATE should work:
UPDATE game_configs 
SET config_data = '{"test": true}'::jsonb 
WHERE game_type = 'wheel';

-- If not exists, INSERT should work:
INSERT INTO game_configs (game_type, config_data) 
VALUES ('wheel', '{"test": true}'::jsonb);
```

## 📊 Database State

### Before Fix:
```
game_configs table:
- wheel config exists
- Try to save → upsert() → tries INSERT → duplicate key error ❌
```

### After Fix:
```
game_configs table:
- wheel config exists
- Try to save → check exists → UPDATE → success ✅
```

## ✅ Success Checklist

- [ ] Server started without errors
- [ ] Logged in as admin
- [ ] Opened Admin Dashboard
- [ ] Selected Prize Wheel
- [ ] Edited a prize
- [ ] Clicked SAVE CHANGES
- [ ] Saw success message (green)
- [ ] No duplicate key error
- [ ] Saved again successfully
- [ ] Tested Case Opening (optional)
- [ ] Tested Crash Game (optional)

## 🎉 Expected Outcome

Admin dapat edit dan save game config berkali-kali tanpa error!

---

**Next Steps**:
1. Start server: `npm run dev`
2. Test save wheel config
3. Verify success message
4. Done! ✅

