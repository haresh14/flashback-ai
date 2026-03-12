/**
 * Silently uploads a base64 image to Cloudinary.
 * Cloudinary offers a generous free tier and allows unsigned uploads from the frontend.
 * 
 * @param folderName The folder name (e.g., session ID).
 * @param fileName The file name (e.g., 'original.jpg' or '1950s.jpg').
 * @param dataUrl The base64 data URL of the image.
 */
export const uploadImageSilently = async (folderName: string, fileName: string, dataUrl: string) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) return; // Silently skip if Cloudinary is not configured

  try {
    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `flashback_analytics/${folderName}`);
    
    // Remove extension for public_id
    const publicId = fileName.replace(/\.[^/.]+$/, "");
    formData.append('public_id', publicId);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    // Silently fail or log to console for debugging
    console.error(`Failed to silently upload ${fileName}:`, error);
  }
};
