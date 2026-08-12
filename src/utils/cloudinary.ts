import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

/**
 * Configure Cloudinary with environment variables or provided credentials
 */
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qjoxb5yw',
    api_key: process.env.CLOUDINARY_API_KEY || '667232741296166',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
    secure: true,
  });
  return cloudinary;
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
}

/**
 * Uploads a file (file path, base64 string, or Buffer) to Cloudinary and returns the secure URL
 * 
 * @param fileInput - File path string, base64 Data URL, or Buffer from file upload
 * @param options - Optional Cloudinary upload options (folder, public_id, tags, etc.)
 * @returns Promise<string> - The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  fileInput: string | Buffer,
  options: UploadApiOptions = {}
): Promise<string> {
  configureCloudinary();

  const uploadOptions: UploadApiOptions = {
    folder: 'website_uploads',
    resource_type: 'auto',
    ...options,
  };

  if (Buffer.isBuffer(fileInput)) {
    // Handle raw Buffer (e.g., from multer memoryStorage) using upload_stream
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload stream error:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('No response received from Cloudinary upload'));
          }
          resolve(result.secure_url || result.url);
        }
      );
      stream.end(fileInput);
    });
  }

  // Handle file path string or base64 Data URL
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      fileInput,
      uploadOptions
    );
    return result.secure_url || result.url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Generates an optimized Cloudinary URL with auto format and quality
 */
export function getOptimizedUrl(publicId: string): string {
  configureCloudinary();
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
  });
}

/**
 * Generates a transformed/cropped Cloudinary URL
 */
export function getAutoCropUrl(
  publicId: string,
  width: number = 500,
  height: number = 500
): string {
  configureCloudinary();
  return cloudinary.url(publicId, {
    crop: 'auto',
    gravity: 'auto',
    width,
    height,
    secure: true,
  });
}
