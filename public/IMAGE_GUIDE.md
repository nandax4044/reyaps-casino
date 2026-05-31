# Panduan Gambar untuk AuthScreen

## 📸 Gambar yang Diperlukan

### 1. authlogo.png ⭐ PENTING
**Location**: `public/authlogo.png`

**Spesifikasi**:
- Format: PNG
- Ukuran: 80x80px minimum (bisa lebih besar)
- Background: Transparent (recommended)
- Style: Logo brand Reyabet

**Cara Membuat**:
1. Buka logo.png yang sudah ada
2. Resize ke 80x80px atau lebih
3. Save as `authlogo.png`
4. Letakkan di folder `public/`

**Atau**:
- Copy `logo.png` dan rename jadi `authlogo.png`

---

### 2. character.png ⭐ PENTING
**Location**: `public/character.png`

**Spesifikasi**:
- Format: PNG
- Ukuran: 800x1000px atau lebih (portrait)
- Background: Transparent (recommended)
- Style: Gaming character, 3D character, atau cartoon
- Position: Standing pose (akan aligned ke bottom)

**Rekomendasi**:
- Karakter dengan pose berdiri
- Full body character
- Menghadap ke depan atau sedikit miring
- Warna yang kontras dengan background dark

**Sumber Gambar**:
1. **Freepik**: https://www.freepik.com/free-photos-vectors/game-character
2. **Pngwing**: https://www.pngwing.com/en/search?q=game+character
3. **Cleanpng**: https://www.cleanpng.com/
4. **AI Generator**: Midjourney, DALL-E, Stable Diffusion

**Contoh Prompt AI**:
```
"3D gaming character, full body, standing pose, 
futuristic armor, holding weapon, transparent background, 
high quality, detailed, game art style"
```

---

### 3. background.png ✅ SUDAH ADA
**Location**: `public/background.png`
- Sudah ada, tidak perlu diubah

---

## 🎨 Tips Desain

### Untuk authlogo.png:
- Gunakan logo yang sudah ada
- Pastikan terlihat jelas di ukuran kecil
- Warna yang kontras dengan background biru

### Untuk character.png:
- **PENTING**: Karakter akan aligned ke BOTTOM (seperti berdiri di atas table)
- Pastikan kaki karakter ada di bagian bawah gambar
- Jangan ada space kosong di bawah kaki
- Background transparent agar blend dengan gradient
- Ukuran file tidak terlalu besar (< 500KB)

---

## 📐 Ukuran Display

### authlogo.png:
- Mobile: 64x64px (w-16 h-16)
- Desktop: 80x80px (w-20 h-20)

### character.png:
- Width: 90% dari container (max ~400px)
- Height: 100% dari container (max ~550px)
- Position: Bottom aligned

---

## 🔧 Troubleshooting

### Logo tidak muncul:
1. Pastikan file ada di `public/authlogo.png`
2. Refresh browser (Ctrl+F5)
3. Check console untuk error
4. Fallback akan menggunakan `logo.png`

### Character tidak muncul:
1. Pastikan file ada di `public/character.png`
2. Check ukuran file (jangan terlalu besar)
3. Pastikan format PNG
4. Fallback akan menggunakan `logo.png`

### Character tidak aligned ke bottom:
- Ini sudah diatur di code dengan `items-end` dan `object-bottom`
- Pastikan gambar tidak punya space kosong di bawah

---

## ✅ Checklist

- [ ] authlogo.png ada di folder `public/`
- [ ] character.png ada di folder `public/`
- [ ] background.png ada di folder `public/` (sudah ada)
- [ ] Semua gambar format PNG
- [ ] Logo terlihat jelas
- [ ] Character aligned ke bottom
- [ ] Test di browser (npm run dev)
- [ ] Test di mobile view

---

## 🚀 Quick Start

1. **Jika belum punya authlogo.png**:
   ```bash
   # Copy logo.png jadi authlogo.png
   copy public\logo.png public\authlogo.png
   ```

2. **Download character.png**:
   - Cari di Freepik/Pngwing
   - Download dan save ke `public/character.png`

3. **Test**:
   ```bash
   npm run dev
   ```

4. **Logout dan lihat hasilnya!**

---

## 📞 Support

Jika ada masalah:
1. Check console browser (F12)
2. Pastikan path file benar
3. Clear cache browser
4. Restart dev server
