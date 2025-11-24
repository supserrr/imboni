/**
 * Utility functions for capturing frames from video elements
 * Based on the reference implementation from m87-labs/Analyze-Live-Video-Solution
 */

/**
 * Capture a frame from a video element and convert it to a base64 data URL
 * Matches the exact pattern from useLiveVideo.captureFrame
 * @param videoElement - The video element to capture from
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Base64 data URL of the captured frame, or null if video is not ready
 */
export function captureFrameFromVideo(
  videoElement: HTMLVideoElement,
  quality: number = 0.8
): string | null {
  if (!videoElement) {
    return null;
  }

  // Check if video is ready (readyState 4 = HAVE_ENOUGH_DATA)
  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Compress an image data URL by reducing quality
 * @param dataUrl - Original base64 data URL
 * @param maxWidth - Maximum width (default: 1280)
 * @param maxHeight - Maximum height (default: 720)
 * @param quality - JPEG quality (0-1, default: 0.7)
 * @returns Compressed base64 data URL
 */
export function compressImageDataUrl(
  dataUrl: string,
  maxWidth: number = 1280,
  maxHeight: number = 720,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}
