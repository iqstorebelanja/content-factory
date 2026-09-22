/**
 * Lightweight Network Status Abstraction
 * Event-based network state tracking without continuous polling
 */

import { useState, useEffect } from 'react';

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

let currentStatus: NetworkStatus = typeof navigator !== 'undefined'
  ? (navigator.onLine ? 'ONLINE' : 'OFFLINE')
  : 'UNKNOWN';

const listeners = new Set<(status: NetworkStatus) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus = 'ONLINE';
    listeners.forEach(cb => cb('ONLINE'));
  });

  window.addEventListener('offline', () => {
    currentStatus = 'OFFLINE';
    listeners.forEach(cb => cb('OFFLINE'));
  });
}

export const getNetworkStatus = (): NetworkStatus => {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  return navigator.onLine ? 'ONLINE' : 'OFFLINE';
};

export const isOnline = (): boolean => {
  return getNetworkStatus() !== 'OFFLINE';
};

export const subscribeToNetworkStatus = (callback: (status: NetworkStatus) => void): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * React Hook for responsive UI network state
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(currentStatus);

  useEffect(() => {
    setStatus(getNetworkStatus());
    const unsubscribe = subscribeToNetworkStatus(newStatus => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  return status;
}
