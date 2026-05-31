# AuthScreen Update - Modern Split Screen Design

## Perubahan yang Dilakukan

### 1. **Layout Baru - Split Screen**
- **Kiri**: Form login/register dengan background putih
- **Kanan**: Gambar karakter dengan background dark (gradient gray-900)
- Responsive: Di mobile, hanya menampilkan form (gambar tersembunyi)

### 2. **Desain Mirip Contoh**
- Font besar dan bold untuk heading "Hi Player!" / "Join Us!"
- Logo "REYABET." di kiri atas
- Toggle button "login" dan "Join us" di kanan atas
- Input fields dengan background abu-abu terang (gray-50)
- Tombol hitam (gray-900) untuk submit
- Badge "Gaming Spaces Community" di kanan atas gambar

### 3. **Warna Tetap Sama**
- Accent color: Cyan/Blue (untuk focus states)
- Background form: Putih
- Background gambar: Dark gray gradient
- Tombol: Hitam (gray-900)

### 4. **Font**
- Menggunakan Inter font (system-ui fallback)
- Heading: Font-black (900 weight)
- Body: Font-semibold dan font-medium

## Cara Menambahkan Gambar Karakter

### Opsi 1: Gunakan Gambar Custom
1. Siapkan gambar karakter PNG (transparent background lebih baik)
2. Simpan di folder `public/` dengan nama `character.png`
3. Ukuran rekomendasi: 800x1000px atau lebih besar
4. Gambar akan otomatis muncul di sisi kanan

### Opsi 2: Gunakan Gambar dari Internet
Jika belum punya gambar, bisa download dari:
- https://www.freepik.com/free-photos-vectors/game-character
- https://www.pngwing.com/en/search?q=game+character
- https://www.cleanpng.com/

### Opsi 3: Fallback ke Logo
Jika file `character.png` tidak ditemukan, sistem akan otomatis menggunakan `logo.png` sebagai fallback.

## File yang Diubah
- `src/components/AuthScreen.tsx` - Komponen utama

## Fitur Baru
1. **Google Login Button** (disabled) - Bisa diaktifkan nanti jika diperlukan
2. **Forgot Password Link** - Placeholder untuk fitur reset password
3. **Gaming Spaces Badge** - Menampilkan komunitas gaming
4. **Responsive Design** - Otomatis menyesuaikan di mobile dan desktop

## Testing
1. Jalankan aplikasi: `npm run dev`
2. Logout dari akun (jika sudah login)
3. Lihat halaman login yang baru
4. Test di mobile view (resize browser)

## Catatan
- Gambar karakter hanya muncul di layar desktop (md breakpoint ke atas)
- Di mobile, hanya form yang ditampilkan untuk UX yang lebih baik
- Warna accent (cyan) tetap digunakan untuk focus states pada input
