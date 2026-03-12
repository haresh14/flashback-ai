export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Prepares an image for the OpenAI API. Converts to PNG format.
 * @param imageDataUrl The source image as a data URL.
 * @param padToSquare If true, pads to square (for APIs that require it). If false, preserves original aspect ratio.
 */
export async function prepareImageForOpenAI(
  imageDataUrl: string,
  padToSquare: boolean = false
): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width: number;
      let height: number;

      if (padToSquare) {
        const size = Math.max(img.width, img.height);
        width = size;
        height = size;
      } else {
        width = img.width;
        height = img.height;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      if (padToSquare) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        const x = (width - img.width) / 2;
        const y = (height - img.height) / 2;
        ctx.drawImage(img, x, y, img.width, img.height);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width, height });
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png',
        0.95
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/** Converts a Blob to a base64 data URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
