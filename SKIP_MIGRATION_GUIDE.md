# 🚀 Skip Migration - Alternative Guide

## ⚠️ Jika Migration di Supabase Error

Jangan khawatir! Migration di Supabase **OPTIONAL**. Code di server sudah diupdate, jadi cukup restart server.

---

## ✅ Yang Sudah Diupdate (Tanpa Migration)

### 1. Server Code
File `server.ts` sudah diupdate:
- Register endpoint → `balance: 0.00`
- Local memory → `balance: 0.00`

**Impact**: User baru yang register via server → saldo 0

---

## 🎯 Kapan Migration Diperlukan?

Migration **HANYA** diperlukan jika:
1. ✅ User register langsung via Supabase Auth (bypass server)
2. ✅ Trigger `handle_new_user()` yang create profile

**Tapi** di app kita, user register via server endpoint `/api/auth/register`, jadi:
- ❌ Migration **TIDAK WAJIB**
- ✅ Server code sudah cukup

---

## 🚀 Cara Kerja Tanpa Migration

### Flow Register User:

```
User klik "Daftar Akun Baru"
  ↓
Frontend call: POST /api/auth/register
  ↓
Server.ts register endpoint
  ↓
Supabase Auth signUp (create auth user)
  ↓
Trigger handle_new_user() (create profile) ← Masih 500.00
  ↓
Server manual insert/update profile ← Override jadi 0.00 ✅
  ↓
User profile created dengan balance 0.00 ✅
```

**Result**: User tetap dapat balance 0 karena server override trigger!

---

## ✅ Testing Tanpa Migration

### Test 1: Register User Baru
```
1. Restart server: npm run dev
2. Logout dari app
3. Register akun baru
4. Login
5. Check balance
6. ✅ Should be 0 WL (bukan 500 WL)
```

### Test 2: Verify di Database
```sql
-- Run di Supabase SQL Editor
SELECT username, balance, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

Expected: User baru punya balance 0.00

---

## 🔧 Jika Masih Dapat 500 WL

Jika user baru masih dapat 500 WL, berarti trigger override server. Solusi:

### Option 1: Manual Update di Supabase (Paling Mudah)

```sql
-- Update trigger function saja (tanpa ALTER TABLE)
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
    0.00,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

Copy paste query di atas ke Supabase SQL Editor dan RUN.

---

### Option 2: Disable Trigger (Nuclear Option)

```sql
-- Disable trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

Setelah ini, server akan 100% handle user creation (tidak ada trigger).

---

### Option 3: Manual Fix Per User

Jika ada user yang sudah register dengan 500 WL:

```sql
-- Reset balance user tertentu
UPDATE public.users 
SET balance = 0.00 
WHERE username = 'nama_user';

-- Atau reset semua user baru (hati-hati!)
UPDATE public.users 
SET balance = 0.00 
WHERE created_at > '2026-05-31' AND balance = 500.00;
```

---

## 📊 Summary

| Scenario | Migration Needed? | Why? |
|----------|-------------------|------|
| User register via app | ❌ No | Server code handles it |
| User register via Supabase Auth directly | ✅ Yes | Trigger creates profile |
| Existing users | ❌ No | Not affected |
| Admin add balance | ❌ No | Manual operation |

---

## 🎯 Recommended Action

### Langkah Paling Aman:

1. **Restart Server**
   ```bash
   npm run dev
   ```

2. **Test Register**
   - Register user baru
   - Check balance
   - Jika 0 WL → ✅ Selesai!
   - Jika 500 WL → Lanjut step 3

3. **Update Trigger (Jika Perlu)**
   ```sql
   -- Copy paste ke Supabase SQL Editor
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
       0.00,
       FALSE
     )
     ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $$;
   ```

4. **Test Lagi**
   - Register user baru lagi
   - Check balance
   - ✅ Should be 0 WL now

---

## 🐛 Common Errors di Supabase

### Error 1: "permission denied for table users"
**Solution**: Gunakan service_role key, bukan anon key

### Error 2: "syntax error near..."
**Solution**: Copy paste query dengan hati-hati, pastikan tidak ada karakter aneh

### Error 3: "function handle_new_user does not exist"
**Solution**: Function belum dibuat, run schema.sql dulu

### Error 4: "column balance does not exist"
**Solution**: Table structure berbeda, check schema

---

## ✅ Success Checklist

- [ ] Server restarted
- [ ] Register user baru tested
- [ ] Balance = 0 WL confirmed
- [ ] (Optional) Trigger updated di Supabase
- [ ] Existing users not affected

---

## 💡 Pro Tip

Jika migration terus error dan tidak urgent, **skip saja**! 

Server code sudah cukup untuk handle balance 0. Migration hanya untuk "safety net" jika ada edge case.

Focus ke testing dan pastikan user baru dapat 0 WL. Itu yang penting! 🎯

---

**Date**: 31 Mei 2026  
**Status**: Migration Optional  
**Priority**: Low (Server code sudah cukup)  
**Action**: Restart server dan test

