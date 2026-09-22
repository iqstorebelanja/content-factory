import { 
  PlatformId, 
  UserSocialAccounts, 
  SocialAccountDestination,
  FacebookPageAccount,
  FacebookProfileAccount,
  InstagramAccount,
  TikTokAccount,
  YouTubeChannelAccount,
  TwitterAccount,
  WhatsAppAccount
} from '../types';

export const SAMPLE_DEMO_ACCOUNTS: UserSocialAccounts = {
  facebook_page: [
    {
      id: 'fb-demo-1',
      pageName: 'Jangari Adventure & Fishing',
      pageUrl: 'https://facebook.com/jangarioutdoor'
    },
    {
      id: 'fb-demo-2',
      pageName: 'Komunitas Mancing Nusantara',
      pageUrl: 'https://facebook.com/mancingnusantara'
    }
  ],
  facebook_profile: [
    {
      id: 'fb-prof-demo-1',
      profileName: 'Budi Santoso (Personal)',
      profileUrl: 'https://facebook.com/budi.santoso.angler'
    }
  ],
  instagram: [
    {
      id: 'ig-demo-1',
      username: 'jangari_venture',
      profileUrl: 'https://instagram.com/jangari_venture'
    },
    {
      id: 'ig-demo-2',
      username: 'angler_daily_id',
      profileUrl: 'https://instagram.com/angler_daily_id'
    }
  ],
  tiktok: [
    {
      id: 'tt-demo-1',
      username: 'jangari_official',
      profileUrl: 'https://tiktok.com/@jangari_official'
    }
  ],
  youtube: [
    {
      id: 'yt-demo-1',
      channelName: 'Jangari Fishing TV',
      channelUrl: 'https://youtube.com/@jangarifishing'
    },
    {
      id: 'yt-demo-2',
      channelName: 'Ngabloe Reels & Shorts',
      channelUrl: 'https://youtube.com/@ngabloereels'
    }
  ],
  twitter: [
    {
      id: 'tw-demo-1',
      username: 'jangariview',
      profileUrl: 'https://x.com/jangariview'
    }
  ],
  whatsapp: [
    {
      id: 'wa-demo-1',
      name: 'Admin Pemancingan Jangari',
      phoneNumber: '+6281234567890',
      waLink: 'https://wa.me/6281234567890'
    },
    {
      id: 'wa-demo-2',
      name: 'Reservasi Rakit & Penginapan',
      phoneNumber: '+6281987654321',
      waLink: 'https://wa.me/6281987654321'
    }
  ]
};

/**
 * Generates a unique, collision-free identifier for any account
 */
export function generateAccountId(prefix: string = 'acc'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Ensures any web address has an https:// scheme
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
 * Normalizes and migrates any previously saved accounts format into the multi-account array structure.
 * Guaranteed to preserve existing accounts and generate unique IDs.
 */
export function normalizeUserAccounts(raw: any): UserSocialAccounts {
  const result: UserSocialAccounts = {
    facebook_page: [],
    facebook_profile: [],
    instagram: [],
    tiktok: [],
    youtube: [],
    twitter: [],
    whatsapp: []
  };

  if (!raw || typeof raw !== 'object') {
    return result;
  }

  // 1. Facebook Pages
  if (Array.isArray(raw.facebook_page)) {
    result.facebook_page = raw.facebook_page
      .filter((item: any) => item && (item.pageName || item.pageUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`fb_${idx}`),
        pageName: String(item.pageName || '').trim(),
        pageUrl: sanitizeUrl(item.pageUrl)
      }));
  } else if (raw.facebook_page && (raw.facebook_page.pageName || raw.facebook_page.pageUrl)) {
    result.facebook_page = [
      {
        id: raw.facebook_page.id || generateAccountId('fb_migrated'),
        pageName: String(raw.facebook_page.pageName || '').trim(),
        pageUrl: sanitizeUrl(raw.facebook_page.pageUrl)
      }
    ];
  }

  // 1b. Facebook Personal Profiles
  if (Array.isArray(raw.facebook_profile)) {
    result.facebook_profile = raw.facebook_profile
      .filter((item: any) => item && (item.profileName || item.profileUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`fb_prof_${idx}`),
        profileName: String(item.profileName || '').trim(),
        profileUrl: sanitizeUrl(item.profileUrl)
      }));
  } else if (raw.facebook_profile && (raw.facebook_profile.profileName || raw.facebook_profile.profileUrl)) {
    result.facebook_profile = [
      {
        id: raw.facebook_profile.id || generateAccountId('fb_prof_migrated'),
        profileName: String(raw.facebook_profile.profileName || '').trim(),
        profileUrl: sanitizeUrl(raw.facebook_profile.profileUrl)
      }
    ];
  } else if (Array.isArray(raw.facebook)) {
    // Migration helper if someone previously stored profiles under 'facebook'
    result.facebook_profile = raw.facebook
      .filter((item: any) => item && (item.profileName || item.profileUrl || item.name || item.url))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`fb_prof_${idx}`),
        profileName: String(item.profileName || item.name || '').trim(),
        profileUrl: sanitizeUrl(item.profileUrl || item.url)
      }));
  }

  // 2. Instagram
  if (Array.isArray(raw.instagram)) {
    result.instagram = raw.instagram
      .filter((item: any) => item && (item.username || item.profileUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`ig_${idx}`),
        username: String(item.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(item.profileUrl)
      }));
  } else if (raw.instagram && (raw.instagram.username || raw.instagram.profileUrl)) {
    result.instagram = [
      {
        id: raw.instagram.id || generateAccountId('ig_migrated'),
        username: String(raw.instagram.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(raw.instagram.profileUrl)
      }
    ];
  }

  // 3. TikTok
  if (Array.isArray(raw.tiktok)) {
    result.tiktok = raw.tiktok
      .filter((item: any) => item && (item.username || item.profileUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`tt_${idx}`),
        username: String(item.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(item.profileUrl)
      }));
  } else if (raw.tiktok && (raw.tiktok.username || raw.tiktok.profileUrl)) {
    result.tiktok = [
      {
        id: raw.tiktok.id || generateAccountId('tt_migrated'),
        username: String(raw.tiktok.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(raw.tiktok.profileUrl)
      }
    ];
  }

  // 4. YouTube
  if (Array.isArray(raw.youtube)) {
    result.youtube = raw.youtube
      .filter((item: any) => item && (item.channelName || item.channelUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`yt_${idx}`),
        channelName: String(item.channelName || '').trim(),
        channelUrl: sanitizeUrl(item.channelUrl)
      }));
  } else if (raw.youtube && (raw.youtube.channelName || raw.youtube.channelUrl)) {
    result.youtube = [
      {
        id: raw.youtube.id || generateAccountId('yt_migrated'),
        channelName: String(raw.youtube.channelName || '').trim(),
        channelUrl: sanitizeUrl(raw.youtube.channelUrl)
      }
    ];
  }

  // 5. Twitter / X
  if (Array.isArray(raw.twitter)) {
    result.twitter = raw.twitter
      .filter((item: any) => item && (item.username || item.profileUrl))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`x_${idx}`),
        username: String(item.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(item.profileUrl)
      }));
  } else if (raw.twitter && (raw.twitter.username || raw.twitter.profileUrl)) {
    result.twitter = [
      {
        id: raw.twitter.id || generateAccountId('x_migrated'),
        username: String(raw.twitter.username || '').replace(/^@/, '').trim(),
        profileUrl: sanitizeUrl(raw.twitter.profileUrl)
      }
    ];
  }

  // 6. WhatsApp
  if (Array.isArray(raw.whatsapp)) {
    result.whatsapp = raw.whatsapp
      .filter((item: any) => item && (item.phoneNumber || item.waLink || item.name))
      .map((item: any, idx: number) => ({
        id: item.id || generateAccountId(`wa_${idx}`),
        name: String(item.name || 'WhatsApp Account').trim(),
        phoneNumber: String(item.phoneNumber || '').trim(),
        waLink: sanitizeUrl(item.waLink)
      }));
  } else if (raw.whatsapp && (raw.whatsapp.phoneNumber || raw.whatsapp.waLink)) {
    result.whatsapp = [
      {
        id: raw.whatsapp.id || generateAccountId('wa_migrated'),
        name: 'WhatsApp Account',
        phoneNumber: String(raw.whatsapp.phoneNumber || '').trim(),
        waLink: sanitizeUrl(raw.whatsapp.waLink)
      }
    ];
  }

  return result;
}

/**
 * Returns all configured accounts for a given platform as unified destinations
 */
export function getDestinationsForPlatform(platformId: PlatformId, accounts: UserSocialAccounts): SocialAccountDestination[] {
  if (!accounts) return [];
  const normalized = normalizeUserAccounts(accounts);

  switch (platformId) {
    case 'facebook_page':
      return (normalized.facebook_page || [])
        .filter(p => !!(p.pageName?.trim() || p.pageUrl?.trim()))
        .map(p => ({
          id: p.id,
          platformId: 'facebook_page' as PlatformId,
          name: p.pageName?.trim() || 'Facebook Page',
          identifier: p.pageName?.trim(),
          url: p.pageUrl?.trim() || (p.pageName?.trim() ? `https://facebook.com/${encodeURIComponent(p.pageName.trim())}` : undefined),
          secondaryInfo: p.pageUrl?.trim() || 'Facebook Page',
          isConfigured: true
        }));

    case 'facebook_profile':
    case 'facebook':
      return (normalized.facebook_profile || [])
        .filter(p => !!(p.profileName?.trim() || p.profileUrl?.trim()))
        .map(p => ({
          id: p.id,
          platformId: 'facebook_profile' as PlatformId,
          name: p.profileName?.trim() || 'Facebook Profile',
          identifier: p.profileName?.trim(),
          url: p.profileUrl?.trim() || (p.profileName?.trim() ? `https://facebook.com/${encodeURIComponent(p.profileName.trim())}` : undefined),
          secondaryInfo: p.profileUrl?.trim() || 'Personal Profile',
          isConfigured: true
        }));

    case 'instagram':
      return (normalized.instagram || [])
        .filter(a => !!(a.username?.trim() || a.profileUrl?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          return {
            id: a.id,
            platformId: 'instagram' as PlatformId,
            name: cleanUser ? `@${cleanUser}` : 'Instagram Account',
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://instagram.com/${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || (cleanUser ? `instagram.com/${cleanUser}` : 'Instagram Account'),
            isConfigured: true
          };
        });

    case 'tiktok':
      return (normalized.tiktok || [])
        .filter(a => !!(a.username?.trim() || a.profileUrl?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          return {
            id: a.id,
            platformId: 'tiktok' as PlatformId,
            name: cleanUser ? `@${cleanUser}` : 'TikTok Account',
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://tiktok.com/@${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || (cleanUser ? `tiktok.com/@${cleanUser}` : 'TikTok Account'),
            isConfigured: true
          };
        });

    case 'youtube':
      return (normalized.youtube || [])
        .filter(y => !!(y.channelName?.trim() || y.channelUrl?.trim()))
        .map(y => ({
          id: y.id,
          platformId: 'youtube' as PlatformId,
          name: y.channelName?.trim() || 'YouTube Channel',
          identifier: y.channelName?.trim(),
          url: y.channelUrl?.trim() || (y.channelName?.trim() ? `https://youtube.com/results?search_query=${encodeURIComponent(y.channelName.trim())}` : undefined),
          secondaryInfo: y.channelUrl?.trim() || 'YouTube Channel',
          isConfigured: true
        }));

    case 'twitter':
      return (normalized.twitter || [])
        .filter(a => !!(a.username?.trim() || a.profileUrl?.trim()))
        .map(a => {
          const cleanUser = a.username ? a.username.trim().replace(/^@/, '') : '';
          return {
            id: a.id,
            platformId: 'twitter' as PlatformId,
            name: cleanUser ? `@${cleanUser}` : 'X Account',
            identifier: cleanUser ? `@${cleanUser}` : undefined,
            url: a.profileUrl?.trim() || (cleanUser ? `https://x.com/${cleanUser}` : undefined),
            secondaryInfo: a.profileUrl?.trim() || (cleanUser ? `x.com/${cleanUser}` : 'X Profile'),
            isConfigured: true
          };
        });

    case 'whatsapp':
      return (normalized.whatsapp || [])
        .filter(w => !!(w.phoneNumber?.trim() || w.name?.trim() || w.waLink?.trim()))
        .map(w => {
          const cleanPhone = w.phoneNumber?.replace(/[^0-9]/g, '');
          return {
            id: w.id,
            platformId: 'whatsapp' as PlatformId,
            name: w.name?.trim() || (w.phoneNumber ? `WA: ${w.phoneNumber.trim()}` : 'WhatsApp Account'),
            identifier: w.phoneNumber?.trim(),
            url: w.waLink?.trim() || (cleanPhone ? `https://wa.me/${cleanPhone}` : undefined),
            secondaryInfo: w.phoneNumber?.trim() || w.waLink?.trim() || 'WhatsApp Contact',
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
  const platforms: PlatformId[] = ['facebook_page', 'facebook_profile', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp'];
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
    subtitle: count === 1 ? (first.secondaryInfo || first.url || '') : `${count} accounts/pages configured`,
    count,
    isConfigured: true,
    testUrl
  };
}
