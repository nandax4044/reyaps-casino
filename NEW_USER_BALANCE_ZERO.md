# ✅ New User Starting Balance = 0

## 📋 Overview

User baru yang register sekarang mendapat saldo 0 WL (tidak ada bonus gratis). User harus deposit untuk mendapat saldo.

---

## 🎯 Changes Made

### 1. Server.ts - Register Endpoint

**Location**: Line ~222 and ~257

**Before**:
```typescript
balance: 500.00  // User baru dapat 500 WL gratis
```

**After**:
```typescript
balance: 0.00  // User baru mulai dengan 0 WL
```

**Impact**: 
- User register via Supabase Auth → balance 0
- User register via local memory → balance 0

---

### 2. Database Schema Files

**Files Updated**:
- `schema.sql`
- `schema_enterprise.sql`
- `schema_final.sql`

**Before**:
```sql
balance NUMERIC(15, 2) NOT NULL DEFAULT 500.00
```

**After**:
```sql
balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00
```

**Impact**: Table default value = 0

---

### 3. Database Trigger Function

**File**: `schema.sql` (and others)

**Function**: `handle_new_user()`

**Before**:
```sql
INSERT INTO public.users (id, email, username, balance, is_staff)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
  500.00,  -- Old value
  FALSE
)
```

**After**:
```sql
INSERT INTO public.users (id, email, username, balance, is_staff)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
  0.00,  -- New value
  FALSE
)
```

**Impact**: Auto-created users via trigger → balance 0

---

## 🚀 How to Apply

### Step 1: Code Changes (Already Done)
✅ `server.ts` updated
✅ `schema.sql` updated
✅ `schema_enterprise.sql` updated
✅ `schema_final.sql` updated

### Step 2: Update Database Trigger
```
1. Login to https://supabase.com
2. Open SQL Editor
3. Copy all from: migration_update_starting_balance.sql
4. Paste and click RUN
5. Wait for success message
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Test Registration
```
1. Logout from app
2. Register new account
3. Login with new account
4. Check balance
5. ✅ Should be 0 WL
```

---

## 🧪 Testing

### Test 1: New User Registration
```
1. Open app in incognito/private window
2. Click "Daftar Akun Baru"
3. Fill form:
   - Email: test@example.com
   - Username: testuser
   - Password: test123
4. Click "DAFTAR SEKARANG"
5. Login with new account
6. Check balance in dashboard
7. ✅ Expected: 0 WL
```

### Test 2: Existing Users Not Affected
```
1. Login with existing account
2. Check balance
3. ✅ Expected: Balance unchanged (not reset to 0)
```

### Test 3: Admin Can Add Balance
```
1. Login as admin
2. Admin Dashboard → KONTROL USER
3. Select any user
4. Click "Beri Saldo" button
5. Set balance: 10000
6. Click "UPDATE SALDO PLAYER"
7. ✅ Expected: User balance updated to 10000 WL
```

---

## 📊 Comparison

### Before:
| Action | Balance |
|--------|---------|
| Register new account | 500 WL |
| Can play immediately | ✅ Yes |
| Need deposit | ❌ No |

### After:
| Action | Balance |
|--------|---------|
| Register new account | 0 WL |
| Can play immediately | ❌ No |
| Need deposit | ✅ Yes |

---

## 💰 How Users Get Balance

### Method 1: Deposit (Recommended)
```
1. Login to account
2. Click "Deposit" button
3. Opens Discord: https://discord.gg/ZHF2N94p5
4. Contact staff for deposit
5. Staff adds balance via Admin Dashboard
```

### Method 2: Admin Manual Add
```
1. Admin logs in
2. Admin Dashboard → KONTROL USER
3. Select user
4. Click "Beri Saldo"
5. Enter amount
6. Click "UPDATE SALDO PLAYER"
```

### Method 3: Win from Games (if has balance)
```
1. User plays games (wheel, cases, crash)
2. Wins prizes or balance
3. Balance increases
```

---

## 🔒 Security Benefits

### Before (500 WL Free):
- ❌ Users can create multiple accounts
- ❌ Abuse free balance
- ❌ Play without deposit
- ❌ No commitment

### After (0 WL Start):
- ✅ Users must deposit to play
- ✅ Prevents multi-account abuse
- ✅ Real money commitment
- ✅ Better user quality

---

## 📝 Important Notes

### 1. Existing Users
- ✅ **NOT AFFECTED** - Keep current balance
- ✅ No balance reset
- ✅ Can continue playing

### 2. New Users
- ✅ Start with 0 WL
- ✅ Must deposit to play
- ✅ Contact staff via Discord

### 3. Admin Control
- ✅ Can manually add balance
- ✅ Can adjust any user balance
- ✅ Full control via Admin Dashboard

### 4. Games Requirement
- Wheel: 2,000 WL per spin
- Cases: Varies by chest (500-5000 WL)
- Crash: Minimum bet varies

---

## 🐛 Troubleshooting

### Problem 1: New user still gets 500 WL
**Solution**:
1. Check if migration ran successfully
2. Restart server
3. Clear browser cache
4. Try register again

### Problem 2: Existing user balance reset to 0
**Solution**:
1. This should NOT happen
2. Check database logs
3. Restore balance via Admin Dashboard
4. Contact developer

### Problem 3: Can't add balance via admin
**Solution**:
1. Check admin privileges (is_staff = true)
2. Check server logs for errors
3. Verify Supabase connection
4. Try refresh page

---

## 🔄 Rollback (If Needed)

If you need to restore 500 WL starting balance:

### Step 1: Update Code
```typescript
// In server.ts
balance: 500.00  // Change back from 0.00
```

### Step 2: Update Database
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.users 
ALTER COLUMN balance SET DEFAULT 500.00;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, balance, is_staff)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    500.00,  -- Restored
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

### Step 3: Restart Server
```bash
npm run dev
```

---

## ✅ Success Criteria

- [x] Code updated in server.ts
- [x] Schema files updated
- [x] Migration script created
- [ ] Migration run in Supabase (manual step)
- [ ] Server restarted
- [ ] New user registration tested
- [ ] Balance = 0 WL confirmed
- [ ] Existing users not affected
- [ ] Admin can add balance

---

## 📞 Support

If users ask about starting balance:

**Response**:
```
Untuk bermain, silakan deposit terlebih dahulu.
Klik tombol "Deposit" dan hubungi staff kami di Discord:
https://discord.gg/ZHF2N94p5

Staff akan menambahkan saldo ke akun Anda setelah deposit dikonfirmasi.
```

---

**Date**: 31 Mei 2026  
**Change**: Starting balance 500 → 0  
**Status**: ✅ CODE UPDATED  
**Next**: Run migration in Supabase  
**Impact**: New users only

