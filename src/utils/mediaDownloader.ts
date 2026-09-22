// Safe Media Probe and Downloader for News Hunter
// Respects size limits, user confirmation for large videos, source restrictions, and attribution.

import { recordMediaCached } from './mediaCache';

export interface MediaProbeResult {
  accessible: boolean;
  isDownloadable: boolean;
  sizeBytes?: number;
  formattedSize?: string;
  contentType?: string;
  statusCode?: number;
  isHtmlRedirect?: boolean;
  error?: string;
}

export interface MediaDownloadResult {
  success: boolean;
  exceedsLimit?: boolean;
  isRestricted?: boolean;
  filename?: string;
  sizeBytes?: number;
  formattedSize?: string;
  error?: string;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function generateCleanMediaFilename(sourceName: string, originalUrl: string, mediaType: 'image' | 'video', mimeType?: string): string {
  const cleanSource = (sourceName || 'news')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 15);
  
  let ext = mediaType === 'video' ? 'mp4' : 'jpg';
  if (mimeType) {
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('webm')) ext = 'webm';
    else if (mimeType.includes('mp4')) ext = 'mp4';
  } else {
    try {
      const pathname = new URL(originalUrl).pathname;
      const originalExt = pathname.split('.').pop()?.toLowerCase();
      if (originalExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'].includes(originalExt)) {
        ext = originalExt === 'jpeg' ? 'jpg' : originalExt;
      }
    } catch {
      // fallback
    }
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  return `news-${cleanSource}-${timestamp}-${randomSuffix}.${ext}`;
}

export function isRestrictedSourceUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.includes('tiktok.com') ||
    lower.includes('instagram.com/p/') ||
    lower.includes('facebook.com/watch')
  );
}

// 1. Probe media accessibility & check size beforehand
export async function probeMedia(url: string): Promise<MediaProbeResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return {
      accessible: false,
      isDownloadable: false,
      error: 'Invalid media URL.'
    };
  }

  if (isRestrictedSourceUrl(url)) {
    return {
      accessible: true,
      isDownloadable: false,
      isHtmlRedirect: true,
      error: 'Direct download unavailable for this embedded media. Open the original source instead.'
    };
  }

  try {
    const res = await fetch('/api/news/media-probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        accessible: !!data.accessible,
        isDownloadable: !!data.isDownloadable,
        sizeBytes: data.sizeBytes,
        formattedSize: formatBytes(data.sizeBytes),
        contentType: data.contentType,
        statusCode: data.statusCode,
        isHtmlRedirect: !!data.isHtmlRedirect,
        error: data.error
      };
    }
  } catch {
    // Probe endpoint network fallback
  }

  return {
    accessible: true,
    isDownloadable: true
  };
}

// 2. Download Media File directly to user's device
export async function downloadMediaToDevice(options: {
  mediaUrl: string;
  sourceName: string;
  mediaType: 'image' | 'video';
  maxLimitMb: number; // 0 means no limit
  onProgress?: (percentage: number) => void;
}): Promise<MediaDownloadResult> {
  const { mediaUrl, sourceName, mediaType, maxLimitMb, onProgress } = options;

  if (isRestrictedSourceUrl(mediaUrl)) {
    return {
      success: false,
      isRestricted: true,
      error: 'Direct download unavailable for this media stream. Open the original source instead.'
    };
  }

  // Pre-check size limit if configured
  const probe = await probeMedia(mediaUrl);
  if (probe.sizeBytes && maxLimitMb > 0) {
    const sizeMb = probe.sizeBytes / (1024 * 1024);
    if (sizeMb > maxLimitMb) {
      return {
        success: false,
        exceedsLimit: true,
        sizeBytes: probe.sizeBytes,
        formattedSize: formatBytes(probe.sizeBytes),
        error: `File size (${formatBytes(probe.sizeBytes)}) exceeds your configured limit of ${maxLimitMb} MB.`
      };
    }
  }

  const filename = generateCleanMediaFilename(sourceName, mediaUrl, mediaType, probe.contentType);

  try {
    if (onProgress) onProgress(15);

    // Use secure server-side download proxy to ensure CORS compliance & proper headers
    const proxyUrl = `/api/news/media-proxy-download?url=${encodeURIComponent(mediaUrl)}&limitMb=${maxLimitMb}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      if (response.status === 413) {
        return {
          success: false,
          exceedsLimit: true,
          error: `File exceeds your download limit (${maxLimitMb} MB).`
        };
      }
      if (response.status === 403 || response.status === 401) {
        return {
          success: false,
          isRestricted: true,
          error: 'Media cannot be directly downloaded from this source. View the original story instead.'
        };
      }
      throw new Error(`Download failed with status ${response.status}`);
    }

    if (onProgress) onProgress(50);

    const blob = await response.blob();
    if (onProgress) onProgress(90);

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 45000);

    // Record to media cache tracker
    recordMediaCached(mediaUrl, mediaType, blob.size);

    if (onProgress) onProgress(100);

    return {
      success: true,
      filename,
      sizeBytes: blob.size,
      formattedSize: formatBytes(blob.size)
    };
  } catch (err: any) {
    console.warn('Proxy download failed, trying direct browser fetch fallback:', err);

    // Fallback: Direct browser fetch
    try {
      const directRes = await fetch(mediaUrl, { mode: 'cors' });
      if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
      const blob = await directRes.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 45000);

      recordMediaCached(mediaUrl, mediaType, blob.size);

      return {
        success: true,
        filename,
        sizeBytes: blob.size,
        formattedSize: formatBytes(blob.size)
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: 'Direct download unavailable. Open the original source instead.'
      };
    }
  }
}
