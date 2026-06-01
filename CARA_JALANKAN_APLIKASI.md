# 🚀 Cara Menjalankan Aplikasi

## ⚠️ PENTING: Aplikasi Ini Membutuhkan 2 Server

Aplikasi ini menggunakan arsitektur **client-server terpisah**:
1. **Frontend (Vite)** - Port 5173
2. **Backend (Express API)** - Port 3000

Kedua server **HARUS** berjalan bersamaan!

---

## 📋 Langkah-Langkah

### ✅ Opsi 1: Jalankan Otomatis (Recommended)

Gunakan script yang sudah disediakan:

```bash
npm run dev
```

Script ini akan:
- ✅ Menjalankan Express server (port 3000)
- ✅ Menjalankan Vite dev server (port 5173)
- ✅ Keduanya berjalan bersamaan

### ✅ Opsi 2: Jalankan Manual (2 Terminal)

Jika `npm run dev` tidak bekerja, jalankan manual:

**Terminal 1 - Backend API:**
```bash
npm run server
```
Output yang benar:
```
[SUPABASE STATUS] Configured ✅ Connecting to https://rwngqiakigebtwxohiri.supabase.co
Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run client
```
Output yang benar:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## 🌐 Akses Aplikasi

Setelah kedua server berjalan:
- **Buka browser:** http://localhost:5173
- **Jangan buka:** http://localhost:3000 (ini hanya API)

---

## 🔍 Troubleshooting

### ❌ Error 404 pada `/api/auth/login`

**Penyebab:** Backend server tidak berjalan

**Solusi:**
1. Pastikan Express server berjalan di port 3000
2. Cek terminal, harus ada log: `Server running on http://localhost:3000`
3. Test API langsung: http://localhost:3000/api/health

### ❌ Port 3000 sudah digunakan

**Solusi:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Atau ganti port di server.ts
const PORT = 3001;  # Ganti ke port lain
```

### ❌ Port 5173 sudah digunakan

**Solusi:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### ❌ `npm run dev` tidak bekerja

**Cek package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "tsx watch server.ts",
    "client": "vite"
  }
}
```

**Install dependencies jika belum:**
```bash
npm install concurrently tsx --save-dev
```

### ❌ Vite proxy tidak bekerja

**Cek vite.config.ts:**
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

---

## 🧪 Verifikasi Setup

### 1. Test Backend API
```bash
# Buka browser atau gunakan curl
curl http://localhost:3000/api/health
```

**Response yang benar:**
```json
{
  "status": "ok",
  "database": "supabase",
  "supabaseUrl": "https://rwngqiakigebtwxohiri.supabase.co"
}
```

### 2. Test Frontend
```bash
# Buka browser
http://localhost:5173
```

**Harus melihat:**
- ✅ Halaman login/register
- ✅ Tidak ada error 404 di console

### 3. Test Login
- Username: `admin`
- Password: `admin123`

**Jika berhasil:**
- ✅ Redirect ke dashboard
- ✅ Melihat saldo dan menu

---

## 📦 Dependencies yang Dibutuhkan

Pastikan sudah install:

```bash
npm install
```

**Dependencies penting:**
- `express` - Backend server
- `vite` - Frontend dev server
- `@supabase/supabase-js` - Database client
- `concurrently` - Menjalankan multiple commands
- `tsx` - TypeScript executor

---

## 🔄 Restart Server

Jika ada perubahan pada:
- `.env` file
- `server.ts`
- `api/index.ts`

**Restart server:**
```bash
# Stop dengan Ctrl+C
# Jalankan ulang
npm run dev
```

---

## 📊 Monitoring

### Cek Server Status

**Backend (Express):**
```bash
curl http://localhost:3000/api/health
```

**Frontend (Vite):**
```bash
curl http://localhost:5173
```

### Cek Logs

**Backend logs:**
- Lihat terminal tempat `npm run server` berjalan
- Cari log dengan prefix `[LOGIN]`, `[REGISTER]`, dll

**Frontend logs:**
- Buka browser console (F12)
- Tab Console untuk error messages
- Tab Network untuk API requests

---

## ✅ Checklist Sebelum Mulai

- [ ] File `.env` sudah diisi dengan API keys yang benar
- [ ] Dependencies sudah diinstall (`npm install`)
- [ ] Port 3000 tidak digunakan aplikasi lain
- [ ] Port 5173 tidak digunakan aplikasi lain
- [ ] Database sudah di-setup (jalankan `FIX_LOGIN_ERROR.sql`)
- [ ] Kedua server berjalan (backend + frontend)
- [ ] Browser dibuka di http://localhost:5173

---

## 🆘 Masih Error?

1. **Stop semua server** (Ctrl+C di semua terminal)
2. **Clear node_modules:**
   ```bash
   rmdir /s /q node_modules
   npm install
   ```
3. **Restart:**
   ```bash
   npm run dev
   ```
4. **Cek logs** di terminal dan browser console

---

## 📞 Butuh Bantuan?

Jika masih ada masalah:
1. Screenshot error dari browser console
2. Copy logs dari terminal
3. Cek apakah kedua server berjalan
4. Hubungi developer dengan informasi tersebut

---

**Selamat coding! 🎉**
