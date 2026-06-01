# 🔄 Kenapa Server Auto Restart?

## 🔍 Penyebab

Server.ts auto restart karena menggunakan **watch mode** dengan command:
```bash
tsx --watch server.ts
```

Watch mode akan **otomatis restart server** setiap kali ada perubahan file di project.

---

## 📋 Kapan Server Restart?

Server akan restart saat Anda:
- ✏️ Edit file `.ts` (TypeScript)
- ✏️ Edit file `.js` (JavaScript)
- ✏️ Edit file `.json` (JSON)
- ✏️ Edit file `.env` (Environment)
- 💾 Save file apapun di project

---

## ✅ Apakah Ini Normal?

**YA, ini NORMAL dan BERGUNA untuk development!**

### Keuntungan Watch Mode:
- ✅ Tidak perlu restart manual setiap kali edit code
- ✅ Perubahan langsung terdeteksi
- ✅ Hemat waktu development

### Kerugian:
- ❌ Restart terlalu sering jika banyak file berubah
- ❌ Bisa mengganggu saat edit file non-code (SQL, MD, TXT)
- ❌ Konsumsi CPU lebih tinggi

---

## 🛠️ Solusi

### Opsi 1: Gunakan Watch Mode dengan Ignore (Recommended)

**Sudah diperbaiki!** Sekarang server hanya restart jika file penting berubah:

```bash
npm run dev
```

Server **TIDAK akan restart** saat edit:
- ❌ File `.sql`
- ❌ File `.md` (Markdown)
- ❌ File `.txt`
- ❌ File di folder `src/` (frontend)
- ❌ File di folder `public/`

Server **AKAN restart** saat edit:
- ✅ `server.ts`
- ✅ `api/index.ts`
- ✅ `afk-fishing-worker.ts`
- ✅ File `.env`

---

### Opsi 2: Matikan Watch Mode (Tidak Recommended)

Jika tidak ingin auto-restart sama sekali:

```bash
npm run dev:no-watch
```

**Kerugian:**
- ❌ Harus restart manual setiap kali edit code
- ❌ Lebih lambat untuk development

---

### Opsi 3: Jalankan Server dan Client Terpisah

**Terminal 1 - Backend (dengan watch):**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

**Terminal 1 - Backend (tanpa watch):**
```bash
npm run server:no-watch
```

---

## 🎯 Rekomendasi

**Gunakan `npm run dev` (default)**

Ini sudah dikonfigurasi untuk:
- ✅ Auto-restart hanya untuk file backend penting
- ✅ Ignore file dokumentasi (SQL, MD, TXT)
- ✅ Ignore file frontend (src/, public/)
- ✅ Performa optimal

---

## 🔧 Konfigurasi Watch Mode

File yang mengatur watch mode:

### 1. `package.json`
```json
{
  "scripts": {
    "server": "tsx --watch --ignore \"**/*.sql\" --ignore \"**/*.md\" server.ts"
  }
}
```

### 2. `tsx.config.json` (opsional)
```json
{
  "watch": {
    "ignore": ["**/*.sql", "**/*.md", "src/**"],
    "include": ["server.ts", "api/index.ts"]
  }
}
```

---

## 🧪 Test Konfigurasi

### Test 1: Edit file SQL
```bash
# Edit FIX_LOGIN_ERROR.sql
# Server TIDAK AKAN restart ✅
```

### Test 2: Edit file MD
```bash
# Edit README.md
# Server TIDAK AKAN restart ✅
```

### Test 3: Edit server.ts
```bash
# Edit server.ts
# Server AKAN restart ✅
```

### Test 4: Edit file di src/
```bash
# Edit src/App.tsx
# Server TIDAK AKAN restart ✅
# Vite akan hot reload frontend ✅
```

---

## 📊 Monitoring Restart

Saat server restart, Anda akan melihat di terminal:

```
[0] Server running on http://localhost:3000
[0] [SUPABASE STATUS] Configured ✅
[0] 
[0] Restarting 'tsx --watch server.ts'...
[0] 
[0] Server running on http://localhost:3000
```

**Jika terlalu sering restart:**
1. Cek file apa yang berubah
2. Tambahkan ke ignore list di package.json
3. Atau gunakan `npm run dev:no-watch`

---

## 🔍 Troubleshooting

### Server restart terus-menerus

**Penyebab:**
- File watcher mendeteksi perubahan terus-menerus
- Mungkin ada proses lain yang mengubah file

**Solusi:**
```bash
# Stop server (Ctrl+C)
# Gunakan mode tanpa watch
npm run dev:no-watch
```

### Server tidak restart saat edit code

**Penyebab:**
- Watch mode tidak aktif
- File tidak terdeteksi

**Solusi:**
```bash
# Pastikan menggunakan watch mode
npm run dev

# Atau restart manual
# Ctrl+C, lalu npm run dev lagi
```

---

## ✅ Kesimpulan

**Auto-restart adalah fitur development yang BERGUNA!**

- ✅ Sudah dikonfigurasi untuk ignore file non-code
- ✅ Hanya restart saat file backend penting berubah
- ✅ Hemat waktu development
- ✅ Tidak perlu restart manual

**Gunakan:** `npm run dev` untuk pengalaman terbaik!

---

## 📞 Butuh Bantuan?

Jika auto-restart masih mengganggu:
1. Cek file apa yang sering berubah
2. Tambahkan ke ignore list
3. Atau gunakan `npm run dev:no-watch`

---

**Happy coding! 🚀**
