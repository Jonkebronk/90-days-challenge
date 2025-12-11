import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

/**
 * Upload an image to Cloudinary
 * @param file - Base64 data URI or file path
 * @param folder - Cloudinary folder (default: 'recipes')
 * @returns Upload result with URL and metadata
 */
export async function uploadRecipeImage(
  file: string,
  folder: string = 'recipes'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Cloudinary public_id
 */
export async function deleteRecipeImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicId - Cloudinary public_id
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  })
}

/**
 * Upload a product image to Cloudinary
 * @param file - Base64 data URI
 * @returns Secure URL of the uploaded image
 */
export async function uploadProductImage(file: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'products',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return result.secure_url
  } catch (error) {
    console.error('Cloudinary product upload error:', error)
    throw new Error('Failed to upload product image')
  }
}

/**
 * Upload a message image to Cloudinary
 * @param file - Base64 data URI
 * @returns Secure URL of the uploaded image
 */
export async function uploadMessageImage(file: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'messages',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return result.secure_url
  } catch (error) {
    console.error('Cloudinary message upload error:', error)
    throw new Error('Failed to upload message image')
  }
}

export default cloudinary
