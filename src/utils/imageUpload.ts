/**
 * Image Upload Utility for Supabase Storage
 * Handles image uploads to Supabase Storage buckets
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwngqiakigebtwxohiri.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload image to Supabase Storage
 * @param file - File object to upload
 * @param bucket - Bucket name ('wheel-images', 'case-images', 'crash-images', 'game-assets')
 * @param folder - Optional folder path within bucket (e.g., 'prizes', 'items')
 * @returns UploadResult with public URL or error
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: 'wheel-images' | 'case-images' | 'crash-images' | 'game-assets' = 'wheel-images',
  folder: string = 'prizes'
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Check file size (max 2MB for most buckets, 5MB for game-assets)
    const maxSize = bucket === 'game-assets' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` 
      };
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (bucket === 'game-assets') {
      allowedTypes.push('image/svg+xml');
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WebP' 
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Upload failed' 
      };
    }

    if (!data) {
      return { 
        success: false, 
        error: 'Upload failed - no data returned' 
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      return { 
        success: false, 
        error: 'Failed to get public URL' 
      };
    }

    // Log upload to database (optional)
    try {
      await logImageUpload({
        bucket_name: bucket,
        file_path: data.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        game_type: getGameTypeFromBucket(bucket)
      });
    } catch (logError) {
      console.warn('Failed to log image upload:', logError);
      // Don't fail the upload if logging fails
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };

  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Convert image file to base64 (fallback method)
 * @param file - File object to convert
 * @returns Promise<string> - Base64 string
 */
export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      resolve(base64);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Delete image from Supabase Storage
 * @param bucket - Bucket name
 * @param path - File path within bucket
 * @returns Promise<boolean> - Success status
 */
export async function deleteImageFromSupabase(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Remove from database log
    try {
      await supabase
        .from('uploaded_images')
        .delete()
        .eq('bucket_name', bucket)
        .eq('file_path', path);
    } catch (logError) {
      console.warn('Failed to remove image log:', logError);
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Log image upload to database
 * @param data - Upload metadata
 */
async function logImageUpload(data: {
  bucket_name: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  game_type: string;
}) {
  const { error } = await supabase
    .from('uploaded_images')
    .insert(data);

  if (error) {
    console.error('Failed to log upload:', error);
  }
}

/**
 * Get game type from bucket name
 * @param bucket - Bucket name
 * @returns Game type string
 */
function getGameTypeFromBucket(bucket: string): string {
  if (bucket.includes('wheel')) return 'wheel';
  if (bucket.includes('case')) return 'cases';
  if (bucket.includes('crash')) return 'crash';
  return 'general';
}

/**
 * Get all uploaded images for a game type
 * @param gameType - Game type ('wheel', 'cases', 'crash', 'general')
 * @returns Promise<Array> - List of uploaded images
 */
export async function getUploadedImages(gameType?: string) {
  try {
    let query = supabase
      .from('uploaded_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch images:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return [];
  }
}

/**
 * Compress image before upload (optional)
 * @param file - File to compress
 * @param maxSizeMB - Max size in MB
 * @param maxWidthOrHeight - Max dimension
 * @returns Promise<File> - Compressed file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 0.5,
  maxWidthOrHeight: number = 512
): Promise<File> {
  // This is a placeholder - you would need to install a compression library
  // like 'browser-image-compression' to actually compress images
  
  // For now, just return the original file
  return file;
  
  // Example with browser-image-compression:
  /*
  import imageCompression from 'browser-image-compression';
  
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true
  };
  
  return await imageCompression(file, options);
  */
}

export default {
  uploadImageToSupabase,
  convertImageToBase64,
  deleteImageFromSupabase,
  getUploadedImages,
  compressImage
};
