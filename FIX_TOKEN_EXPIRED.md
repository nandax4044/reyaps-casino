# 🔧 FIX TOKEN KADALUARSA (401 Unauthorized)

## ❌ Masalah:
```
/api/user/profile:1 Failed to load resource: the server responded with a status of 401 ()
Session expired or parsing issues. Clearing token.
Error: Token tidak valid atau sudah kadaluarsa. Silakan login ulang.
```

**HTTP 401 = "Unauthorized"** - Token JWT dari Supabase sudah expired (biasanya 1 jam).

---

## ✅ Solusi yang Diterapkan:

### 1. **Auto Token Refresh**
Frontend sekarang otomatis refresh token ketika mendapat 401 error:
```typescript
// Di src/utils/api.ts
async function request(endpoint, options) {
  let response = await fetch(endpoint, options);
  
  // Jika 401 dan ada refresh_token, coba refresh
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      // Retry request dengan token baru
      response = await fetch(endpoint, options);
    }
  }
  
  return response;
}
```

### 2. **Refresh Token Endpoint**
Menambahkan endpoint `/api/auth/refresh` untuk refresh token:
```typescript
POST /api/auth/refresh
Body: { "refresh_token": "..." }
Response: { "token": "new_access_token", "refresh_token": "new_refresh_token" }
```

### 3. **Simpan Refresh Token**
Login dan register sekarang menyimpan refresh_token:
```typescript
localStorage.setItem('auth_token', data.token);
localStorage.setItem('refresh_token', data.refresh_token);
```

### 4. **Better Error Logging**
Menambahkan logging untuk debugging token issues.

---

## 🔄 Cara Kerja Auto-Refresh:

1. **User login** → Dapat `access_token` (1 jam) + `refresh_token` (30 hari)
2. **Token expired** → Request ke API dapat 401
3. **Auto refresh** → Frontend otomatis panggil `/api/auth/refresh`
4. **Dapat token baru** → Retry request yang gagal
5. **User tetap login** → Tidak perlu login ulang!

---

## 📋 File yang Diubah:

### Backend:
- ✅ `api/index.ts` - Tambah endpoint `/auth/refresh`
- ✅ `api/index.ts` - Update login handler return `refresh_token`
- ✅ `api/index.ts` - Update register handler return `refresh_token`
- ✅ `api/index.ts` - Better logging di `authenticateToken`

### Frontend:
- ✅ `src/utils/api.ts` - Tambah `refreshAuthToken()` function
- ✅ `src/utils/api.ts` - Update `request()` untuk auto-refresh
- ✅ `src/utils/api.ts` - Simpan `refresh_token` di localStorage
- ✅ `src/utils/api.ts` - Clear `refresh_token` saat logout

---

## 🚀 DEPLOY SEKARANG:

### Cara Cepat:
```powershell
git add .
git commit -m "Fix token expired - implement auto token refresh"
git push origin main
```

### Atau gunakan script:
```powershell
.\deploy-to-vercel.ps1
```

---

## 🧪 Testing:

### 1. Test Login:
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginKey":"admin","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "user": {...},
  "token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

### 2. Test Refresh:
```bash
curl -X POST https://your-app.vercel.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJ..."}'
```

Expected response:
```json
{
  "success": true,
  "user": {...},
  "token": "new_eyJ...",
  "refresh_token": "new_eyJ..."
}
```

---

## ⚠️ PENTING:

### 1. Clear Browser Storage
Setelah deploy, user perlu **logout dan login ulang** untuk mendapatkan refresh_token:
```javascript
// Di browser console:
localStorage.clear();
// Lalu login ulang
```

### 2. Token Expiry Times
- **Access Token**: 1 jam (default Supabase)
- **Refresh Token**: 30 hari (default Supabase)
- Setelah 30 hari, user harus login ulang

### 3. Security
- Refresh token disimpan di localStorage (aman untuk web app)
- Token otomatis di-clear saat logout
- Refresh token hanya bisa digunakan sekali (Supabase rotation)

---

## 🔍 Troubleshooting:

### Jika masih 401 setelah deploy:
1. **Clear localStorage** dan login ulang
2. **Cek browser console** untuk error refresh
3. **Cek Vercel Function Logs** untuk error di backend

### Jika refresh gagal:
1. Pastikan `SUPABASE_URL` dan `SUPABASE_KEY` benar
2. Cek Supabase Auth settings (token expiry)
3. Pastikan refresh_token valid (belum expired)

### Jika user harus login terus:
1. Cek apakah refresh_token tersimpan di localStorage
2. Cek browser console untuk error
3. Pastikan auto-refresh logic berjalan

---

## ✅ Expected Behavior Setelah Fix:

✅ User login sekali, tetap login sampai 30 hari
✅ Token otomatis refresh setiap 1 jam
✅ Tidak ada error "Token kadaluarsa" lagi
✅ User experience lebih smooth
✅ AFK fishing tidak terganggu

---

**STATUS**: ✅ SIAP DEPLOY!
**BENEFIT**: User tidak perlu login ulang setiap 1 jam!

## 🎯 Quick Deploy:
```powershell
git add . && git commit -m "Fix token expired - auto refresh" && git push origin main
```

Setelah deploy, **minta semua user logout dan login ulang** untuk mendapatkan refresh_token!
