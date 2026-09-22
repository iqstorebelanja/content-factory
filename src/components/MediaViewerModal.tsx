import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  FileText,
  Clock,
  Maximize2,
  Check,
  RefreshCw,
  Eye,
  ShieldAlert,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { NewsMediaItem } from '../types';
import {
  probeMedia,
  downloadMediaToDevice,
  formatBytes,
  isRestrictedSourceUrl
} from '../utils/mediaDownloader';

interface MediaViewerModalProps {
  media: NewsMediaItem;
  articleTitle?: string;
  sourceName: string;
  sourceUrl: string;
  downloadLimitMb: number;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  media,
  articleTitle,
  sourceName,
  sourceUrl,
  downloadLimitMb,
  onClose,
  onOpenSettings
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProbing, setIsProbing] = useState(true);
  const [probeData, setProbeData] = useState<{
    accessible?: boolean;
    isDownloadable?: boolean;
    sizeBytes?: number;
    contentType?: string;
    error?: string;
  }>({});

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Warnings / confirmations
  const [showLargeVideoWarning, setShowLargeVideoWarning] = useState(false);
  const [showLimitExceededWarning, setShowLimitExceededWarning] = useState<{
    sizeBytes?: number;
    message: string;
  } | null>(null);

  const isVideo = media.type === 'video';
  const isEmbedOrRestricted = isRestrictedSourceUrl(media.url) || media.status === 'preview_only';

  // Probe media on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsProbing(true);
      const res = await probeMedia(media.url);
      if (isMounted) {
        setProbeData(res);
        setIsProbing(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [media.url]);

  const executeDownload = async () => {
    setShowLargeVideoWarning(false);
    setShowLimitExceededWarning(null);
    setDownloadError(null);
    setIsDownloading(true);
    setDownloadProgress(10);

    const result = await downloadMediaToDevice({
      mediaUrl: media.url,
      sourceName: media.sourceName || sourceName,
      mediaType: media.type,
      maxLimitMb: downloadLimitMb,
      onProgress: p => setDownloadProgress(p)
    });

    setIsDownloading(false);

    if (result.success) {
      setDownloadSuccess(`Downloaded successfully as ${result.filename}`);
      setTimeout(() => setDownloadSuccess(null), 4500);
    } else if (result.exceedsLimit) {
      setShowLimitExceededWarning({
        sizeBytes: result.sizeBytes,
        message: result.error || 'File exceeds your configured download limit.'
      });
    } else {
      setDownloadError(result.error || 'Direct download unavailable. Open the original source instead.');
    }
  };

  const handleDownloadClick = () => {
    // 1. Check if restricted or embed
    if (isEmbedOrRestricted) {
      setDownloadError('Preview only. Direct video download is restricted by the source.');
      return;
    }

    // 2. Check if size is known and exceeds limit
    const sizeBytes = probeData.sizeBytes || media.fileSizeBytes;
    if (sizeBytes && downloadLimitMb > 0) {
      const sizeMb = sizeBytes / (1024 * 1024);
      if (sizeMb > downloadLimitMb) {
        setShowLimitExceededWarning({
          sizeBytes,
          message: `File exceeds your current download limit of ${downloadLimitMb} MB.`
        });
        return;
      }
    }

    // 3. For video > 20 MB, require user confirmation
    if (isVideo) {
      const sizeMb = (sizeBytes || 0) / (1024 * 1024);
      if (sizeMb > 20) {
        setShowLargeVideoWarning(true);
        return;
      }
    }

    executeDownload();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {isVideo ? 'Video Viewer' : 'Image Viewer'}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                Media source: {media.sourceName || sourceName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 space-y-3.5 flex-1">
          
          {/* Main Media Preview Box */}
          <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center min-h-[220px] max-h-[360px]">
            {isVideo ? (
              isEmbedOrRestricted ? (
                <div className="w-full text-center p-6 space-y-3">
                  {media.thumbnailUrl ? (
                    <div className="relative mx-auto max-h-[200px] overflow-hidden rounded-xl">
                      <img
                        src={media.thumbnailUrl}
                        alt="Video Thumbnail"
                        className="w-full h-auto object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Film className="w-12 h-12 text-slate-500 mx-auto" />
                  )}
                  <div className="text-xs text-slate-300 font-medium max-w-sm mx-auto">
                    This video is embedded or hosted on an external platform (e.g. YouTube). Direct playback is preserved at source.
                  </div>
                  <a
                    href={media.url || sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                  >
                    <span>Watch on {media.sourceName || 'Source'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={media.url}
                    poster={media.thumbnailUrl}
                    controls
                    playsInline
                    preload="none"
                    className="max-h-[340px] w-full object-contain rounded-xl"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    Your browser does not support HTML5 video.
                  </video>
                </div>
              )
            ) : (
              <img
                src={media.url}
                alt={articleTitle || 'News Media Preview'}
                className="max-h-[340px] w-full object-contain rounded-xl"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Media Metadata Table (Requirement #3) */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-xs space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Technical Details & Attribution
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Attribution:</span>{' '}
                <span className="text-slate-200 font-medium">{media.sourceName || sourceName}</span>
              </div>

              <div>
                <span className="text-slate-400">Media Type:</span>{' '}
                <span className="text-slate-200 font-medium uppercase">{media.type}</span>
              </div>

              {(media.width || media.height) && (
                <div>
                  <span className="text-slate-400">Dimensions:</span>{' '}
                  <span className="text-slate-200 font-medium">
                    {media.width || '?'} × {media.height || '?'} px
                  </span>
                </div>
              )}

              {media.durationSeconds && (
                <div>
                  <span className="text-slate-400">Duration:</span>{' '}
                  <span className="text-slate-200 font-medium">
                    {Math.floor(media.durationSeconds / 60)}m {media.durationSeconds % 60}s
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400">File Size:</span>{' '}
                <span className="text-slate-200 font-medium">
                  {formatBytes(probeData.sizeBytes || media.fileSizeBytes)}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="text-slate-200 font-medium">
                  {isEmbedOrRestricted ? 'Preview Only' : (probeData.isDownloadable !== false ? 'Downloadable' : 'Source Only')}
                </span>
              </div>
            </div>

            {probeData.contentType && (
              <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                MIME: {probeData.contentType}
              </div>
            )}
          </div>

          {/* Large Video Warning Prompt (Requirement #5) */}
          {showLargeVideoWarning && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Large Video Warning</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                This video is large ({formatBytes(probeData.sizeBytes || media.fileSizeBytes)}) and may use significant mobile data and local storage.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={executeDownload}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Download Anyway
                </button>
                <button
                  type="button"
                  onClick={() => setShowLargeVideoWarning(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Download Limit Exceeded Prompt (Requirement #4 & #5) */}
          {showLimitExceededWarning && (
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-3.5 space-y-2.5 text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Download Limit Exceeded</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                {showLimitExceededWarning.message}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Increase Limit in Settings
                  </button>
                )}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-medium text-xs inline-flex items-center gap-1"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowLimitExceededWarning(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Download Error or Restriction Message */}
          {downloadError && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs text-slate-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>{downloadError}</div>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:underline font-medium text-[11px]"
                >
                  <span>Open original article</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Download Success */}
          {downloadSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-1.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  Downloading media securely...
                </span>
                <span className="font-mono font-bold text-indigo-400">{downloadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls (Requirement #3) */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 shrink-0 flex items-center justify-between gap-2 flex-wrap">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span>View Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            {!isEmbedOrRestricted && (
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadClick}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isVideo ? 'Download Video' : 'Download Image'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
