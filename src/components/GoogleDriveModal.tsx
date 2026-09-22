import React, { useState } from 'react';
import { 
  X, 
  HardDrive, 
  Image as ImageIcon, 
  Video, 
  Check, 
  ExternalLink, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { MediaItem } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  isConnected: boolean;
  userEmail?: string;
  onConnect: () => void;
  files: any[];
  isLoading: boolean;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  isConnected,
  userEmail,
  onConnect,
  files,
  isLoading
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Demo Google Drive sample files if user hasn't synced cloud files yet
  const displayFiles = files.length > 0 ? files : [
    {
      id: 'gdrive-img-1',
      name: 'Jangari_Dam_Scenic_Sunset.jpg',
      mimeType: 'image/jpeg',
      thumbnailLink: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      size: '2.4 MB'
    },
    {
      id: 'gdrive-vid-1',
      name: 'Freshwater_Fishing_Action_Short.mp4',
      mimeType: 'video/mp4',
      thumbnailLink: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      size: '18.6 MB'
    },
    {
      id: 'gdrive-img-2',
      name: 'Lake_Floating_Cottage_Landscape.jpg',
      mimeType: 'image/jpeg',
      thumbnailLink: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
      size: '3.1 MB'
    }
  ];

  const handleConfirmSelection = () => {
    const chosen = displayFiles.find(f => f.id === selectedFileId);
    if (!chosen) return;

    const isVid = chosen.mimeType?.includes('video');
    const mediaItem: MediaItem = {
      id: `drive-${chosen.id}`,
      name: chosen.name,
      type: isVid ? 'video' : 'image',
      url: chosen.thumbnailLink || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
      source: 'drive'
    };

    onSelectMedia(mediaItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Drive Media Picker
              </h3>
              <p className="text-[11px] text-slate-400">
                {isConnected ? `Synced with ${userEmail}` : 'Select media from Google Drive'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not connected prompt */}
        {!isConnected && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold">Connect your Google Drive</div>
              <div className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Tap to grant readonly access to your videos & photos.
              </div>
            </div>
            <button
              onClick={onConnect}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-blue-500 transition-colors"
            >
              Authorize
            </button>
          </div>
        )}

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available Media Files ({displayFiles.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayFiles.map(file => {
              const isSelected = selectedFileId === file.id;
              const isVideo = file.mimeType?.includes('video');

              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                    <img
                      src={file.thumbnailLink}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 p-0.5 bg-black/70 rounded text-[9px] text-white">
                      {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {file.size || (isVideo ? 'Video' : 'Photo')}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            disabled={!selectedFileId}
            onClick={handleConfirmSelection}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all"
          >
            Attach Selected Media
          </button>
        </div>
      </div>
    </div>
  );
};
