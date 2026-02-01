/**
 * Image compression utility using browser Canvas API
 * Compresses images to max 1920px dimension and ~500KB target size
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

interface ResolvedOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSizeKB: number;
}

const DEFAULT_OPTIONS: ResolvedOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeKB: 500
};

/**
 * Compress an image file using canvas
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<Blob> - Compressed image as Blob
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts: ResolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const blob = resizeAndCompress(img, opts);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error("Errore nel caricamento dell'immagine"));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error("Errore nella lettura del file"));
    };
    
    reader.readAsDataURL(file);
  });
}

function resizeAndCompress(
  img: HTMLImageElement,
  opts: ResolvedOptions
): Blob {
  let { width, height } = img;
  
  // Calculate new dimensions maintaining aspect ratio
  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  
  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossibile creare contesto canvas");
  }
  
  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convert to blob with quality adjustment
  let quality = opts.quality;
  let blob: Blob | null = null;
  
  // Try to achieve target size by reducing quality
  const targetSize = opts.maxSizeKB * 1024;
  
  // First attempt with original quality
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  blob = dataURLToBlob(dataUrl);
  
  // If still too large, progressively reduce quality
  while (blob.size > targetSize && quality > 0.3) {
    quality -= 0.1;
    const reducedDataUrl = canvas.toDataURL("image/jpeg", quality);
    blob = dataURLToBlob(reducedDataUrl);
  }
  
  return blob;
}

function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Compress image and return as File object with original name
 * @param file - Original file
 * @param options - Compression options
 * @returns Promise<File> - Compressed file
 */
export async function compressImageAsFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const blob = await compressImage(file, options);
  
  // Generate new filename with .jpg extension
  const originalName = file.name.replace(/\.[^/.]+$/, "");
  const newName = `${originalName}_compressed.jpg`;
  
  return new File([blob], newName, { type: "image/jpeg" });
}

/**
 * Check if file needs compression
 * @param file - File to check
 * @param maxSizeKB - Max size in KB
 * @returns boolean
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
  return file.size > maxSizeKB * 1024;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
