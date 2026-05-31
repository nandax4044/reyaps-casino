# ✅ Wheel Prize Image Upload - Feature Added

## 🎯 Feature Overview

Admin sekarang bisa upload gambar PNG untuk item roda langsung dari file manager. Gambar akan dikonversi ke base64 dan tersimpan di database.

---

## 🔧 Implementation

### 1. **File Upload Button**

#### Location:
`src/components/AdminDashboard.tsx` - Wheel Prize Edit Section

#### Features:
- ✅ File input dengan accept filter (PNG, JPG, JPEG, WebP)
- ✅ File size validation (max 2MB)
- ✅ Auto convert to base64
- ✅ Preview image setelah upload
- ✅ Fallback ke URL input manual

#### Code:
```tsx
<label className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer">
  <input
    type="file"
    accept="image/png,image/jpeg,image/jpg,image/webp"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 2MB');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        handleUpdateWheelPrizeValue('image', base64, idx);
      };
      reader.readAsDataURL(file);
    }}
    className="hidden"
  />
  📁 Upload
</label>
```

---

### 2. **Image Preview**

#### Features:
- ✅ Show preview setelah upload
- ✅ Display image thumbnail (12x12)
- ✅ Show truncated path/base64
- ✅ Error handling jika image gagal load

#### Code:
```tsx
{prize.image && (
  <div className="mt-1 p-2 bg-black/20 border border-white/5 rounded flex items-center gap-2">
    <img 
      src={prize.image} 
      alt="Preview" 
      className="w-12 h-12 object-contain bg-white/5 rounded border border-white/10"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
    <span className="text-[9px] text-slate-500 truncate flex-1">
      {prize.image.substring(0, 50)}...
    </span>
  </div>
)}
```

---

## 🎨 UI Design

### Before:
```
┌─────────────────────────────────────┐
│ Asset Link / File                   │
│ [/images/wheel_car.png            ] │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│ Asset Link / Upload File            │
│ [/images/wheel_car.png  ] [📁 Upload]│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [IMG] data:image/png;base64...  │ │ ← Preview
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📝 How to Use

### Method 1: Upload File (Recommended)
1. Login sebagai admin
2. Buka Admin Dashboard
3. Pilih "Prize Wheel" tab
4. Scroll ke prize yang ingin diedit
5. Klik button "📁 Upload"
6. Pilih file PNG/JPG dari file manager
7. File akan auto-convert ke base64
8. Preview muncul di bawah input
9. Klik "SAVE CHANGES" untuk simpan

### Method 2: Manual URL Input
1. Login sebagai admin
2. Buka Admin Dashboard
3. Pilih "Prize Wheel" tab
4. Scroll ke prize yang ingin diedit
5. Ketik URL image di input field
6. Example: `/images/wheel_car.png`
7. Preview muncul di bawah input
8. Klik "SAVE CHANGES" untuk simpan

---

## 🔍 Technical Details

### File Validation:
```typescript
// Accepted formats
accept="image/png,image/jpeg,image/jpg,image/webp"

// Max file size: 2MB
if (file.size > 2 * 1024 * 1024) {
  alert('File terlalu besar! Maksimal 2MB');
  return;
}
```

### Base64 Conversion:
```typescript
const reader = new FileReader();
reader.onload = (event) => {
  const base64 = event.target?.result as string;
  // base64 format: data:image/png;base64,iVBORw0KG...
  handleUpdateWheelPrizeValue('image', base64, idx);
};
reader.readAsDataURL(file);
```

### Storage:
- **Base64**: Stored directly in database (game_configs table)
- **URL**: Stored as string path (e.g., `/images/wheel_car.png`)
- **Database Field**: `game_configs.config_data.prizes[].image`

---

## ⚠️ Important Notes

### File Size Limit:
- **Max**: 2MB per image
- **Reason**: Base64 increases size by ~33%
- **Recommendation**: Optimize images before upload

### Supported Formats:
- ✅ PNG (recommended for transparency)
- ✅ JPG/JPEG
- ✅ WebP
- ❌ GIF (not recommended)
- ❌ SVG (not supported)

### Base64 vs URL:

#### Base64 Pros:
- ✅ No external hosting needed
- ✅ Image embedded in database
- ✅ No broken links
- ✅ Works offline

#### Base64 Cons:
- ❌ Larger database size
- ❌ Slower to load
- ❌ Not cacheable by browser

#### URL Pros:
- ✅ Smaller database size
- ✅ Faster to load
- ✅ Browser cacheable
- ✅ Easy to update

#### URL Cons:
- ❌ Requires external hosting
- ❌ Can break if file moved
- ❌ Requires server access

---

## 🧪 Testing

### Test 1: Upload PNG File
1. Admin dashboard → Prize Wheel
2. Click "📁 Upload" button
3. Select PNG file (< 2MB)
4. ✅ Preview should appear
5. ✅ Base64 string in input field
6. Save changes
7. ✅ Image displays in wheel game

### Test 2: Upload Large File
1. Admin dashboard → Prize Wheel
2. Click "📁 Upload" button
3. Select file > 2MB
4. ✅ Alert: "File terlalu besar! Maksimal 2MB"
5. ✅ Upload cancelled

### Test 3: Manual URL Input
1. Admin dashboard → Prize Wheel
2. Type URL in input: `/images/test.png`
3. ✅ Preview should appear
4. Save changes
5. ✅ Image displays in wheel game

### Test 4: Invalid Image
1. Admin dashboard → Prize Wheel
2. Type invalid URL: `/images/notfound.png`
3. ✅ Preview shows broken image (hidden)
4. Save changes
5. ✅ Wheel shows fallback or empty

---

## 📊 Database Structure

### game_configs Table:
```json
{
  "game_type": "wheel",
  "config_data": {
    "published": true,
    "prizes": [
      {
        "id": "1",
        "name": "Luxury Hypercar",
        "image": "data:image/png;base64,iVBORw0KG...", // ← Base64
        "color": "#0284c7",
        "chance": 5
      },
      {
        "id": "2",
        "name": "Gold Bullion",
        "image": "/images/wheel_gold.png", // ← URL
        "color": "#38bdf8",
        "chance": 12
      }
    ]
  }
}
```

---

## 🚀 Future Improvements

### 1. **Supabase Storage Integration**
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('wheel-images')
  .upload(`prizes/${file.name}`, file);

if (data) {
  const publicUrl = supabase.storage
    .from('wheel-images')
    .getPublicUrl(data.path).data.publicUrl;
  
  handleUpdateWheelPrizeValue('image', publicUrl, idx);
}
```

### 2. **Image Optimization**
```typescript
// Compress image before upload
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 512,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
```

### 3. **Drag & Drop Upload**
```tsx
<div
  onDrop={(e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    // Handle file upload
  }}
  onDragOver={(e) => e.preventDefault()}
  className="border-2 border-dashed border-blue-500/30 rounded p-4"
>
  Drag & drop image here or click to upload
</div>
```

### 4. **Image Cropper**
```typescript
// Add image cropper before upload
import Cropper from 'react-easy-crop';

// Allow admin to crop image to square aspect ratio
```

---

## 📁 Files Modified

1. ✅ `src/components/AdminDashboard.tsx`
   - Added file input button
   - Added base64 conversion
   - Added image preview
   - Added file size validation

---

## 🎯 Benefits

### 1. **Easy Image Management**
- Admin tidak perlu manual upload ke server
- Tidak perlu FTP/SSH access
- Upload langsung dari browser

### 2. **No External Dependencies**
- Tidak perlu hosting terpisah
- Tidak perlu CDN
- Self-contained

### 3. **Instant Preview**
- Admin bisa lihat image sebelum save
- Validasi visual
- Error detection

### 4. **Flexible Input**
- Support upload file
- Support manual URL
- Support base64
- Support external URLs

---

## 📊 Summary

### Features Added:
- ✅ File upload button
- ✅ Base64 conversion
- ✅ Image preview
- ✅ File size validation
- ✅ Format validation
- ✅ Error handling

### Supported:
- ✅ PNG, JPG, JPEG, WebP
- ✅ Max 2MB file size
- ✅ Base64 storage
- ✅ URL storage
- ✅ Preview display

### Result:
- 🎨 Easy image upload
- 💾 Database storage
- 🖼️ Instant preview
- ✅ No external hosting needed

---

**Date**: 31 Mei 2026
**Feature**: Wheel Prize Image Upload
**Status**: ✅ COMPLETED
**Storage**: Base64 in Database
