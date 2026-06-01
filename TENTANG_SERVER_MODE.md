# 🔄 Server Mode - Watch vs No-Watch

## ⚙️ Perubahan Penting

Server sekarang **TIDAK AUTO-RESTART** secara default untuk menjaga stabilitas, terutama untuk fitur AFK fishing yang harus berjalan terus-menerus.

---

## 🚀 Mode yang Tersedia

### 1️⃣ Production Mode (Default - Recommended)

**Command:**
```bash
npm run dev
```

**Karakteristik:**
- ✅ Server **TIDAK** auto-restart
- ✅ Stabil untuk production
- ✅ AFK fishing berjalan tanpa gangguan
- ✅ User tidak ter-disconnect
- ⚠️ Perlu restart manual jika ada perubahan code

**Kapan digunakan:**
- ✅ Saat ada user yang sedang bermain
- ✅ Saat menjalankan AFK fishing
- ✅ Saat production/live
- ✅ Saat tidak sedang development

---

### 2️⃣ Development Mode (Watch Mode)

**Command:**
```bash
npm run dev:watch
```

**Karakteristik:**
- ✅ Server **AUTO-RESTART** saat ada perubahan code
- ✅ Cocok untuk development
- ⚠️ User akan ter-disconnect saat restart
- ⚠️ AFK fishing akan terganggu
- ⚠️ Session akan hilang

**Kapan digunakan:**
- ✅ Saat development/coding
- ✅ Saat testing perubahan code
- ✅ Saat tidak ada user yang bermain
- ❌ JANGAN gunakan saat production

---

## 📋 Daftar Commands

| Command | Server Mode | Frontend | Kapan Digunakan |
|---------|-------------|----------|-----------------|
| `npm run dev` | No-watch | Auto-reload | **Production/Live** ✅ |
| `npm run dev:watch` | Watch | Auto-reload | Development only |
| `npm run server` | No-watch | - | Server only (production) |
| `npm run server:watch` | Watch | - | Server only (development) |
| `npm run client` | - | Auto-reload | Frontend only |

---

## 🎯 Rekomendasi Penggunaan

### Untuk Production/Live Server:
```bash
# Gunakan ini!
npm run dev
```

**Keuntungan:**
- ✅ Server stabil, tidak restart sendiri
- ✅ User tidak ter-disconnect
- ✅ AFK fishing berjalan lancar
- ✅ Session tetap terjaga

### Untuk Development:
```bash
# Gunakan ini saat coding
npm run dev:watch
```

**Keuntungan:**
- ✅ Auto-reload saat save file
- ✅ Tidak perlu restart manual
- ✅ Lebih cepat untuk testing

---

## 🔄 Cara Restart Server Manual

Jika menggunakan mode production (`npm run dev`) dan perlu restart:

**Windows:**
```bash
# Stop server
Ctrl + C

# Start ulang
npm run dev
```

**Atau gunakan script restart:**
```bash
# Stop dan start otomatis
npm run dev
```

---

## ⚠️ Penting untuk AFK Fishing

**AFK Fishing membutuhkan server yang stabil!**

- ✅ **GUNAKAN:** `npm run dev` (no-watch mode)
- ❌ **JANGAN:** `npm run dev:watch` (akan restart dan mengganggu AFK)

**Kenapa?**
- AFK fishing berjalan di background
- Jika server restart, proses AFK akan terhenti
- User akan kehilangan progress
- Session akan hilang

---

## 🛠️ Troubleshooting

### Server tidak auto-reload setelah perubahan code?

**Ini NORMAL!** Mode production tidak auto-reload.

**Solusi:**
1. Stop server (Ctrl+C)
2. Start ulang: `npm run dev`

**Atau gunakan watch mode:**
```bash
npm run dev:watch
```

### User ter-disconnect terus?

**Penyebab:** Mungkin menggunakan watch mode

**Solusi:**
```bash
# Stop server
Ctrl + C

# Gunakan production mode
npm run dev
```

### AFK fishing terhenti sendiri?

**Penyebab:** Server restart karena watch mode

**Solusi:**
```bash
# Pastikan menggunakan production mode
npm run dev
```

---

## 📊 Perbandingan Mode

| Fitur | Production Mode | Watch Mode |
|-------|----------------|------------|
| Auto-restart | ❌ Tidak | ✅ Ya |
| Stabilitas | ✅ Tinggi | ⚠️ Rendah |
| AFK Fishing | ✅ Aman | ❌ Terganggu |
| User Session | ✅ Terjaga | ❌ Hilang saat restart |
| Development | ⚠️ Perlu restart manual | ✅ Auto-reload |
| Production | ✅ Recommended | ❌ Tidak disarankan |

---

## ✅ Checklist

**Untuk Production/Live:**
- [ ] Gunakan `npm run dev` (bukan `dev:watch`)
- [ ] Pastikan server tidak auto-restart
- [ ] Test AFK fishing berjalan lancar
- [ ] Verifikasi user tidak ter-disconnect

**Untuk Development:**
- [ ] Gunakan `npm run dev:watch` saat coding
- [ ] Pastikan tidak ada user yang bermain
- [ ] Switch ke `npm run dev` sebelum user masuk

---

## 🎉 Kesimpulan

**Default mode sekarang adalah NO-WATCH (production mode)**

Ini memastikan:
- ✅ Server stabil
- ✅ AFK fishing berjalan lancar
- ✅ User tidak terganggu
- ✅ Session tetap terjaga

Jika perlu development dengan auto-reload, gunakan `npm run dev:watch`

---

**Server yang stabil = User yang happy! 🎮**
