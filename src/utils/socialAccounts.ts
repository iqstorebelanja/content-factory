import { 
  PlatformId, 
  UserSocialAccounts, 
  SocialAccountDestination,
  AccountConnectionStatus,
  SocialGroup,
  FacebookPageAccount,
  FacebookProfileAccount,
  InstagramAccount,
  TikTokAccount,
  YouTubeChannelAccount,
  TwitterAccount,
  ThreadsAccount
} from '../types';

export const PLATFORM_URL_PLACEHOLDERS: Record<PlatformId, string> = {
  facebook_page: 'https://facebook.com/jhon.doe',
  facebook_profile: 'https://facebook.com/jhon.doe',
  facebook: 'https://facebook.com/jhon.doe',
  instagram: 'https://instagram.com/jhon.doe',
  tiktok: 'https://tiktok.com/@jhon.doe',
  youtube: 'https://youtube.com/@jhon.doe',
  twitter: 'https://x.com/jhon.doe',
  threads: 'https://threads.com/@jhon.doe'
};

export function getPlatformUrlPlaceholder(platformId: PlatformId): string {
  return PLATFORM_URL_PLACEHOLDERS[platformId] || 'https://facebook.com/jhon.doe';
}

const KNOWN_SAMPLE_URLS = new Set([
  'https://facebook.com/your-page',
  'https://www.facebook.com/your-page',
  'https://facebook.com/your-profile',
  'https://www.facebook.com/your-profile',
  'https://instagram.com/your-account',
  'https://www.instagram.com/your-account',
  'https://tiktok.com/@your-account',
  'https://www.tiktok.com/@your-account',
  'https://youtube.com/@your-channel',
  'https://www.youtube.com/@your-channel',
  'https://x.com/your-account',
  'https://www.x.com/your-account',
  'https://twitter.com/your-account',
  'https://threads.com/@your-account',
  'https://www.threads.com/@your-account',
  'https://threads.net/@your-account',
  'https://www.threads.net/@your-account',
  'https://wa.me/6281234567890',
  'https://wa.me/your-number'
]);

export function isSamplePlaceholderUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase().replace(/\/+$/, '');
  return KNOWN_SAMPLE_URLS.has(normalized);
}

/**
 * Editable Example / Sample accounts.
 * URLs are empty strings so the UI displays platform-specific placeholder text
 * rather than locked hardcoded URL values.
 */
export const SAMPLE_DEMO_ACCOUNTS: UserSocialAccounts = {
  facebook_page: [
    {
      id: 'fb-page-1',
      pageName: 'Example Facebook Page',
      pageId: '',
      pageUrl: '',
      notes: 'Example destination — enter your Facebook Page URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  facebook_profile: [
    {
      id: 'fb-prof-1',
      profileName: 'Example Facebook Profile',
      profileId: '',
      profileUrl: '',
      notes: 'Example destination — enter your Facebook Profile URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  instagram: [
    {
      id: 'ig-acc-1',
      displayName: 'Example Instagram Account',
      username: '',
      profileUrl: '',
      notes: 'Example destination — enter your Instagram URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  tiktok: [
    {
      id: 'tt-acc-1',
      displayName: 'Example TikTok Account',
      username: '',
      profileUrl: '',
      notes: 'Example destination — enter your TikTok URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  youtube: [
    {
      id: 'yt-channel-1',
      channelName: 'Example YouTube Channel',
      channelId: '',
      channelUrl: '',
      notes: 'Example destination — enter your YouTube Channel URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  twitter: [
    {
      id: 'x-acc-1',
      displayName: 'Example X Account',
      username: '',
      profileUrl: '',
      notes: 'Example destination — enter your X Account URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ],
  threads: [
    {
      id: 'th-acc-1',
      displayName: 'Example Threads Account',
      username: '',
      profileUrl: '',
      notes: 'Example destination — enter your Threads Account URL below',
      enabled: true,
      connectionStatus: 'Ready for Manual Share',
      isExamplePlaceholder: true
    }
  ]
};

/**
 * Preserves existing user accounts and sample accounts without deleting them.
 * If storage was previously emptied unintentionally, restores SAMPLE_DEMO_ACCOUNTS unless user explicitly cleared all.
 */
export function migrateLegacyDeveloperAccounts(raw: any): {
  accounts: UserSocialAccounts;
  migratedLegacyCount: number;
} {
  const normalized = normalizeUserAccounts(raw);
  const total =
    normalized.facebook_page.length +
    normalized.facebook_profile.length +
    normalized.instagram.length +
    normalized.tiktok.length +
    normalized.youtube.length +
    normalized.twitter.length +
    normalized.threads.length;

  const userExplicitlyCleared =
    typeof window !== 'undefined' && localStorage.getItem('sss_accounts_cleared_by_user') === 'true';

  if (total === 0 && !userExplicitlyCleared) {
    return { accounts: normalizeUserAccounts(SAMPLE_DEMO_ACCOUNTS), migratedLegacyCount: 1 };
  }

  // Ensure Threads has the sample card if migrating from older storage that didn't have threads yet
  if (normalized.threads.length === 0 && !userExplicitlyCleared) {
    normalized.threads = [...SAMPLE_DEMO_ACCOUNTS.threads];
  }

  return { accounts: normalized, migratedLegacyCount: 0 };
}

const PREDEFINED_GROUP_IDS = new Set([
  'group-main-brand',
  'group-persib',
  'group-jangari',
  'group-ngabloe',
  'group-football',
  'group-news',
  'group-personal',
  'group-business',
  'group-adventure',
  'grp-persib',
  'grp-jangari',
  'grp-ngabloe',
  'grp-main',
  'default-group-1',
  'default-group-2',
  'default-group-3'
]);

const PREDEFINED_GROUP_NAMES = new Set([
  'persib',
  'jangari',
  'ngabloe',
  'football',
  'news',
  'personal',
  'business',
  'adventure',
  'main brand'
]);

export function migrateLegacyDeveloperGroups(rawGroups: any): {
  groups: SocialGroup[];
  migratedLegacyCount: number;
} {
  if (!Array.isArray(rawGroups)) {
    return { groups: [], migratedLegacyCount: 0 };
  }

  let migratedCount = 0;
  const validGroups = rawGroups
    .filter((g: any) => {
      if (!g || typeof g !== 'object') return false;
      const idStr = String(g.id || '').trim().toLowerCase();
      const nameStr = String(g.name || '').trim().toLowerCase();
      const isBuiltInSample =
        g.isExamplePlaceholder === true ||
        g.createdAt === '2026-01-01T00:00:00.000Z' ||
        PREDEFINED_GROUP_IDS.has(idStr) ||
        (!g.isUserCreated && PREDEFINED_GROUP_NAMES.has(nameStr));

      if (isBuiltInSample) {
        migratedCount++;
        return false;
      }
      return true;
    })
    .map((g: any) => ({
      ...g,
      platforms: Array.isArray(g.platforms)
        ? g.platforms.map((p: string) => (p === 'whatsapp' ? 'threads' : p))
        : [],
      accountIds: Array.isArray(g.accountIds)
        ? g.accountIds.map((id: string) => (id === 'wa-acc-1' ? 'th-acc-1' : id))
        : [],
      destinationIds: Array.isArray(g.destinationIds)
        ? g.destinationIds.map((id: string) => (id === 'wa-acc-1' ? 'th-acc-1' : id))
        : Array.isArray(g.accountIds)
        ? g.accountIds.map((id: string) => (id === 'wa-acc-1' ? 'th-acc-1' : id))
        : []
    }));

  return {
    groups: validGroups,
    migratedLegacyCount: migratedCount
  };
}

/**
 * Generates a unique, collision-free identifier for any account
 */
export function generateAccountId(prefix: string = 'acc'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Ensures any web address has an https:// scheme without modifying a valid user URL unnecessarily
 */
export function sanitizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extracts a clean handle/username or identifier from a social URL when possible
 */
export function extractHandleFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const clean = sanitizeUrl(url);
    const parsed = new URL(clean);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = decodeURIComponent(parts[parts.length - 1]).replace(/^@/, '');
      if (last && !['profile.php', 'pages', 'channel', 'c', 'user', 'results'].includes(last.toLowerCase())) {
        return last;
      }
    }
  } catch {}
  return '';
}

/**
 * Validates URL format appropriate for the selected platform without requiring any API connection.
 * Supports Threads (threads.com and threads.net) as well as all other supported platforms.
 */
export function validatePlatformUrl(
  platformId: PlatformId,
  rawUrl?: string,
  fallbackIdentifier?: string
): { valid: boolean; sanitizedUrl: string; error?: string } {
  const trimmedUrl = (rawUrl || '').trim();
  const trimmedId = (fallbackIdentifier || '').trim();

  if (!trimmedUrl && !trimmedId) {
    return {
      valid: false,
      sanitizedUrl: '',
      error: `Please enter a valid Account URL (e.g. ${getPlatformUrlPlaceholder(platformId)}).`
    };
  }

  // If user only entered a handle in the identifier field or URL field without domain, build URL if appropriate
  if (!trimmedUrl && trimmedId) {
    const cleanHandle = trimmedId.replace(/^@/, '');
    switch (platformId) {
      case 'facebook_page':
      case 'facebook_profile':
      case 'facebook':
        return { valid: true, sanitizedUrl: `https://facebook.com/${encodeURIComponent(cleanHandle)}` };
      case 'instagram':
        return { valid: true, sanitizedUrl: `https://instagram.com/${encodeURIComponent(cleanHandle)}` };
      case 'tiktok':
        return { valid: true, sanitizedUrl: `https://tiktok.com/@${encodeURIComponent(cleanHandle)}` };
      case 'youtube':
        return { valid: true, sanitizedUrl: `https://youtube.com/@${encodeURIComponent(cleanHandle)}` };
      case 'twitter':
        return { valid: true, sanitizedUrl: `https://x.com/${encodeURIComponent(cleanHandle)}` };
      case 'threads':
        return { valid: true, sanitizedUrl: `https://www.threads.com/@${encodeURIComponent(cleanHandle)}` };
    }
  }

  // If user typed a handle like @jhon.doe directly into the URL field
  if (trimmedUrl && !trimmedUrl.includes('.') && !trimmedUrl.includes('/')) {
    const cleanHandle = trimmedUrl.replace(/^@/, '');
    if (cleanHandle) {
      switch (platformId) {
        case 'facebook_page':
        case 'facebook_profile':
        case 'facebook':
          return { valid: true, sanitizedUrl: `https://facebook.com/${encodeURIComponent(cleanHandle)}` };
        case 'instagram':
          return { valid: true, sanitizedUrl: `https://instagram.com/${encodeURIComponent(cleanHandle)}` };
        case 'tiktok':
          return { valid: true, sanitizedUrl: `https://tiktok.com/@${encodeURIComponent(cleanHandle)}` };
        case 'youtube':
          return { valid: true, sanitizedUrl: `https://youtube.com/@${encodeURIComponent(cleanHandle)}` };
        case 'twitter':
          return { valid: true, sanitizedUrl: `https://x.com/${encodeURIComponent(cleanHandle)}` };
        case 'threads':
          return { valid: true, sanitizedUrl: `https://www.threads.com/@${encodeURIComponent(cleanHandle)}` };
      }
    }
  }

  const candidate = sanitizeUrl(trimmedUrl);
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        sanitizedUrl: '',
        error: `Please enter a valid web URL (for example: ${getPlatformUrlPlaceholder(platformId)}).`
      };
    }
    return { valid: true, sanitizedUrl: candidate };
  } catch {
    return {
      valid: false,
      sanitizedUrl: '',
      error: `Invalid URL format. Please enter a complete URL (e.g. ${getPlatformUrlPlaceholder(platformId)}).`
    };
  }
}

function resolveConnectionStatus(
  rawStatus: any,
  hasUrl: boolean
): AccountConnectionStatus {
  // Never display fake API CONNECTED status for manually configured accounts
  if (rawStatus === 'Not Connected') {
    return 'Not Connected';
  }
  return 'Ready for Manual Share';
}

/**
 * Normalizes and migrates any previously saved accounts format into the multi-account array structure.
 * Strips locked sample URLs so sample cards use placeholder text until edited by the user.
 */
export function normalizeUserAccounts(raw: any): UserSocialAccounts {
  const result: UserSocialAccounts = {
    facebook_page: [],
    facebook_profile: [],
    instagram: [],
    tiktok: [],
    youtube: [],
    twitter: [],
    threads: []
  };

  if (!raw || typeof raw !== 'object') {
    return result;
  }

  // 1. Facebook Pages
  if (Array.isArray(raw.facebook_page)) {
    result.facebook_page = raw.facebook_page
      .filter((item: any) => item && (item.pageName || item.pageUrl || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUrl = sanitizeUrl(item.pageUrl);
        const isSample = isSamplePlaceholderUrl(rawUrl);
        const pageUrl = isSample ? '' : rawUrl;
        const pageId = item.pageId && item.pageId !== 'your-page' ? String(item.pageId).trim() : undefined;
        return {
          id: item.id || generateAccountId(`fb_${idx}`),
          pageName: String(item.pageName || 'Facebook Page').trim(),
          pageId,
          pageUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!pageUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !pageUrl)
        };
      });
  } else if (raw.facebook_page && (raw.facebook_page.pageName || raw.facebook_page.pageUrl)) {
    const rawUrl = sanitizeUrl(raw.facebook_page.pageUrl);
    const pageUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.facebook_page = [
      {
        id: raw.facebook_page.id || generateAccountId('fb_migrated'),
        pageName: String(raw.facebook_page.pageName || 'Facebook Page').trim(),
        pageUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.facebook_page.connectionStatus, !!pageUrl)
      }
    ];
  }

  // 1b. Facebook Personal Profiles
  if (Array.isArray(raw.facebook_profile)) {
    result.facebook_profile = raw.facebook_profile
      .filter((item: any) => item && (item.profileName || item.profileUrl || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUrl = sanitizeUrl(item.profileUrl);
        const isSample = isSamplePlaceholderUrl(rawUrl);
        const profileUrl = isSample ? '' : rawUrl;
        const profileId = item.profileId && item.profileId !== 'your-profile' ? String(item.profileId).trim() : undefined;
        return {
          id: item.id || generateAccountId(`fb_prof_${idx}`),
          profileName: String(item.profileName || 'Facebook Profile').trim(),
          profileId,
          profileUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !profileUrl)
        };
      });
  } else if (raw.facebook_profile && (raw.facebook_profile.profileName || raw.facebook_profile.profileUrl)) {
    const rawUrl = sanitizeUrl(raw.facebook_profile.profileUrl);
    const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.facebook_profile = [
      {
        id: raw.facebook_profile.id || generateAccountId('fb_prof_migrated'),
        profileName: String(raw.facebook_profile.profileName || 'Facebook Profile').trim(),
        profileUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.facebook_profile.connectionStatus, !!profileUrl)
      }
    ];
  } else if (Array.isArray(raw.facebook)) {
    result.facebook_profile = raw.facebook
      .filter((item: any) => item && (item.profileName || item.profileUrl || item.name || item.url))
      .map((item: any, idx: number) => {
        const rawUrl = sanitizeUrl(item.profileUrl || item.url);
        const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
        return {
          id: item.id || generateAccountId(`fb_prof_${idx}`),
          profileName: String(item.profileName || item.name || 'Facebook Profile').trim(),
          profileUrl,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl)
        };
      });
  }

  // 2. Instagram
  if (Array.isArray(raw.instagram)) {
    result.instagram = raw.instagram
      .filter((item: any) => item && (item.username || item.profileUrl || item.displayName || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUsername = String(item.username || '').replace(/^@/, '').trim();
        const username = rawUsername === 'your-account' ? '' : rawUsername;
        const rawUrl = sanitizeUrl(item.profileUrl);
        const profileUrl = isSamplePlaceholderUrl(rawUrl)
          ? ''
          : rawUrl || (username ? `https://instagram.com/${username}` : '');
        return {
          id: item.id || generateAccountId(`ig_${idx}`),
          displayName: item.displayName ? String(item.displayName).trim() : 'Instagram Account',
          username,
          profileUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !profileUrl)
        };
      });
  } else if (raw.instagram && (raw.instagram.username || raw.instagram.profileUrl)) {
    const rawUsername = String(raw.instagram.username || '').replace(/^@/, '').trim();
    const username = rawUsername === 'your-account' ? '' : rawUsername;
    const rawUrl = sanitizeUrl(raw.instagram.profileUrl);
    const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.instagram = [
      {
        id: raw.instagram.id || generateAccountId('ig_migrated'),
        displayName: 'Instagram Account',
        username,
        profileUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.instagram.connectionStatus, !!profileUrl)
      }
    ];
  }

  // 3. TikTok
  if (Array.isArray(raw.tiktok)) {
    result.tiktok = raw.tiktok
      .filter((item: any) => item && (item.username || item.profileUrl || item.displayName || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUsername = String(item.username || '').replace(/^@/, '').trim();
        const username = rawUsername === 'your-account' ? '' : rawUsername;
        const rawUrl = sanitizeUrl(item.profileUrl);
        const profileUrl = isSamplePlaceholderUrl(rawUrl)
          ? ''
          : rawUrl || (username ? `https://tiktok.com/@${username}` : '');
        return {
          id: item.id || generateAccountId(`tt_${idx}`),
          displayName: item.displayName ? String(item.displayName).trim() : 'TikTok Account',
          username,
          profileUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !profileUrl)
        };
      });
  } else if (raw.tiktok && (raw.tiktok.username || raw.tiktok.profileUrl)) {
    const rawUsername = String(raw.tiktok.username || '').replace(/^@/, '').trim();
    const username = rawUsername === 'your-account' ? '' : rawUsername;
    const rawUrl = sanitizeUrl(raw.tiktok.profileUrl);
    const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.tiktok = [
      {
        id: raw.tiktok.id || generateAccountId('tt_migrated'),
        displayName: 'TikTok Account',
        username,
        profileUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.tiktok.connectionStatus, !!profileUrl)
      }
    ];
  }

  // 4. YouTube
  if (Array.isArray(raw.youtube)) {
    result.youtube = raw.youtube
      .filter((item: any) => item && (item.channelName || item.channelUrl || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUrl = sanitizeUrl(item.channelUrl);
        const channelUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
        const rawChannelId = item.channelId ? String(item.channelId).trim() : '';
        const channelId = rawChannelId === '@your-channel' || rawChannelId === 'your-channel' ? undefined : (rawChannelId || undefined);
        return {
          id: item.id || generateAccountId(`yt_${idx}`),
          channelName: String(item.channelName || 'YouTube Channel').trim(),
          channelId,
          channelUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!channelUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !channelUrl)
        };
      });
  } else if (raw.youtube && (raw.youtube.channelName || raw.youtube.channelUrl)) {
    const rawUrl = sanitizeUrl(raw.youtube.channelUrl);
    const channelUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.youtube = [
      {
        id: raw.youtube.id || generateAccountId('yt_migrated'),
        channelName: String(raw.youtube.channelName || 'YouTube Channel').trim(),
        channelUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.youtube.connectionStatus, !!channelUrl)
      }
    ];
  }

  // 5. Twitter / X
  if (Array.isArray(raw.twitter)) {
    result.twitter = raw.twitter
      .filter((item: any) => item && (item.username || item.profileUrl || item.displayName || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUsername = String(item.username || '').replace(/^@/, '').trim();
        const username = rawUsername === 'your-account' ? '' : rawUsername;
        const rawUrl = sanitizeUrl(item.profileUrl);
        const profileUrl = isSamplePlaceholderUrl(rawUrl)
          ? ''
          : rawUrl || (username ? `https://x.com/${username}` : '');
        return {
          id: item.id || generateAccountId(`x_${idx}`),
          displayName: item.displayName ? String(item.displayName).trim() : 'X Account',
          username,
          profileUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !profileUrl)
        };
      });
  } else if (raw.twitter && (raw.twitter.username || raw.twitter.profileUrl)) {
    const rawUsername = String(raw.twitter.username || '').replace(/^@/, '').trim();
    const username = rawUsername === 'your-account' ? '' : rawUsername;
    const rawUrl = sanitizeUrl(raw.twitter.profileUrl);
    const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.twitter = [
      {
        id: raw.twitter.id || generateAccountId('x_migrated'),
        displayName: 'X Account',
        username,
        profileUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.twitter.connectionStatus, !!profileUrl)
      }
    ];
  }

  // 6. Threads
  if (Array.isArray(raw.threads)) {
    result.threads = raw.threads
      .filter((item: any) => item && (item.username || item.profileUrl || item.displayName || item.isExamplePlaceholder))
      .map((item: any, idx: number) => {
        const rawUsername = String(item.username || '').replace(/^@/, '').trim();
        const username = rawUsername === 'your-account' ? '' : rawUsername;
        const rawUrl = sanitizeUrl(item.profileUrl);
        const profileUrl = isSamplePlaceholderUrl(rawUrl)
          ? ''
          : rawUrl || (username ? `https://www.threads.com/@${username}` : '');
        return {
          id: item.id || generateAccountId(`th_${idx}`),
          displayName: item.displayName ? String(item.displayName).trim() : 'Threads Account',
          username,
          profileUrl,
          notes: item.notes ? String(item.notes).trim() : undefined,
          enabled: item.enabled !== false,
          connectionStatus: resolveConnectionStatus(item.connectionStatus, !!profileUrl),
          isExamplePlaceholder: Boolean(item.isExamplePlaceholder && !profileUrl)
        };
      });
  } else if (raw.threads && (raw.threads.username || raw.threads.profileUrl)) {
    const rawUsername = String(raw.threads.username || '').replace(/^@/, '').trim();
    const username = rawUsername === 'your-account' ? '' : rawUsername;
    const rawUrl = sanitizeUrl(raw.threads.profileUrl);
    const profileUrl = isSamplePlaceholderUrl(rawUrl) ? '' : rawUrl;
    result.threads = [
      {
        id: raw.threads.id || generateAccountId('th_migrated'),
        displayName: 'Threads Account',
        username,
        profileUrl,
        enabled: true,
        connectionStatus: resolveConnectionStatus(raw.threads.connectionStatus, !!profileUrl)
      }
    ];
  }

  return result;
}

/**
 * Returns all configured accounts for a given platform as unified destinations.
 * By default returns enabled accounts; pass `includeDisabled = true` to include disabled accounts in management views.
 */
export function getDestinationsForPlatform(
  platformId: PlatformId,
  accounts: UserSocialAccounts,
  options?: { includeDisabled?: boolean }
): SocialAccountDestination[] {
  if (!accounts) return [];
  const normalized = normalizeUserAccounts(accounts);
  const includeDisabled = options?.includeDisabled ?? false;

  switch (platformId) {
    case 'facebook_page':
      return (normalized.facebook_page || [])
        .filter(p => (includeDisabled || p.enabled !== false) && !!(p.pageName?.trim() || p.pageUrl?.trim()))
        .map(p => ({
          id: p.id,
          platformId: 'facebook_page' as PlatformId,
          name: p.pageName?.trim() || 'Facebook Page',
          identifier: p.pageId?.trim() || extractHandleFromUrl(p.pageUrl),
          url: p.pageUrl?.trim() || undefined,
          secondaryInfo: p.pageUrl?.trim() || getPlatformUrlPlaceholder('facebook_page'),
          notes: p.notes,
          enabled: p.enabled !== false,
          connectionStatus: 'Ready for Manual Share',
          isExamplePlaceholder: p.isExamplePlaceholder,
          isConfigured: true
        }));

    case 'facebook_profile':
    case 'facebook':
      return (normalized.facebook_profile || [])
        .filter(p => (includeDisabled || p.enabled !== false) && !!(p.profileName?.trim() || p.profileUrl?.trim()))
        .map(p => ({
          id: p.id,
          platformId: 'facebook_profile' as PlatformId,
          name: p.profileName?.trim() || 'Facebook Profile',
          identifier: p.profileId?.trim() || extractHandleFromUrl(p.profileUrl),
          url: p.profileUrl?.trim() || undefined,
          secondaryInfo: p.profileUrl?.trim() || getPlatformUrlPlaceholder('facebook_profile'),
          notes: p.notes,
          enabled: p.enabled !== false,
          connectionStatus: 'Ready for Manual Share',
          isExamplePlaceholder: p.isExamplePlaceholder,
          isConfigured: true
        }));

    case 'instagram':
      return (normalized.instagram || [])
        .filter(a => (includeDisabled || a.enabled !== false) && !!(a.username?.trim() || a.profileUrl?.trim() || a.displayName?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          const label = a.displayName?.trim()
            ? (cleanUser ? `${a.displayName.trim()} (@${cleanUser})` : a.displayName.trim())
            : (cleanUser ? `@${cleanUser}` : 'Instagram Account');
          return {
            id: a.id,
            platformId: 'instagram' as PlatformId,
            name: label,
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://instagram.com/${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || getPlatformUrlPlaceholder('instagram'),
            notes: a.notes,
            enabled: a.enabled !== false,
            connectionStatus: 'Ready for Manual Share',
            isExamplePlaceholder: a.isExamplePlaceholder,
            isConfigured: true
          };
        });

    case 'tiktok':
      return (normalized.tiktok || [])
        .filter(a => (includeDisabled || a.enabled !== false) && !!(a.username?.trim() || a.profileUrl?.trim() || a.displayName?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          const label = a.displayName?.trim()
            ? (cleanUser ? `${a.displayName.trim()} (@${cleanUser})` : a.displayName.trim())
            : (cleanUser ? `@${cleanUser}` : 'TikTok Account');
          return {
            id: a.id,
            platformId: 'tiktok' as PlatformId,
            name: label,
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://tiktok.com/@${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || getPlatformUrlPlaceholder('tiktok'),
            notes: a.notes,
            enabled: a.enabled !== false,
            connectionStatus: 'Ready for Manual Share',
            isExamplePlaceholder: a.isExamplePlaceholder,
            isConfigured: true
          };
        });

    case 'youtube':
      return (normalized.youtube || [])
        .filter(y => (includeDisabled || y.enabled !== false) && !!(y.channelName?.trim() || y.channelUrl?.trim()))
        .map(y => ({
          id: y.id,
          platformId: 'youtube' as PlatformId,
          name: y.channelName?.trim() || 'YouTube Channel',
          identifier: y.channelId?.trim() || extractHandleFromUrl(y.channelUrl),
          url: y.channelUrl?.trim() || undefined,
          secondaryInfo: y.channelUrl?.trim() || getPlatformUrlPlaceholder('youtube'),
          notes: y.notes,
          enabled: y.enabled !== false,
          connectionStatus: 'Ready for Manual Share',
          isExamplePlaceholder: y.isExamplePlaceholder,
          isConfigured: true
        }));

    case 'twitter':
      return (normalized.twitter || [])
        .filter(a => (includeDisabled || a.enabled !== false) && !!(a.username?.trim() || a.profileUrl?.trim() || a.displayName?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          const label = a.displayName?.trim()
            ? (cleanUser ? `${a.displayName.trim()} (@${cleanUser})` : a.displayName.trim())
            : (cleanUser ? `@${cleanUser}` : 'X Account');
          return {
            id: a.id,
            platformId: 'twitter' as PlatformId,
            name: label,
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://x.com/${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || getPlatformUrlPlaceholder('twitter'),
            notes: a.notes,
            enabled: a.enabled !== false,
            connectionStatus: 'Ready for Manual Share',
            isExamplePlaceholder: a.isExamplePlaceholder,
            isConfigured: true
          };
        });

    case 'threads':
      return (normalized.threads || [])
        .filter(a => (includeDisabled || a.enabled !== false) && !!(a.username?.trim() || a.profileUrl?.trim() || a.displayName?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          const label = a.displayName?.trim()
            ? (cleanUser ? `${a.displayName.trim()} (@${cleanUser})` : a.displayName.trim())
            : (cleanUser ? `@${cleanUser}` : 'Threads Account');
          return {
            id: a.id,
            platformId: 'threads' as PlatformId,
            name: label,
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://www.threads.com/@${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || getPlatformUrlPlaceholder('threads'),
            notes: a.notes,
            enabled: a.enabled !== false,
            connectionStatus: 'Ready for Manual Share',
            isExamplePlaceholder: a.isExamplePlaceholder,
            isConfigured: true
          };
        });

    default:
      return [];
  }
}

/**
 * Returns a flattened array of all configured destinations across all platforms
 */
export function getAllDestinations(accounts: UserSocialAccounts): SocialAccountDestination[] {
  const platforms: PlatformId[] = ['facebook_page', 'facebook_profile', 'instagram', 'tiktok', 'youtube', 'twitter', 'threads'];
  return platforms.flatMap(p => getDestinationsForPlatform(p, accounts));
}

/**
 * Finds a destination by ID across all accounts
 */
export function getDestinationById(id: string, accounts: UserSocialAccounts): SocialAccountDestination | null {
  const all = getAllDestinations(accounts);
  return all.find(d => d.id === id) || null;
}

/**
 * Returns the testable URL for a destination
 */
export function getDestinationTestUrl(destination: SocialAccountDestination): string | null {
  if (destination.url) {
    return sanitizeUrl(destination.url);
  }
  return null;
}

/**
 * Checks if a specific social platform has at least one configured account
 */
export function isPlatformConfigured(platformId: PlatformId, accounts: UserSocialAccounts): boolean {
  if (!accounts) return false;
  const destinations = getDestinationsForPlatform(platformId, accounts);
  return destinations.length > 0;
}

/**
 * Returns count of configured accounts for a platform
 */
export function getPlatformAccountCount(platformId: PlatformId, accounts: UserSocialAccounts): number {
  if (!accounts) return 0;
  return getDestinationsForPlatform(platformId, accounts).length;
}

/**
 * Returns the primary testable destination URL for a given platform (using the first configured account)
 */
export function getPlatformTestUrl(platformId: PlatformId, accounts: UserSocialAccounts): string | null {
  const destinations = getDestinationsForPlatform(platformId, accounts);
  if (destinations.length > 0 && destinations[0].url) {
    return sanitizeUrl(destinations[0].url);
  }
  return null;
}

/**
 * Summary display info for each platform
 */
export function getPlatformAccountDisplay(platformId: PlatformId, accounts: UserSocialAccounts): {
  title: string;
  subtitle: string;
  count: number;
  isConfigured: boolean;
  testUrl: string | null;
} {
  const destinations = getDestinationsForPlatform(platformId, accounts);
  const isConfigured = destinations.length > 0;
  const testUrl = destinations[0]?.url ? sanitizeUrl(destinations[0].url) : null;

  if (!isConfigured) {
    return {
      title: 'Not configured',
      subtitle: 'No accounts added yet',
      count: 0,
      isConfigured: false,
      testUrl: null
    };
  }

  const count = destinations.length;
  const first = destinations[0];

  return {
    title: count === 1 ? first.name : `${first.name} (+${count - 1} more)`,
    subtitle: count === 1 ? (first.url || first.secondaryInfo || '') : `${count} accounts/pages configured`,
    count,
    isConfigured: true,
    testUrl
  };
}
