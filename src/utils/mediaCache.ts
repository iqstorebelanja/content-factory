// Safe Media Cache Tracker for News Hunter
// Tracks cached media metadata and downloaded blob references without touching drafts, history, library, or accounts.

const STORAGE_KEY_MEDIA_CACHE = 'sss_news_media_cache';

export interface MediaCacheItem {
  url: string;
  type: 'image' | 'video';
  sizeBytes?: number;
  cachedAt: string;
  source?: 'news_hunter' | 'news_library' | 'media_discovery' | 'preview' | 'temp_download' | 'user_upload';
  isPermanent?: boolean;
}

export interface MediaCacheStore {
  items: MediaCacheItem[];
  lastCleared: string | null;
}

export function getMediaCacheStore(): MediaCacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEDIA_CACHE);
    if (!raw) {
      return { items: [], lastCleared: null };
    }
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      lastCleared: parsed.lastCleared || null
    };
  } catch {
    return { items: [], lastCleared: null };
  }
}

export function recordMediaCached(
  url: string, 
  type: 'image' | 'video', 
  sizeBytes?: number,
  options?: {
    source?: 'news_hunter' | 'news_library' | 'media_discovery' | 'preview' | 'temp_download' | 'user_upload';
    isPermanent?: boolean;
  }
): void {
  try {
    const store = getMediaCacheStore();
    const existingIndex = store.items.findIndex(i => i.url === url);
    const entry: MediaCacheItem = {
      url,
      type,
      sizeBytes: sizeBytes && sizeBytes > 0 ? sizeBytes : (type === 'image' ? 350 * 1024 : 3.5 * 1024 * 1024),
      cachedAt: new Date().toISOString(),
      source: options?.source || 'temp_download',
      isPermanent: !!options?.isPermanent
    };

    if (existingIndex >= 0) {
      store.items[existingIndex] = {
        ...store.items[existingIndex],
        ...entry,
        // Preserve isPermanent if previously set
        isPermanent: store.items[existingIndex].isPermanent || entry.isPermanent
      };
    } else {
      store.items.unshift(entry);
    }

    // Keep max 300 recent cached references
    if (store.items.length > 300) {
      store.items = store.items.slice(0, 300);
    }

    localStorage.setItem(STORAGE_KEY_MEDIA_CACHE, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to record media cache entry:', err);
  }
}

export function getMediaCacheStats(): {
  count: number;
  totalSizeBytes: number;
  formattedSize: string;
  lastCleared: string | null;
} {
  const store = getMediaCacheStore();
  const count = store.items.length;
  const totalSizeBytes = store.items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);

  let formattedSize = '0 KB';
  if (totalSizeBytes > 1024 * 1024 * 1024) {
    formattedSize = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (totalSizeBytes > 1024 * 1024) {
    formattedSize = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (totalSizeBytes > 0) {
    formattedSize = `${Math.round(totalSizeBytes / 1024)} KB`;
  }

  return {
    count,
    totalSizeBytes,
    formattedSize,
    lastCleared: store.lastCleared
  };
}

export function clearMediaCache(): { count: number; totalSizeBytes: number; formattedSize: string; lastCleared: string } {
  try {
    const timestamp = new Date().toISOString();
    const clearedStore: MediaCacheStore = {
      items: [],
      lastCleared: timestamp
    };
    localStorage.setItem(STORAGE_KEY_MEDIA_CACHE, JSON.stringify(clearedStore));
    return {
      count: 0,
      totalSizeBytes: 0,
      formattedSize: '0 KB',
      lastCleared: timestamp
    };
  } catch (err) {
    console.error('Failed to clear media cache:', err);
    return {
      count: 0,
      totalSizeBytes: 0,
      formattedSize: '0 KB',
      lastCleared: new Date().toISOString()
    };
  }
}
