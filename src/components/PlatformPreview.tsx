import React, { useState } from 'react';
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Share2, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  Check, 
  Volume2, 
  Music, 
  Repeat, 
  BarChart2, 
  CheckCheck,
  Disc,
  ArrowLeft,
  Phone,
  Video as VideoIcon
} from 'lucide-react';
import { PlatformId, SocialPost, MediaItem, UserSocialAccounts } from '../types';
import { PLATFORMS } from '../data/platforms';
import { formatPlatformCaption } from '../utils/shareEngine';
import { getPlatformAccountDisplay } from '../utils/socialAccounts';

interface PlatformPreviewProps {
  post: SocialPost;
  media?: MediaItem | null;
  selectedPlatform?: PlatformId;
  onSelectPlatform?: (platform: PlatformId) => void;
  userAccounts?: UserSocialAccounts;
}

export const PlatformPreview: React.FC<PlatformPreviewProps> = ({
  post,
  media = post.media,
  selectedPlatform: controlledPlatform,
  onSelectPlatform,
  userAccounts
}) => {
  const [internalPlatform, setInternalPlatform] = useState<PlatformId>('facebook_page');
  const activePlatform = controlledPlatform || internalPlatform;

  const handleSelect = (p: PlatformId) => {
    if (onSelectPlatform) {
      onSelectPlatform(p);
    } else {
      setInternalPlatform(p);
    }
  };

  const override = post.platformOverrides?.[activePlatform];
  const effectiveTitle = override?.title || post.title;
  const effectiveCaption = override?.caption || post.caption;
  const effectiveDesc = override?.description || post.description;
  const effectiveHashtags = post.hashtags;

  const formattedText = formatPlatformCaption(activePlatform, {
    title: effectiveTitle,
    caption: effectiveCaption,
    description: effectiveDesc,
    hashtags: effectiveHashtags
  });

  const availablePlatforms: PlatformId[] = [
    'facebook_page',
    'facebook_profile',
    'instagram',
    'tiktok',
    'youtube',
    'twitter',
    'whatsapp'
  ];

  const accountInfo = getPlatformAccountDisplay(activePlatform, userAccounts);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header & Platform Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live Platform Preview
          </h3>
          <p className="text-[11px] text-slate-400">
            See how your post appears across each social network
          </p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {PLATFORMS[activePlatform]?.name}
          </span>
          {accountInfo.isConfigured ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 max-w-[140px] truncate">
              {accountInfo.title}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              Not configured
            </span>
          )}
        </div>
      </div>

      {/* Platform Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {availablePlatforms.map(pId => {
          const p = PLATFORMS[pId];
          const isSelected = activePlatform === pId;
          return (
            <button
              key={pId}
              type="button"
              onClick={() => handleSelect(pId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.accentColor }}
              />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Realistic Mockup Canvas Container */}
      <div className="pt-1">
        {activePlatform === 'facebook_page' && (
          <FacebookPageMockup
            title={effectiveTitle}
            caption={effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            pageName={
              Array.isArray(userAccounts?.facebook_page)
                ? userAccounts?.facebook_page[0]?.pageName
                : (userAccounts?.facebook_page as any)?.pageName
            }
          />
        )}

        {activePlatform === 'facebook_profile' && (
          <FacebookPageMockup
            title={effectiveTitle}
            caption={effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            pageName={
              Array.isArray(userAccounts?.facebook_profile)
                ? userAccounts?.facebook_profile[0]?.profileName
                : (userAccounts?.facebook_profile as any)?.profileName || 'Personal Timeline'
            }
            isProfile
          />
        )}

        {activePlatform === 'instagram' && (
          <InstagramMockup
            caption={effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            username={userAccounts?.instagram?.username}
          />
        )}

        {activePlatform === 'tiktok' && (
          <TikTokMockup
            caption={effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            username={userAccounts?.tiktok?.username}
          />
        )}

        {activePlatform === 'youtube' && (
          <YouTubeMockup
            title={effectiveTitle}
            description={effectiveDesc || effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            channelName={userAccounts?.youtube?.channelName}
          />
        )}

        {activePlatform === 'twitter' && (
          <XMockup
            text={formattedText}
            media={media}
            username={userAccounts?.twitter?.username}
          />
        )}

        {activePlatform === 'whatsapp' && (
          <WhatsAppMockup
            title={effectiveTitle}
            caption={effectiveCaption}
            hashtags={effectiveHashtags}
            media={media}
            contactOrNumber={userAccounts?.whatsapp?.phoneNumber || userAccounts?.whatsapp?.waLink}
          />
        )}
      </div>
    </div>
  );
};

/* 1. FACEBOOK PAGE / PROFILE MOCKUP */
const FacebookPageMockup: React.FC<{
  title: string;
  caption: string;
  hashtags: string[];
  media?: MediaItem | null;
  pageName?: string;
  isProfile?: boolean;
}> = ({ title, caption, hashtags, media, pageName, isProfile }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      {/* Facebook Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isProfile ? 'bg-blue-500' : 'bg-blue-600'}`}>
            {pageName ? pageName.charAt(0).toUpperCase() : (isProfile ? 'FB' : 'FP')}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {pageName || (isProfile ? 'Personal Profile' : 'Official Creator Page')}
              </span>
              {isProfile ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Profile
                </span>
              ) : (
                <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">
                  ✓
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>Just now</span>
              <span>•</span>
              <span>🌐 {isProfile ? 'Friends & Public' : 'Public'}</span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Text */}
      <div className="p-3 text-xs text-slate-800 dark:text-slate-200 space-y-1 leading-relaxed">
        {title && <div className="font-bold text-slate-900 dark:text-white">{title}</div>}
        <p className="whitespace-pre-line">{caption || 'Write your caption above to preview...'}</p>
        {hashtags.length > 0 && (
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {hashtags.join(' ')}
          </p>
        )}
      </div>

      {/* Media View */}
      {media && (
        <div className="bg-slate-950 aspect-video relative flex items-center justify-center overflow-hidden">
          {media.type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <img src={media.url} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                VIDEO
              </span>
            </div>
          ) : (
            <img src={media.url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Facebook Actions */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-around text-slate-500 dark:text-slate-400 text-xs font-semibold">
        <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </div>
      </div>
    </div>
  );
};

/* 2. INSTAGRAM MOCKUP */
const InstagramMockup: React.FC<{
  caption: string;
  hashtags: string[];
  media?: MediaItem | null;
  username?: string;
}> = ({ caption, hashtags, media, username }) => {
  const displayUser = username ? username.replace(/^@/, '') : 'creator_official';
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm max-w-sm mx-auto">
      {/* Instagram Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 p-0.5">
              <div className="w-full h-full rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                {displayUser.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">
              {displayUser}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Original Audio • Jangari Spot
            </div>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </div>

      {/* Media Frame (Square / 4:5) */}
      <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {media ? (
          media.type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <img src={media.url} alt="" className="w-full h-full object-cover" />
              <div className="w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                REEL
              </span>
            </div>
          ) : (
            <img src={media.url} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="text-xs text-slate-500">No media attached</div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer" />
            <MessageCircle className="w-5 h-5 hover:text-slate-500 cursor-pointer" />
            <Send className="w-5 h-5 hover:text-slate-500 cursor-pointer" />
          </div>
          <Bookmark className="w-5 h-5 hover:text-slate-500 cursor-pointer" />
        </div>

        {/* Likes Count */}
        <div className="text-xs font-bold text-slate-900 dark:text-white">
          1,420 likes
        </div>

        {/* Caption */}
        <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
          <span className="font-bold mr-1 text-slate-900 dark:text-white">
            {displayUser}
          </span>
          <span className="whitespace-pre-line">
            {caption || 'Add your caption above to preview on Instagram.'}
          </span>
          {hashtags.length > 0 && (
            <div className="text-blue-600 dark:text-blue-400 font-medium mt-1">
              {hashtags.join(' ')}
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 uppercase tracking-wider pt-0.5">
          2 hours ago
        </div>
      </div>
    </div>
  );
};

/* 3. TIKTOK MOCKUP (9:16 Vertical Video style) */
const TikTokMockup: React.FC<{
  caption: string;
  hashtags: string[];
  media?: MediaItem | null;
  username?: string;
}> = ({ caption, hashtags, media, username }) => {
  const displayUser = username ? `@${username.replace(/^@/, '')}` : '@creator_outdoor';
  return (
    <div className="max-w-[280px] sm:max-w-[300px] mx-auto rounded-3xl bg-black text-white aspect-[9/16] relative overflow-hidden shadow-xl border-4 border-slate-900">
      {/* Background Media */}
      {media ? (
        <img
          src={media.url}
          alt=""
          className="w-full h-full object-cover opacity-85"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
          Attach a 9:16 video for TikTok
        </div>
      )}

      {/* Top Header Tabs */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-center gap-4 text-xs font-bold z-10">
        <span className="text-white/60">Following</span>
        <span className="text-white border-b-2 border-white pb-0.5">For You</span>
      </div>

      {/* Right Interaction Sidebar */}
      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3.5 z-10 text-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-cyan-400 to-rose-500 flex items-center justify-center text-[10px] font-bold">
            TT
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
            +
          </span>
        </div>

        <div className="flex flex-col items-center">
          <Heart className="w-6 h-6 fill-white" />
          <span className="text-[10px] font-bold mt-0.5">48.2K</span>
        </div>

        <div className="flex flex-col items-center">
          <MessageCircle className="w-6 h-6 fill-white" />
          <span className="text-[10px] font-bold mt-0.5">620</span>
        </div>

        <div className="flex flex-col items-center">
          <Bookmark className="w-6 h-6 fill-white" />
          <span className="text-[10px] font-bold mt-0.5">2.1K</span>
        </div>

        <div className="flex flex-col items-center">
          <Share2 className="w-6 h-6 fill-white" />
          <span className="text-[10px] font-bold mt-0.5">1.8K</span>
        </div>

        {/* Vinyl disc */}
        <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center animate-spin">
          <Disc className="w-5 h-5 text-slate-300" />
        </div>
      </div>

      {/* Bottom Overlay Info */}
      <div className="absolute bottom-3 left-3 right-14 text-xs z-10 space-y-1.5">
        <div className="font-bold text-sm drop-shadow-md truncate">{displayUser}</div>
        <p className="text-xs line-clamp-3 leading-snug drop-shadow-md text-white/90">
          {caption || 'TikTok video caption & description preview.'}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs font-bold text-white drop-shadow-md">
            {hashtags.join(' ')}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-white/80 pt-0.5">
          <Music className="w-3 h-3 animate-pulse" />
          <span className="truncate">Original Sound - Creator Travel & Fishing</span>
        </div>
      </div>
    </div>
  );
};

/* 4. YOUTUBE MOCKUP */
const YouTubeMockup: React.FC<{
  title: string;
  description: string;
  hashtags: string[];
  media?: MediaItem | null;
  channelName?: string;
}> = ({ title, description, hashtags, media, channelName }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      {/* Video Container */}
      <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
        {media ? (
          <>
            <img src={media.url} alt="" className="w-full h-full object-cover opacity-90" />
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              1:24
            </span>
          </>
        ) : (
          <div className="text-xs text-slate-500">Attach video thumbnail</div>
        )}
      </div>

      {/* Video Details */}
      <div className="p-3.5 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
          {title || 'Video Title will appear prominently on YouTube'}
        </h4>

        {/* Channel Row */}
        <div className="flex items-center justify-between border-y border-slate-100 dark:border-slate-800/60 py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
              {channelName ? channelName.charAt(0).toUpperCase() : 'YT'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                {channelName || 'Creator Channel'}
              </div>
              <div className="text-[10px] text-slate-400">Verified Creator</div>
            </div>
          </div>

          <button className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700">
            Subscribe
          </button>
        </div>

        {/* Engagement Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-semibold shrink-0">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>1.2K</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-semibold shrink-0">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-semibold shrink-0">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save</span>
          </div>
        </div>

        {/* Description Excerpt */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="line-clamp-2">{description || 'Detailed video description...'}</p>
          {hashtags.length > 0 && (
            <p className="text-blue-600 dark:text-blue-400 font-medium pt-1">
              {hashtags.join(' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* 5. X (TWITTER) MOCKUP */
const XMockup: React.FC<{
  text: string;
  media?: MediaItem | null;
  username?: string;
}> = ({ text, media, username }) => {
  const displayHandle = username ? `@${username.replace(/^@/, '')}` : '@creator_x';
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 p-4 space-y-3 shadow-sm">
      {/* Top Profile */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">
            𝕏
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Creator
              </span>
              <span className="text-[#1DA1F2] text-xs">✓</span>
              <span className="text-[11px] text-slate-400">{displayHandle} • 1m</span>
            </div>
            {/* Character meter */}
            <span className="text-[10px] text-slate-400">
              {text.length}/280 chars
            </span>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </div>

      {/* Tweet Body */}
      <p className="text-xs leading-relaxed text-slate-900 dark:text-white whitespace-pre-line">
        {text || 'Write your X post above to preview.'}
      </p>

      {/* Attached Media Frame */}
      {media && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-950 relative">
          <img src={media.url} alt="" className="w-full h-full object-cover" />
          {media.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5 hover:text-sky-500 cursor-pointer">
          <MessageCircle className="w-4 h-4" />
          <span>14</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer">
          <Repeat className="w-4 h-4" />
          <span>48</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-rose-500 cursor-pointer">
          <Heart className="w-4 h-4" />
          <span>230</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-sky-500 cursor-pointer">
          <BarChart2 className="w-4 h-4" />
          <span>3.2K</span>
        </div>
        <Share2 className="w-4 h-4 hover:text-sky-500 cursor-pointer" />
      </div>
    </div>
  );
};

/* 6. WHATSAPP MOCKUP */
const WhatsAppMockup: React.FC<{
  title: string;
  caption: string;
  hashtags: string[];
  media?: MediaItem | null;
  contactOrNumber?: string;
}> = ({ title, caption, hashtags, media, contactOrNumber }) => {
  return (
    <div className="border border-emerald-500/30 rounded-2xl bg-[#ECE5DD] dark:bg-[#0b141a] overflow-hidden shadow-sm">
      {/* WhatsApp Chat Top Bar */}
      <div className="bg-[#075E54] dark:bg-[#202c33] text-white px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ArrowLeft className="w-4 h-4" />
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
            WA
          </div>
          <div>
            <div className="text-xs font-bold leading-none">
              {contactOrNumber || 'My Broadcast & Contacts'}
            </div>
            <div className="text-[10px] text-emerald-100 dark:text-slate-300 mt-0.5">
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/90">
          <VideoIcon className="w-4 h-4" />
          <Phone className="w-4 h-4" />
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Chat Canvas with Outgoing Bubble */}
      <div className="p-3.5 space-y-2 min-h-[220px] flex flex-col justify-end">
        {/* Outgoing WhatsApp Bubble */}
        <div className="ml-auto max-w-[85%] bg-[#DCF8C6] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-sm p-2.5 shadow-sm space-y-2 border border-emerald-600/10">
          {/* Media preview inside bubble */}
          {media && (
            <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 relative">
              <img src={media.url} alt="" className="w-full h-full object-cover" />
              {media.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formatted Text */}
          <div className="text-xs leading-relaxed space-y-1">
            {title && (
              <div className="font-bold text-emerald-950 dark:text-emerald-100">
                *{title}*
              </div>
            )}
            <p className="whitespace-pre-line text-slate-800 dark:text-slate-200">
              {caption || 'Add your caption above to preview WhatsApp format.'}
            </p>
            {hashtags.length > 0 && (
              <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                {hashtags.join(' ')}
              </div>
            )}
          </div>

          {/* Timestamp and Double Check mark */}
          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-300 pt-0.5">
            <span>14:20</span>
            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
