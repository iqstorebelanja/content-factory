/**
 * Local Media Storage Abstraction
 * Keeps large binary media separated from normal JSON state.
 * Web: IndexedDB / Blob URLs
 * Android: Native content:// or app-private files
 */

import { logger } from './logger';
import { errorReporter } from './errorReporter';

export interface NativeMediaMetadata {
  mediaId: string;
  mediaType: 'image' | 'video';
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  source: 'local' | 'drive' | 'sample' | 'camera' | 'device';
  localReference?: string;
  isDeviceSpecific?: boolean;
  createdAt: string;
}

const DB_NAME = 'sss_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
          logger.warn('IndexedDB failed to open, falling back to memory store', e);
          resolve(null);
        };
      } catch (err) {
        logger.warn('IndexedDB initialization exception', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

// In-memory fallback if IndexedDB is unavailable
const memoryFallback = new Map<string, Blob>();

export const mediaStorage = {
  /**
   * Save a binary file/blob with a specific key
   */
  async save(key: string, data: Blob | File): Promise<string> {
    try {
      const db = await getIndexedDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(data, key);
          req.onsuccess = () => resolve(key);
          req.onerror = () => reject(req.error);
        });
      } else {
        memoryFallback.set(key, data);
        return key;
      }
    } catch (err) {
      errorReporter.report('STORAGE_SAVE_FAIL', 'MediaStorage', String(err), 'Failed to save media locally', true);
      memoryFallback.set(key, data);
      return key;
    }
  },

  /**
   * Load a binary file/blob by key
   */
  async load(key: string): Promise<Blob | null> {
    try {
      const db = await getIndexedDB();
      if (db) {
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      } else {
        return memoryFallback.get(key) || null;
      }
    } catch {
      return memoryFallback.get(key) || null;
    }
  },

  /**
   * Check if a media item exists
   */
  async exists(key: string): Promise<boolean> {
    const item = await this.load(key);
    return item !== null;
  },

  /**
   * Delete media item by key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const db = await getIndexedDB();
      if (db) {
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        });
      } else {
        return memoryFallback.delete(key);
      }
    } catch {
      return memoryFallback.delete(key);
    }
  },

  /**
   * Get accessible URI for media (e.g. Blob URL for web, content:// URI for native)
   */
  async getUri(key: string): Promise<string | null> {
    const blob = await this.load(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }
};
