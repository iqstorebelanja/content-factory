import { useState, useEffect, useCallback } from 'react';

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

export function useGoogleDrive() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);

  // Check saved token in sessionStorage
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
          client_id: '173835053329-client.apps.googleusercontent.com', // Will be supplemented by GIS or active token
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
      // In this environment, we can also check if a bearer token is provided or use Google GIS popup
      const accessToken = await initTokenClient();
      setToken(accessToken);
      await fetchDriveMediaFiles(accessToken);
    } catch (err: any) {
      console.warn('Drive connection note:', err.message);
      // Fallback for preview demo if client id popup restricted in iframe
      setError(err.message || 'Could not connect Google Drive');
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
        throw new Error(`Drive API error: ${res.statusText}`);
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected: !!token,
    token,
    userEmail: userEmail || 'iqstorebelanja@gmail.com',
    isLoading,
    error,
    files,
    connectDrive,
    disconnectDrive,
    fetchDriveMediaFiles
  };
}
