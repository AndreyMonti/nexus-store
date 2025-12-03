import * as ImagePicker from 'expo-image-picker';
import { supabase, isSupabaseConfigured } from './supabase';

export interface ImagePickerResult {
  uri: string;
  fileName: string;
}

/**
 * Request permissions to access media library
 */
export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Launch image picker for selecting an image from device
 */
export async function pickImage(): Promise<ImagePickerResult | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || `image-${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      fileName,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    throw new Error('Erro ao selecionar imagem');
  }
}

/**
 * Upload image to Supabase Storage
 * @param bucketName - Bucket name (e.g., 'products', 'avatars')
 * @param filePath - Path inside bucket (e.g., 'user-123/avatar.jpg')
 * @param imageUri - Local image URI from device
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  bucketName: string,
  filePath: string,
  imageUri: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado.');
  }

  try {
    // Read file from device
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { error, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('[Upload] Error:', error);
      // Recognize KeyTooLong error and return friendlier message
      const msg = /key.?too.?long/i.test(error.message || '') || /KeyTooLong/i.test(error.message || '')
        ? 'Nome do arquivo muito longo para o servidor. Tente selecionar outra imagem ou renomear.'
        : `Erro ao fazer upload: ${error.message}`;
      throw new Error(msg);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Erro ao gerar URL pública da imagem');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer upload de imagem';
    console.error('[Upload] Exception:', error);
    throw new Error(message);
  }
}

/**
 * Upload product image
 */
export async function uploadProductImage(
  userId: string,
  imageUri: string
): Promise<string> {
  // Build a short, safe filename to avoid very long keys
  const orig = imageUri.split('/').pop() || `product-${Date.now()}.jpg`;
  const extMatch = orig.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const shortName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const filePath = `${userId}/${shortName}`;
  return uploadImage('products', filePath, imageUri);
}

/**
 * Upload user avatar
 */
export async function uploadAvatarImage(
  userId: string,
  imageUri: string
): Promise<string> {
  const orig = imageUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
  const extMatch = orig.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const shortName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
  const filePath = `${userId}/${shortName}`;
  return uploadImage('avatars', filePath, imageUri);
}
