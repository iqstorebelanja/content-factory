import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Play,
  Check, 
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCheck,
  SkipForward,
  Pause,
  Download,
  Layers,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Clock,
  Send
} from 'lucide-react';
import { 
  SocialPost, 
  PlatformId, 
  PostStatus, 
  UserSocialAccounts, 
  SocialGroup,
  ShareSession,
  ShareSessionDestination,
  ShareDestinationStatus,
  DestinationContentType,
  MediaItem
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  formatPlatformCaption, 
  copyCaptionToClipboard, 
  openPlatformComposer, 
  triggerWebShare, 
  isWebShareSupported,
  createShareSession,
  saveActiveShareSession,
  getActiveShareSession,
  clearActiveShareSession,
  getRecommendedPlatformOrder
} from '../utils/shareEngine';
import { 
  getAllDestinations, 
  normalizeUserAccounts 
} from '../utils/socialAccounts';
import { PlatformPreview } from './PlatformPreview';

interface ShareConfirmationScreenProps {
  post: SocialPost;
  onBack: () => void;
  onPostCompleted: (updatedPost: SocialPost) => void;
  userAccounts?: UserSocialAccounts;
  socialGroups?: SocialGroup[];
  isFromDraft?: boolean;
}

export const ShareConfirmationScreen: React.FC<ShareConfirmationScreenProps> = ({
  post,
  onBack,
  onPostCompleted,
  userAccounts,
  socialGroups = [],
  isFromDraft = false
}) => {
  // Resolve Posting Group name if selected
  const postingGroup = post.selectedGroupId 
    ? socialGroups.find(g => g.id === post.selectedGroupId)
    : null;

  // Initialize or restore active session
  const [session, setSession] = useState<ShareSession>(() => {
    const existing = getActiveShareSession();
    if (existing && existing.postId === post.id && existing.destinations.length > 0) {
      return existing;
    }
    return createShareSession(post, userAccounts, {
      isFromDraft: isFromDraft || post.isDraft,
      groupName: postingGroup?.name
    });
  });

  const [activeProcessingId, setActiveProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedDestId, setExpandedDestId] = useState<string | null>(null);
  const [showPlatformPreview, setShowPlatformPreview] = useState<boolean>(false);
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>('facebook_page');
  const [showSessionComplete, setShowSessionComplete] = useState<boolean>(false);

  // Sync session changes to localStorage
  useEffect(() => {
    saveActiveShareSession(session);
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Download/save media locally for quick picking inside social apps
  const handleDownloadMedia = (media: MediaItem) => {
    try {
      const a = document.createElement('a');
      a.href = media.url;
      a.download = media.name || (media.type === 'video' ? 'video.mp4' : 'image.jpg');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Media downloaded to device!');
    } catch {
      window.open(media.url, '_blank');
      showToast('Media opened in new tab');
    }
  };

  // Metrics
  const totalCount = session.destinations.length;
  const completedCount = session.destinations.filter(d => d.status === 'Completed').length;
  const skippedCount = session.destinations.filter(d => d.status === 'Skipped').length;
  const pendingCount = totalCount - completedCount - skippedCount;
  const progressPercent = totalCount > 0 ? Math.round(((completedCount + skippedCount) / totalCount) * 100) : 0;

  // Active destination (first uncompleted or the one at currentDestinationIndex)
  const currentDestIndex = Math.min(
    Math.max(0, session.currentDestinationIndex),
    Math.max(0, session.destinations.length - 1)
  );
  const activeDest: ShareSessionDestination | undefined = session.destinations[currentDestIndex];

  // Update status for a specific destination
  const updateDestinationStatus = (
    destId: string, 
    newStatus: ShareDestinationStatus, 
    note?: string,
    additional?: Partial<ShareSessionDestination>
  ) => {
    setSession(prev => {
      const updatedDestinations = prev.destinations.map(d => {
        if (d.id === destId) {
          return {
            ...d,
            status: newStatus,
            statusNote: note || d.statusNote,
            completedAt: newStatus === 'Completed' ? new Date().toISOString() : d.completedAt,
            ...additional
          };
        }
        return d;
      });

      const allDone = updatedDestinations.every(d => d.status === 'Completed' || d.status === 'Skipped');
      
      // Advance to next incomplete destination if marking completed or skipped
      let nextIdx = prev.currentDestinationIndex;
      if (newStatus === 'Completed' || newStatus === 'Skipped') {
        const nextIncomplete = updatedDestinations.findIndex(
          (d, idx) => idx > prev.currentDestinationIndex && d.status !== 'Completed' && d.status !== 'Skipped'
        );
        if (nextIncomplete !== -1) {
          nextIdx = nextIncomplete;
        } else {
          // If none after, find any earlier incomplete
          const anyIncomplete = updatedDestinations.findIndex(
            d => d.status !== 'Completed' && d.status !== 'Skipped'
          );
          if (anyIncomplete !== -1) {
            nextIdx = anyIncomplete;
          }
        }
      }

      const nextSession: ShareSession = {
        ...prev,
        destinations: updatedDestinations,
        currentDestinationIndex: nextIdx,
        isComplete: allDone,
        updatedAt: new Date().toISOString()
      };

      if (allDone) {
        setShowSessionComplete(true);
      }

      return nextSession;
    });
  };

  // 1. Copy Caption Action
  const handleCopyCaption = async (dest: ShareSessionDestination) => {
    const textToCopy = dest.captionPayload || formatPlatformCaption(dest.platformId, {
      title: post.platformOverrides?.[dest.platformId]?.title || post.title,
      caption: post.platformOverrides?.[dest.platformId]?.caption || post.caption,
      description: post.platformOverrides?.[dest.platformId]?.description || post.description,
      hashtags: post.platformOverrides?.[dest.platformId]?.hashtags || post.hashtags,
      tags: post.platformOverrides?.[dest.platformId]?.tags,
      callToAction: post.platformOverrides?.[dest.platformId]?.callToAction || post.callToAction
    });

    const ok = await copyCaptionToClipboard(textToCopy);
    if (ok) {
      setCopiedId(dest.id);
      setTimeout(() => setCopiedId(null), 2500);
      showToast(`Caption copied for ${dest.name}!`);
      updateDestinationStatus(dest.id, dest.status === 'Completed' ? 'Completed' : 'Waiting for user', 'Caption copied to clipboard', {
        copiedCaption: true
      });
    } else {
      showToast('Could not copy to clipboard. Please copy manually.');
    }
  };

  // 2. Open Platform Action
  const handleOpenPlatform = (dest: ShareSessionDestination) => {
    // If destination has a saved URL, open it directly
    if (dest.url) {
      window.open(dest.url, '_blank');
      showToast(`Opening ${dest.name}...`);
      updateDestinationStatus(dest.id, dest.status === 'Completed' ? 'Completed' : 'Waiting for user', 'Opened in platform', {
        openedPlatform: true
      });
      return;
    }

    // Fall back to composer
    const content = {
      title: post.platformOverrides?.[dest.platformId]?.title || post.title,
      caption: post.platformOverrides?.[dest.platformId]?.caption || post.caption,
      description: post.platformOverrides?.[dest.platformId]?.description || post.description,
      hashtags: post.platformOverrides?.[dest.platformId]?.hashtags || post.hashtags,
      media: post.media
    };

    const targetDest = getAllDestinations(normalizeUserAccounts(userAccounts)).find(d => d.id === dest.id) || null;
    openPlatformComposer(dest.platformId, content, userAccounts, targetDest);
    showToast(`Opening ${dest.name}...`);
    updateDestinationStatus(dest.id, dest.status === 'Completed' ? 'Completed' : 'Waiting for user', 'Opened composer', {
      openedPlatform: true
    });
  };

  // 3. Share Now Action (Direct 1-tap manual workflow)
  const handleShareNow = async (dest: ShareSessionDestination) => {
    setActiveProcessingId(dest.id);
    updateDestinationStatus(dest.id, 'Sharing', 'Sharing in progress...');

    const textPayload = dest.captionPayload || formatPlatformCaption(dest.platformId, {
      title: post.platformOverrides?.[dest.platformId]?.title || post.title,
      caption: post.platformOverrides?.[dest.platformId]?.caption || post.caption,
      description: post.platformOverrides?.[dest.platformId]?.description || post.description,
      hashtags: post.platformOverrides?.[dest.platformId]?.hashtags || post.hashtags,
      tags: post.platformOverrides?.[dest.platformId]?.tags,
      callToAction: post.platformOverrides?.[dest.platformId]?.callToAction || post.callToAction
    });

    // Step A: Always copy tailored caption first
    const copied = await copyCaptionToClipboard(textPayload);
    if (copied) {
      setCopiedId(dest.id);
      setTimeout(() => setCopiedId(null), 2500);
    }

    // Step B: If Web Share API with files is available and user is on mobile
    if (isWebShareSupported()) {
      try {
        const shared = await triggerWebShare({
          title: post.title || dest.name,
          text: textPayload,
          media: post.media
        });
        if (shared) {
          showToast(`Shared to system share sheet. Now tap 'Mark Completed' when done.`);
          updateDestinationStatus(dest.id, 'Waiting for user', 'Shared to system share sheet; awaiting confirmation', {
            copiedCaption: true
          });
          setActiveProcessingId(null);
          return;
        }
      } catch (err) {
        console.warn('WebShare cancelled or unsupported for files, opening composer directly:', err);
      }
    }

    // Step C: Open destination page/app
    handleOpenPlatform(dest);
    showToast(`Caption copied! Opened ${dest.name}. Paste caption and tap 'Mark Completed' when done.`);
    updateDestinationStatus(dest.id, 'Waiting for user', 'Caption copied & platform opened', {
      copiedCaption: true,
      openedPlatform: true
    });
    setActiveProcessingId(null);
  };

  // 4. Mark Completed (ONLY on explicit user click!)
  const handleMarkCompleted = (destId: string) => {
    updateDestinationStatus(destId, 'Completed', 'Manually marked completed by user');
    showToast('Destination marked Completed!');
  };

  // 5. Skip destination
  const handleSkip = (destId: string) => {
    updateDestinationStatus(destId, 'Skipped', 'Skipped by user');
    showToast('Destination skipped.');
  };

  // 6. Retry destination
  const handleRetry = (destId: string) => {
    updateDestinationStatus(destId, 'Ready', 'Ready to share');
  };

  // 7. Pause & Save for Later
  const handlePauseSession = () => {
    setSession(prev => ({ ...prev, isPaused: true, updatedAt: new Date().toISOString() }));
    showToast('Share session saved. You can resume at any time.');
    onBack();
  };

  // 8. Complete and save to History
  const handleFinishSession = () => {
    // Build updated SocialPost with truthful platformStatuses
    const updatedPlatformStatuses: Record<string, { status: PostStatus; note?: string; updatedAt: string }> = {
      ...(post.platformStatuses || {})
    };

    session.destinations.forEach(d => {
      const pStatus: PostStatus = 
        d.status === 'Completed' ? 'COMPLETED' : 
        d.status === 'Skipped' ? 'SKIPPED' : 'READY';

      updatedPlatformStatuses[d.id] = {
        status: pStatus,
        note: d.statusNote || `${d.status} at ${d.completedAt || new Date().toISOString()}`,
        updatedAt: d.completedAt || new Date().toISOString()
      };

      // Also record under platformId for backward compatibility
      if (d.platformId && !updatedPlatformStatuses[d.platformId]) {
        updatedPlatformStatuses[d.platformId] = {
          status: pStatus,
          note: `${d.name} (${d.contentType}): ${d.status}`,
          updatedAt: d.completedAt || new Date().toISOString()
        };
      }
    });

    const updatedPost: SocialPost = {
      ...post,
      platformStatuses: updatedPlatformStatuses,
      scheduledAt: post.scheduledAt || new Date().toISOString()
    };

    clearActiveShareSession();
    onPostCompleted(updatedPost);
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: ShareDestinationStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'Sharing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Sharing...</span>
          </span>
        );
      case 'Waiting for user':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Waiting for user</span>
          </span>
        );
      case 'Skipped':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <SkipForward className="w-3 h-3" />
            <span>Skipped</span>
          </span>
        );
      case 'Error':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Error</span>
          </span>
        );
      case 'Ready':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Ready
          </span>
        );
    }
  };

  // Helper for Content Type tag
  const renderContentTypeTag = (cType: DestinationContentType, platformId: PlatformId) => {
    const isProfile = platformId === 'facebook_profile';
    const isPage = platformId === 'facebook_page';

    let label = cType.toUpperCase();
    if (cType === 'reel') label = 'REEL';
    else if (cType === 'short') label = 'SHORT';
    else if (cType === 'video') label = 'VIDEO';
    else if (cType === 'post') label = 'POST';
    else if (cType === 'tweet') label = 'TWEET';
    else if (cType === 'message') label = 'MESSAGE';

    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
        isProfile 
          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' 
          : isPage 
          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}>
        {isProfile ? `Profile • ${label}` : isPage ? `Page • ${label}` : label}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <Info className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar with Back, Progress and Pause */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          id="btn-back-share-center"
          type="button"
          onClick={handlePauseSession}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {postingGroup && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{postingGroup.name}</span>
            </span>
          )}
          <button
            id="btn-pause-share-session"
            type="button"
            onClick={handlePauseSession}
            className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
            title="Save and exit. You can resume anytime."
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        </div>
      </div>

      {/* Share Center Header Banner */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Share Center • Manual Cross-Posting</span>
              </h2>
              {isFromDraft && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Draft Preserved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Processing {totalCount} destination{totalCount === 1 ? '' : 's'} in recommended canonical order.
            </p>
          </div>

          <button
            id="btn-toggle-platform-preview"
            type="button"
            onClick={() => setShowPlatformPreview(prev => !prev)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>{showPlatformPreview ? 'Hide Preview' : 'Platform Preview'}</span>
          </button>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>
              Sharing <span className="font-bold text-slate-900 dark:text-white">{completedCount + skippedCount}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> destinations
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{completedCount} Done</span>
              {skippedCount > 0 && <span className="text-slate-500">{skippedCount} Skipped</span>}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{progressPercent}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Post & Media Summary Card */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-sm">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Post Content & Media</span>
          <span className="text-[11px] font-normal text-slate-400">
            {post.media ? `${post.media.type.toUpperCase()} attached` : 'Text only'}
          </span>
        </div>

        {/* Media Preview & Download Action */}
        {post.media && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="w-14 h-14 rounded-lg bg-black overflow-hidden flex items-center justify-center shrink-0 relative">
              {post.media.type === 'video' ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    src={post.media.url} 
                    className="w-full h-full object-cover" 
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white opacity-80" />
                  </div>
                </div>
              ) : (
                <img 
                  src={post.media.url} 
                  alt="Media preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {post.media.name || (post.media.type === 'video' ? 'video_clip.mp4' : 'post_image.jpg')}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="uppercase font-bold text-[10px] px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                  {post.media.type}
                </span>
                {post.media.sizeBytes && (
                  <span>{formatFileSize(post.media.sizeBytes)}</span>
                )}
                {post.media.durationSeconds && post.media.durationSeconds > 0 && (
                  <span>{Math.round(post.media.durationSeconds)}s duration</span>
                )}
              </div>
            </div>

            <button
              id="btn-download-media-share-center"
              type="button"
              onClick={() => post.media && handleDownloadMedia(post.media)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 shrink-0"
              title="Save media locally to device to attach inside social app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Media</span>
            </button>
          </div>
        )}

        {/* Post Title & General Caption Snippet */}
        <div className="space-y-1">
          {post.title && (
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {post.title}
            </div>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {post.caption || post.description || 'No general caption provided'}
          </p>
        </div>
      </div>

      {/* Platform Preview Drawer if active */}
      {showPlatformPreview && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-900 rounded-2xl space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Platform Preview Simulator</span>
            </span>
            <select
              value={previewPlatform}
              onChange={(e) => setPreviewPlatform(e.target.value as PlatformId)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {session.destinations.map(d => (
                <option key={d.id} value={d.platformId}>
                  {d.name} ({d.contentType})
                </option>
              ))}
            </select>
          </div>
          <PlatformPreview 
            post={post}
            platformId={previewPlatform}
          />
        </div>
      )}

      {/* ACTIVE DESTINATION STEPPER HERO CARD */}
      {activeDest && activeDest.status !== 'Completed' && (
        <div className="bg-gradient-to-b from-indigo-50/70 to-white dark:from-slate-900 dark:to-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/50 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm"
                style={{ backgroundColor: PLATFORMS[activeDest.platformId]?.bgColor || '#4f46e5' }}
              >
                {PLATFORMS[activeDest.platformId]?.badge || activeDest.platformId.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Step {currentDestIndex + 1} of {totalCount}: {activeDest.name}
                  </span>
                  {renderContentTypeTag(activeDest.contentType, activeDest.platformId)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeDest.accountIdentifier || activeDest.url || 'Manual Share'}
                </div>
              </div>
            </div>

            {renderStatusBadge(activeDest.status)}
          </div>

          {/* Step-by-step Manual Guide Notice */}
          <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Manual Cross-Posting Instructions:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-300 pl-0.5">
              <li>Tap <strong>Copy Caption</strong> to copy tailored text & hashtags</li>
              <li>Tap <strong>Open Platform</strong> to open your profile/page/app</li>
              <li>Paste caption, attach your saved media, and publish in the app</li>
              <li>Return here and tap <strong>Mark Completed</strong></li>
            </ol>
          </div>

          {/* Platform Specific Tailored Caption Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Platform-Specific Tailored Caption:</span>
              <button
                type="button"
                onClick={() => handleCopyCaption(activeDest)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                {copiedId === activeDest.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === activeDest.id ? 'Copied!' : 'Copy Caption'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              {activeDest.captionPayload}
            </p>
          </div>

          {/* Stepper Primary Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              id={`btn-share-now-${activeDest.id}`}
              type="button"
              onClick={() => handleShareNow(activeDest)}
              disabled={activeProcessingId === activeDest.id}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share Now</span>
            </button>

            <button
              id={`btn-open-platform-${activeDest.id}`}
              type="button"
              onClick={() => handleOpenPlatform(activeDest)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Platform</span>
            </button>

            <button
              id={`btn-copy-caption-${activeDest.id}`}
              type="button"
              onClick={() => handleCopyCaption(activeDest)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Caption</span>
            </button>

            <button
              id={`btn-mark-completed-${activeDest.id}`}
              type="button"
              onClick={() => handleMarkCompleted(activeDest.id)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Mark Completed</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => handleSkip(activeDest.id)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium text-[11px]"
            >
              <SkipForward className="w-3 h-3" />
              <span>Skip this destination</span>
            </button>

            {activeDest.status === 'Error' && (
              <button
                type="button"
                onClick={() => handleRetry(activeDest.id)}
                className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ALL DESTINATIONS LIST (Canonical Recommended Order) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 px-1">
          <span>All Destinations ({totalCount})</span>
          <span className="text-[11px] font-normal text-slate-500">
            Recommended order: FB Pages & Profiles • IG • TikTok • YouTube • X • WhatsApp
          </span>
        </div>

        <div className="space-y-2.5">
          {session.destinations.map((dest, idx) => {
            const isCurrent = idx === session.currentDestinationIndex;
            const isExpanded = expandedDestId === dest.id;
            const platformConfig = PLATFORMS[dest.platformId] || PLATFORMS.facebook_page;

            return (
              <div
                key={dest.id}
                className={`p-3.5 bg-white dark:bg-slate-900 border rounded-2xl transition-all shadow-sm ${
                  isCurrent 
                    ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                    : dest.status === 'Completed'
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                      style={{ backgroundColor: platformConfig.bgColor || '#4f46e5' }}
                    >
                      {platformConfig.badge || dest.platformId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {dest.name}
                        </span>
                        {renderContentTypeTag(dest.contentType, dest.platformId)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {dest.accountIdentifier || dest.url || platformConfig.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(dest.status)}
                    <button
                      type="button"
                      onClick={() => setExpandedDestId(isExpanded ? null : dest.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Platform Caption & Detailed Controls */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs animate-fadeIn">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>Platform-Specific Content:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCaption(dest)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          {copiedId === dest.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === dest.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-28 overflow-y-auto">
                        {dest.captionPayload}
                      </p>
                    </div>

                    {/* Quick Row of Destination Actions */}
                    <div className="flex items-center justify-end flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleShareNow(dest)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>Share Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPlatform(dest)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCaption(dest)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>

                      {dest.status !== 'Completed' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(dest.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateDestinationStatus(dest.id, 'Ready', 'Unmarked completed')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          Unmark
                        </button>
                      )}

                      {dest.status !== 'Skipped' && dest.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleSkip(dest.id)}
                          className="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Session Completion Card */}
      <div className="p-4 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Ready to record results?
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {completedCount} of {totalCount} destinations completed.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePauseSession}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Save & Exit
          </button>
          <button
            id="btn-finish-share-session"
            type="button"
            onClick={handleFinishSession}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Finish & Save to History</span>
          </button>
        </div>
      </div>

      {/* MODAL: SHARE SESSION COMPLETE MODAL */}
      {showSessionComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Share Session Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have processed all selected destinations in this manual cross-posting workflow.
              </p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                  Completed
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                  {skippedCount}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">
                  Skipped
                </div>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {pendingCount}
                </div>
                <div className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase">
                  Pending
                </div>
              </div>
            </div>

            {/* Destination breakdown list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
              {session.destinations.map(d => (
                <div 
                  key={d.id}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {d.name}
                    </span>
                    {renderContentTypeTag(d.contentType, d.platformId)}
                  </div>
                  {renderStatusBadge(d.status)}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSessionComplete(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Review Session
              </button>
              <button
                id="btn-modal-save-history"
                type="button"
                onClick={handleFinishSession}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save to History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
