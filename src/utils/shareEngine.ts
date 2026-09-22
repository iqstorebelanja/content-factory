import { 
  PlatformId, 
  MediaItem, 
  UserSocialAccounts, 
  SocialAccountDestination,
  SocialPost,
  ShareSession,
  ShareSessionDestination,
  ShareDestinationStatus,
  DestinationContentType
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  sanitizeUrl, 
  getDestinationsForPlatform, 
  getAllDestinations,
  normalizeUserAccounts 
} from './socialAccounts';
import { nativeBridge } from '../services/nativeBridge';

export interface ManualShareResult {
  success: boolean;
  copied: boolean;
  opened: boolean;
  sharedViaWebShare: boolean;
  message: string;
}

export const ACTIVE_SHARE_SESSION_STORAGE_KEY = 'sss_active_share_session';

/**
 * Recommended destination order:
 * 1. Facebook Page
 * 2. Facebook Personal Profile
 * 3. Instagram
 * 4. TikTok
 * 5. YouTube
 * 6. X (Twitter)
 * 7. WhatsApp
 */
export function getRecommendedPlatformOrder(platformId: PlatformId): number {
  switch (platformId) {
    case 'facebook_page':
      return 1;
    case 'facebook_profile':
      return 2;
    case 'facebook':
      return 2.5;
    case 'instagram':
      return 3;
    case 'tiktok':
      return 4;
    case 'youtube':
      return 5;
    case 'twitter':
      return 6;
    case 'whatsapp':
      return 7;
    default:
      return 99;
  }
}

/**
 * Determines appropriate content type based on platform and post media
 */
export function determineDestinationContentType(
  platformId: PlatformId,
  post: SocialPost,
  destId?: string
): DestinationContentType {
  if (destId && post.destinationContentTypes?.[destId]) {
    return post.destinationContentTypes[destId];
  }

  const isVideo = post.media?.type === 'video';

  switch (platformId) {
    case 'facebook_page':
      if (post.facebookPageContentType) return post.facebookPageContentType;
      return isVideo ? 'reel' : 'post';

    case 'facebook_profile':
    case 'facebook':
      if (post.facebookProfileContentType) return post.facebookProfileContentType;
      return isVideo ? 'reel' : 'post';

    case 'instagram':
      return isVideo ? 'reel' : 'post';

    case 'tiktok':
      return 'video';

    case 'youtube':
      if (isVideo) {
        const duration = post.media?.durationSeconds || 0;
        return duration > 0 && duration <= 60 ? 'short' : 'video';
      }
      return 'video';

    case 'twitter':
      return 'tweet';

    case 'whatsapp':
      return 'message';

    default:
      return 'post';
  }
}

/**
 * Builds the list of sorted destinations for a post and attaches tailored content
 */
export function buildShareSessionDestinations(
  post: SocialPost,
  userAccounts?: UserSocialAccounts
): ShareSessionDestination[] {
  const normalized = normalizeUserAccounts(userAccounts);
  const allDestinations = getAllDestinations(normalized);

  const list: ShareSessionDestination[] = [];
  const processedIds = new Set<string>();

  // 1. If explicit destination IDs were selected
  if (post.selectedDestinationIds && post.selectedDestinationIds.length > 0) {
    for (const destId of post.selectedDestinationIds) {
      if (processedIds.has(destId)) continue;
      processedIds.add(destId);

      const found = allDestinations.find(d => d.id === destId);
      if (found) {
        const cType = determineDestinationContentType(found.platformId, post, destId);
        const captionPayload = formatPlatformCaption(found.platformId, {
          title: post.platformOverrides?.[found.platformId]?.title || post.title,
          caption: post.platformOverrides?.[found.platformId]?.caption || post.caption,
          description: post.platformOverrides?.[found.platformId]?.description || post.description,
          hashtags: post.platformOverrides?.[found.platformId]?.hashtags || post.hashtags,
          tags: post.platformOverrides?.[found.platformId]?.tags,
          hook: post.platformOverrides?.[found.platformId]?.hook,
          callToAction: post.platformOverrides?.[found.platformId]?.callToAction || post.callToAction
        });

        // Determine existing status from post
        const currentPostStatus = post.platformStatuses?.[destId]?.status;
        const initialStatus: ShareDestinationStatus = 
          currentPostStatus === 'COMPLETED' || currentPostStatus === 'SHARED'
            ? 'Completed'
            : currentPostStatus === 'SKIPPED'
            ? 'Skipped'
            : 'Ready';

        list.push({
          id: found.id,
          platformId: found.platformId,
          name: found.name,
          accountName: found.name,
          accountIdentifier: found.identifier || found.secondaryInfo,
          url: found.url,
          contentType: cType,
          status: initialStatus,
          statusNote: post.platformStatuses?.[destId]?.note || 'Ready to share',
          captionPayload
        });
      }
    }
  }

  // 2. Also ensure every selected platform has at least its configured destinations or fallback
  for (const pId of post.selectedPlatforms) {
    const platformDests = getDestinationsForPlatform(pId, normalized);
    const platformConfig = PLATFORMS[pId] || PLATFORMS.facebook_page;

    if (platformDests.length > 0) {
      for (const dest of platformDests) {
        if (!processedIds.has(dest.id)) {
          processedIds.add(dest.id);
          const cType = determineDestinationContentType(dest.platformId, post, dest.id);
          const captionPayload = formatPlatformCaption(dest.platformId, {
            title: post.platformOverrides?.[dest.platformId]?.title || post.title,
            caption: post.platformOverrides?.[dest.platformId]?.caption || post.caption,
            description: post.platformOverrides?.[dest.platformId]?.description || post.description,
            hashtags: post.platformOverrides?.[dest.platformId]?.hashtags || post.hashtags,
            tags: post.platformOverrides?.[dest.platformId]?.tags,
            hook: post.platformOverrides?.[dest.platformId]?.hook,
            callToAction: post.platformOverrides?.[dest.platformId]?.callToAction || post.callToAction
          });

          const currentPostStatus = post.platformStatuses?.[dest.id]?.status || post.platformStatuses?.[pId]?.status;
          const initialStatus: ShareDestinationStatus = 
            currentPostStatus === 'COMPLETED' || currentPostStatus === 'SHARED'
              ? 'Completed'
              : currentPostStatus === 'SKIPPED'
              ? 'Skipped'
              : 'Ready';

          list.push({
            id: dest.id,
            platformId: dest.platformId,
            name: dest.name,
            accountName: dest.name,
            accountIdentifier: dest.identifier || dest.secondaryInfo,
            url: dest.url,
            contentType: cType,
            status: initialStatus,
            statusNote: post.platformStatuses?.[dest.id]?.note || 'Ready to share',
            captionPayload
          });
        }
      }
    } else {
      // No custom account added yet; use platform composer
      if (!processedIds.has(pId)) {
        processedIds.add(pId);
        const cType = determineDestinationContentType(pId, post, pId);
        const captionPayload = formatPlatformCaption(pId, {
          title: post.platformOverrides?.[pId]?.title || post.title,
          caption: post.platformOverrides?.[pId]?.caption || post.caption,
          description: post.platformOverrides?.[pId]?.description || post.description,
          hashtags: post.platformOverrides?.[pId]?.hashtags || post.hashtags,
          tags: post.platformOverrides?.[pId]?.tags,
          hook: post.platformOverrides?.[pId]?.hook,
          callToAction: post.platformOverrides?.[pId]?.callToAction || post.callToAction
        });

        const currentPostStatus = post.platformStatuses?.[pId]?.status;
        const initialStatus: ShareDestinationStatus = 
          currentPostStatus === 'COMPLETED' || currentPostStatus === 'SHARED'
            ? 'Completed'
            : currentPostStatus === 'SKIPPED'
            ? 'Skipped'
            : 'Ready';

        list.push({
          id: pId,
          platformId: pId,
          name: platformConfig.name,
          accountName: platformConfig.name,
          accountIdentifier: 'Default App / Composer',
          url: platformConfig.playStoreUrl,
          contentType: cType,
          status: initialStatus,
          statusNote: post.platformStatuses?.[pId]?.note || 'Ready to share',
          captionPayload
        });
      }
    }
  }

  // 3. Sort by recommended order (Facebook Page -> Facebook Profile -> Instagram -> TikTok -> YouTube -> X -> WhatsApp)
  return list.sort((a, b) => {
    const orderA = getRecommendedPlatformOrder(a.platformId);
    const orderB = getRecommendedPlatformOrder(b.platformId);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Creates a new Share Session and saves to localStorage
 */
export function createShareSession(
  post: SocialPost,
  userAccounts?: UserSocialAccounts,
  options?: { isFromDraft?: boolean; groupName?: string }
): ShareSession {
  const destinations = buildShareSessionDestinations(post, userAccounts);
  const now = new Date().toISOString();

  // Find first non-completed destination
  const firstIncompleteIdx = destinations.findIndex(
    d => d.status !== 'Completed' && d.status !== 'Skipped'
  );

  const session: ShareSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    postId: post.id,
    post,
    startedAt: now,
    updatedAt: now,
    currentDestinationIndex: firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0,
    destinations,
    isComplete: destinations.length > 0 && destinations.every(d => d.status === 'Completed' || d.status === 'Skipped'),
    isPaused: false,
    isFromDraft: options?.isFromDraft || post.isDraft || false,
    groupId: post.selectedGroupId || null,
    groupName: options?.groupName || null
  };

  saveActiveShareSession(session);
  return session;
}

/**
 * Persist active share session to localStorage
 */
export function saveActiveShareSession(session: ShareSession | null): void {
  try {
    if (session) {
      localStorage.setItem(ACTIVE_SHARE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ACTIVE_SHARE_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to persist share session in localStorage:', e);
  }
}

/**
 * Retrieve active share session from localStorage
 */
export function getActiveShareSession(): ShareSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SHARE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse share session from localStorage:', e);
    return null;
  }
}

/**
 * Clear active share session
 */
export function clearActiveShareSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SHARE_SESSION_STORAGE_KEY);
  } catch {}
}

/**
 * Constructs the platform-tailored caption payload
 */
export function formatPlatformCaption(
  platformId: PlatformId,
  content: {
    title?: string;
    caption?: string;
    description?: string;
    hashtags?: string[];
    tags?: string[];
    hook?: string;
    callToAction?: string;
    opening?: string;
  }
): string {
  const hashtags = content.hashtags || [];
  const tagsStr = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';
  const mainCaption = (content.caption || '').trim();
  const mainTitle = (content.title || '').trim();
  const mainDesc = (content.description || '').trim();

  switch (platformId) {
    case 'whatsapp': {
      // WhatsApp supports *bold* styling for headings + CTA
      let message = mainCaption || mainDesc;
      if (mainTitle) {
        message = `*${mainTitle}*\n\n${message}`;
      }
      if (content.callToAction) {
        message += `\n\n${content.callToAction}`;
      }
      return `${message}${tagsStr}`.trim();
    }

    case 'youtube': {
      // YouTube video: Title, Description, Hashtags, and Tags
      const parts: string[] = [];
      if (mainTitle) parts.push(`Title:\n${mainTitle}`);
      if (mainDesc || mainCaption) parts.push(`Description:\n${mainDesc || mainCaption}`);
      if (hashtags.length > 0) parts.push(`Hashtags:\n${hashtags.join(' ')}`);
      if (content.tags && content.tags.length > 0) parts.push(`Tags:\n${content.tags.join(', ')}`);
      return parts.join('\n\n').trim();
    }

    case 'twitter': {
      // X limit 280 characters
      let text = `${mainCaption || mainTitle}${tagsStr}`.trim();
      if (text.length > 280) {
        text = text.slice(0, 277) + '...';
      }
      return text;
    }

    case 'facebook_page': {
      let text = '';
      if (content.opening) text += `${content.opening}\n\n`;
      else if (mainTitle) text += `${mainTitle}\n\n`;
      text += mainCaption || mainDesc;
      if (content.callToAction) text += `\n\n${content.callToAction}`;
      text += tagsStr;
      return text.trim();
    }

    case 'facebook_profile':
    case 'facebook': {
      let text = '';
      if (content.opening) text += `${content.opening}\n\n`;
      text += mainCaption || mainDesc;
      if (content.callToAction) text += `\n\n${content.callToAction}`;
      text += tagsStr;
      return text.trim();
    }

    case 'tiktok': {
      let text = '';
      if (content.hook) text += `${content.hook}\n\n`;
      text += mainCaption;
      text += tagsStr;
      return text.trim();
    }

    case 'instagram':
    default:
      return `${mainCaption}${tagsStr}`.trim();
  }
}

/**
 * Copies text into system clipboard with robust fallback for iframe sandboxes and native platforms
 */
export async function copyCaptionToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  return nativeBridge.copyToClipboard(text);
}

/**
 * Check if Web Share API is available on this browser/Android device
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Triggers native Android / Web Share Dialog (if supported on mobile)
 */
export async function triggerWebShare(
  platformOrOptions: PlatformId | { title?: string; text?: string; media?: MediaItem | null; url?: string },
  content?: {
    title?: string;
    caption?: string;
    description?: string;
    hashtags: string[];
    media?: MediaItem | null;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isWebShareSupported()) {
    return { success: false, error: 'Web Share API not supported in this browser' };
  }

  let shareTitle = '';
  let shareText = '';
  let shareUrl = '';

  if (typeof platformOrOptions === 'object') {
    shareTitle = platformOrOptions.title || 'Social Share';
    shareText = platformOrOptions.text || '';
    if (platformOrOptions.url) {
      shareUrl = platformOrOptions.url;
    } else if (platformOrOptions.media?.url && platformOrOptions.media.url.startsWith('http')) {
      shareUrl = platformOrOptions.media.url;
    }
  } else {
    const platform = PLATFORMS[platformOrOptions] || PLATFORMS.facebook_page;
    shareTitle = content?.title || `${platform.name} Post`;
    shareText = formatPlatformCaption(platformOrOptions, content || { hashtags: [] });
    if (content?.media?.url && content.media.url.startsWith('http')) {
      shareUrl = content.media.url;
    }
  }

  const shareData: ShareData = {
    title: shareTitle,
    text: shareText
  };
  if (shareUrl) {
    shareData.url = shareUrl;
  }

  try {
    await navigator.share(shareData);
    return { success: true };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Share cancelled' };
    }
    return { success: false, error: err.message || 'Share failed' };
  }
}

/**
 * Opens platform in App (via deep link) or Web Composer,
 * prioritizing the specific selected destination account or saved user accounts.
 */
export function openPlatformComposer(
  platformId: PlatformId,
  content: {
    title?: string;
    caption?: string;
    description?: string;
    hashtags: string[];
    media?: MediaItem | null;
  },
  userAccounts?: UserSocialAccounts,
  targetDestination?: SocialAccountDestination | null
): { opened: boolean; url: string } {
  const platform = PLATFORMS[platformId] || PLATFORMS.facebook_page;
  const textPayload = formatPlatformCaption(platformId, content);

  let targetUrl = '';

  // 1. If a specific destination account was provided, use its tailored URL/identifier
  if (targetDestination) {
    if (targetDestination.platformId === 'whatsapp') {
      const cleanPhone = targetDestination.identifier?.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textPayload)}`;
      } else if (targetDestination.url) {
        targetUrl = sanitizeUrl(targetDestination.url);
      }
    } else if (targetDestination.url) {
      targetUrl = sanitizeUrl(targetDestination.url);
    }
  }

  // 2. Otherwise fall back to the first configured account for this platform in userAccounts
  if (!targetUrl && userAccounts) {
    const destinations = getDestinationsForPlatform(platformId, userAccounts);
    if (destinations.length > 0) {
      const first = destinations[0];
      if (platformId === 'whatsapp') {
        const cleanPhone = first.identifier?.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          targetUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textPayload)}`;
        } else if (first.url) {
          targetUrl = sanitizeUrl(first.url);
        }
      } else if (first.url) {
        targetUrl = sanitizeUrl(first.url);
      }
    }
  }

  // 3. Fall back to standard web share or Play Store link
  if (!targetUrl) {
    if (platform.webShareUrl) {
      targetUrl = platform.webShareUrl(textPayload, content.media?.url);
    } else {
      targetUrl = platform.playStoreUrl;
    }
  }

  // Open composer in a new window/tab
  const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
  return {
    opened: !!win,
    url: targetUrl
  };
}

/**
 * Standard 1-Tap Manual Cross-Posting Workflow:
 * 1. Copies custom caption & hashtags to clipboard so user can immediately paste
 * 2. Launches the target app composer or configured page
 */
export async function triggerManualPlatformShare(
  platformId: PlatformId,
  content: {
    title?: string;
    caption?: string;
    description?: string;
    hashtags: string[];
    media?: MediaItem | null;
  },
  userAccounts?: UserSocialAccounts,
  targetDestination?: SocialAccountDestination | null
): Promise<ManualShareResult> {
  const platform = PLATFORMS[platformId] || PLATFORMS.facebook_page;
  const textPayload = formatPlatformCaption(platformId, content);

  // Step 1: Copy to clipboard
  const copied = await copyCaptionToClipboard(textPayload);

  // Step 2: Open target platform composer or specific destination account page
  const { opened, url } = openPlatformComposer(platformId, content, userAccounts, targetDestination);

  const destinationLabel = targetDestination?.name || platform.name;

  return {
    success: copied || opened,
    copied,
    opened,
    sharedViaWebShare: false,
    message: copied
      ? `Caption copied to clipboard! Opening ${destinationLabel}...`
      : `Opening ${destinationLabel}...`
  };
}
