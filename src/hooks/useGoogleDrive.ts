import { useState, useEffect, useCallback } from 'react';
import { sanitizeUserFacingError } from '../utils/errorSanitizer';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
}

const DEFAULT_PUBLIC_OAUTH_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '173835053329-7a9ssed6p8l3nl71f8i6kk6nimj8ae0c.apps.googleusercontent.com';

export function useGoogleDrive() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);

  // Check saved token in ephemeral sessionStorage (never persisted in localStorage or backups)
  useEffect(() => {
    const savedToken = sessionStorage.getItem('gdrive_access_token');
    const savedEmail = sessionStorage.getItem('gdrive_user_email');
    if (savedToken) {
      setToken(savedToken);
      if (savedEmail) setUserEmail(savedEmail);
    }
  }, []);

  const initTokenClient = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services script not yet loaded'));
        return;
      }

      // If we already have a valid token
      if (token) {
        resolve(token);
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: DEFAULT_PUBLIC_OAUTH_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              setToken(response.access_token);
              sessionStorage.setItem('gdrive_access_token', response.access_token);
              resolve(response.access_token);
            }
          }
        });
        client.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        reject(err);
      }
    });
  }, [token]);

  const connectDrive = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = await initTokenClient();
      setToken(accessToken);
      await fetchDriveMediaFiles(accessToken);
    } catch (err: any) {
      setError(sanitizeUserFacingError(err, 'Could not connect Google Drive'));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectDrive = () => {
    setToken(null);
    setUserEmail(null);
    setFiles([]);
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_user_email');
  };

  const fetchDriveMediaFiles = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = encodeURIComponent("mimeType contains 'image/' or mimeType contains 'video/'");
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size)&pageSize=20`,
        {
          headers: {
            Authorization: `Bearer ${activeToken}`
          }
        }
      );
      if (!res.ok) {
        throw new Error(`Drive API error (${res.status})`);
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(sanitizeUserFacingError(err, 'Failed to load Google Drive files.'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected: !!token,
    token,
    userEmail: userEmail || (token ? 'Connected Google Account' : undefined),
    isLoading,
    error,
    files,
    connectDrive,
    disconnectDrive,
    fetchDriveMediaFiles
  };
}
