import React, { useState } from 'react';
import { 
  Globe, 
  Clock, 
  Sparkles, 
  Bell, 
  Info, 
  Shield, 
  Check, 
  ExternalLink, 
  Moon, 
  Sun, 
  HardDrive, 
  Unlink, 
  Link2, 
  AlertCircle,
  Edit3,
  Plus,
  Trash2,
  Edit2,
  Radio,
  Play,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Database
} from 'lucide-react';
import { 
  PlatformId, 
  AppSettings, 
  UserSocialAccounts, 
  SocialGroup, 
  NewsRssSource, 
  DEFAULT_RSS_SOURCES,
  AutoHuntSettings,
  AutoHuntInterval,
  HypeThresholdOption
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  isPlatformConfigured, 
  getPlatformTestUrl, 
  getPlatformAccountDisplay,
  getDestinationsForPlatform,
  sanitizeUrl
} from '../utils/socialAccounts';
import { 
  loadNewsSources, 
  saveNewsSources, 
  testRssSource, 
  loadNewsSettings, 
  saveNewsSettings,
  loadAutoHuntSettings,
  saveAutoHuntSettings,
  getStorageRetentionStats,
  clearDiscoveryCacheOnly,
  calculateNextHuntTimestamp
} from '../utils/newsEngine';
import { getMediaCacheStats, clearMediaCache } from '../utils/mediaCache';
import { SocialAccountsModal } from './SocialAccountsModal';
import { GroupsManager } from './GroupsManager';
import { AppHealthCheckSection } from './AppHealthCheckSection';
import { DataBackupSection } from './DataBackupSection';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  userAccounts: UserSocialAccounts;
  onUpdateUserAccounts: (newAccounts: UserSocialAccounts) => void;
  socialGroups?: SocialGroup[];
  onCreateGroup?: (newGroup: Omit<SocialGroup, 'id' | 'createdAt'>) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<Omit<SocialGroup, 'id' | 'createdAt'>>) => void;
  onDeleteGroup?: (groupId: string) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onSelectGroupForPost?: (groupId: string) => void;
  isDriveConnected: boolean;
  driveEmail?: string;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  drafts?: any[];
  history?: any[];
  onReloadAllData?: (mergedOrRestored?: any) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  userAccounts,
  onUpdateUserAccounts,
  socialGroups = [],
  onCreateGroup = () => {},
  onUpdateGroup = () => {},
  onDeleteGroup = () => {},
  onDuplicateGroup = () => {},
  onSelectGroupForPost,
  isDriveConnected,
  driveEmail,
  onConnectDrive,
  onDisconnectDrive,
  drafts,
  history,
  onReloadAllData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'groups' | 'general' | 'health' | 'rss_sources' | 'backup' | 'notifications' | 'about'>('accounts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [focusPlatform, setFocusPlatform] = useState<PlatformId | null>(null);

  // RSS Sources Manager State
  const [rssSources, setRssSources] = useState<NewsRssSource[]>(() => loadNewsSources());
  const [isAddingRss, setIsAddingRss] = useState(false);
  const [editingRssSource, setEditingRssSource] = useState<NewsRssSource | null>(null);
  const [rssName, setRssName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [rssCategory, setRssCategory] = useState('Nasional');
  const [rssPriority, setRssPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [testingRssId, setTestingRssId] = useState<string | null>(null);
  const [rssTestResults, setRssTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs?: number }>>({});

  // News Hunter Media & Cache Settings
  const [newsSettings, setNewsSettings] = useState(() => loadNewsSettings());
  const [mediaCacheStats, setMediaCacheStats] = useState(() => getMediaCacheStats());
  const [mediaCacheToast, setMediaCacheToast] = useState<string | null>(null);

  const handleUpdateMediaLimit = (limitMb: number) => {
    const updated = { ...newsSettings, mediaDownloadLimitMb: limitMb };
    setNewsSettings(updated);
    saveNewsSettings(updated);
    setMediaCacheToast(`Media download limit updated to ${limitMb === 0 ? 'No limit' : `${limitMb} MB`}.`);
    setTimeout(() => setMediaCacheToast(null), 3000);
  };

  const handleClearMediaCache = () => {
    const freshStats = clearMediaCache();
    setMediaCacheStats(freshStats);
    setMediaCacheToast('Media cache cleared safely. Your Library, Drafts & History are preserved.');
    setTimeout(() => setMediaCacheToast(null), 3500);
  };

  // Auto Hunt Settings State
  const [autoHuntSettings, setAutoHuntSettings] = useState<AutoHuntSettings>(() => loadAutoHuntSettings());
  const [storageStats, setStorageStats] = useState(() => getStorageRetentionStats());
  const [autoHuntToast, setAutoHuntToast] = useState<string | null>(null);

  const showAutoHuntToast = (msg: string) => {
    setAutoHuntToast(msg);
    setTimeout(() => setAutoHuntToast(null), 3500);
  };

  const handleToggleAutoHunt = () => {
    const newEnabled = !autoHuntSettings.enabled;
    const newStatus = newEnabled ? 'on' : 'off';
    const updated: AutoHuntSettings = {
      ...autoHuntSettings,
      enabled: newEnabled,
      status: newStatus,
      nextHuntTimestamp: newEnabled ? calculateNextHuntTimestamp(autoHuntSettings.interval) : undefined
    };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
    showAutoHuntToast(newEnabled ? 'Auto Hunt enabled! Scheduled monitoring is ON.' : 'Auto Hunt disabled (OFF).');
  };

  const handleUpdateInterval = (interval: AutoHuntInterval) => {
    const updated: AutoHuntSettings = {
      ...autoHuntSettings,
      interval,
      nextHuntTimestamp: autoHuntSettings.status === 'on' ? calculateNextHuntTimestamp(interval) : undefined
    };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
    showAutoHuntToast(`Hunt interval set to ${interval}.`);
  };

  const handleToggleCategory = (cat: string) => {
    const current = autoHuntSettings.categories || [];
    let updatedCats: string[];
    if (current.includes(cat)) {
      if (current.length === 1) {
        showAutoHuntToast('At least one category must be monitored.');
        return;
      }
      updatedCats = current.filter(c => c !== cat);
    } else {
      updatedCats = [...current, cat];
    }
    const updated = { ...autoHuntSettings, categories: updatedCats };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
  };

  const handleUpdateCustomCategory = (val: string) => {
    const updated = { ...autoHuntSettings, customCategory: val };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
  };

  const handleToggleSourceType = (key: 'rss' | 'web' | 'xTrending') => {
    const current = autoHuntSettings.sources;
    const updatedSources = { ...current, [key]: !current[key] };
    const updated = { ...autoHuntSettings, sources: updatedSources };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
  };

  const handleUpdateMinimumHype = (val: HypeThresholdOption) => {
    const updated = { ...autoHuntSettings, minimumHype: val };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
    showAutoHuntToast(`Minimum Hype threshold set to ${val === 'any' ? 'Any (0)' : `${val}+`}.`);
  };

  const handleToggleNotification = () => {
    const updated = { ...autoHuntSettings, notifyOnHighPriority: !autoHuntSettings.notifyOnHighPriority };
    setAutoHuntSettings(updated);
    saveAutoHuntSettings(updated);
  };

  const handleClearDiscoveryCache = () => {
    clearDiscoveryCacheOnly();
    setStorageStats(getStorageRetentionStats());
    showAutoHuntToast('Discovery cache cleared! News Library, Drafts, History & Accounts are preserved.');
  };

  const otherPlatformsList: PlatformId[] = [
    'instagram',
    'tiktok',
    'youtube',
    'twitter',
    'whatsapp'
  ];

  const handleOpenEdit = (platformId?: PlatformId) => {
    setFocusPlatform(platformId || null);
    setIsEditModalOpen(true);
  };

  const handleTestLink = (url?: string) => {
    if (url) {
      window.open(sanitizeUrl(url), '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteAccount = (platformId: PlatformId, accountId: string) => {
    const updated: UserSocialAccounts = {
      ...userAccounts,
      facebook_page: [...userAccounts.facebook_page],
      facebook_profile: [...(userAccounts.facebook_profile || [])],
      instagram: [...userAccounts.instagram],
      tiktok: [...userAccounts.tiktok],
      youtube: [...userAccounts.youtube],
      twitter: [...userAccounts.twitter],
      whatsapp: [...userAccounts.whatsapp]
    };

    if (platformId === 'facebook_page') {
      updated.facebook_page = updated.facebook_page.filter(i => i.id !== accountId);
    } else if (platformId === 'facebook_profile') {
      updated.facebook_profile = updated.facebook_profile.filter(i => i.id !== accountId);
    } else if (platformId === 'instagram') {
      updated.instagram = updated.instagram.filter(i => i.id !== accountId);
    } else if (platformId === 'tiktok') {
      updated.tiktok = updated.tiktok.filter(i => i.id !== accountId);
    } else if (platformId === 'youtube') {
      updated.youtube = updated.youtube.filter(i => i.id !== accountId);
    } else if (platformId === 'twitter') {
      updated.twitter = updated.twitter.filter(i => i.id !== accountId);
    } else if (platformId === 'whatsapp') {
      updated.whatsapp = updated.whatsapp.filter(i => i.id !== accountId);
    }
    onUpdateUserAccounts(updated);
  };

  const getAddButtonText = (platformId: PlatformId) => {
    switch (platformId) {
      case 'facebook_page':
        return '+ Add Facebook Page';
      case 'facebook_profile':
        return '+ Add Facebook Personal Profile';
      case 'instagram':
        return '+ Add Instagram Account';
      case 'tiktok':
        return '+ Add TikTok Account';
      case 'youtube':
        return '+ Add YouTube Channel';
      case 'twitter':
        return '+ Add X Account';
      case 'whatsapp':
        return '+ Add WhatsApp Account';
      default:
        return '+ Add Destination';
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings & Accounts</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage social media account destinations, Google Drive sync, timezones, and system alerts
        </p>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'accounts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Accounts
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'groups'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Groups</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
            {socialGroups.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'general'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          General
        </button>
        <button
          id="tab-health-check"
          onClick={() => setActiveSubTab('health')}
          className={`flex-1 min-w-[75px] py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'health'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Health</span>
        </button>
        <button
          id="tab-rss-sources"
          onClick={() => setActiveSubTab('rss_sources')}
          className={`flex-1 min-w-[75px] py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'rss_sources'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-indigo-500" />
          <span>News Hunter</span>
        </button>
        <button
          id="tab-data-backup"
          onClick={() => setActiveSubTab('backup')}
          className={`flex-1 min-w-[85px] py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'backup'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>Data & Backup</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'notifications'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveSubTab('about')}
          className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'about'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          About
        </button>
      </div>

      {/* SUB-TAB 1: SOCIAL ACCOUNTS */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          {/* SECTION: Social Media Accounts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Social Media Accounts</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure your pages and handles for live previews, deep links, and manual cross-posting
                </p>
              </div>

              <button
                id="btn-edit-accounts"
                onClick={() => handleOpenEdit()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Accounts</span>
              </button>
            </div>

            {/* List of Platforms with Multi-Account Support */}
            <div className="space-y-4 pt-1">
              {/* 1. FACEBOOK DEDICATED SECTION (Contains [Facebook Pages] and [Facebook Personal Profiles]) */}
              {(() => {
                const fbPages = userAccounts.facebook_page || [];
                const fbProfiles = userAccounts.facebook_profile || [];
                const totalFb = fbPages.length + fbProfiles.length;

                return (
                  <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
                    {/* Facebook Section Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
                          f
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white uppercase">
                              FACEBOOK
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              {totalFb} Configured ({fbPages.length} Pages, {fbProfiles.length} Profiles)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              Manual Sharing Only
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Separate destination types for Pages (business/brand) and Personal Profiles (timeline)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sub-section A: [Facebook Pages] */}
                    <div className="space-y-3 bg-white dark:bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                              [Facebook Pages]
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              {fbPages.length} configured
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Supports Page Posts & Page Reels
                          </div>
                        </div>

                        <button
                          id="btn-add-facebook-page"
                          type="button"
                          onClick={() => handleOpenEdit('facebook_page')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Facebook Page</span>
                        </button>
                      </div>

                      {/* Facebook Pages List */}
                      {fbPages.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {fbPages.map((page) => (
                            <div
                              key={page.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{page.pageName || 'Unnamed Page'}</span>
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                                    Page
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                  {page.pageUrl || 'No page URL set'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                {page.pageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleTestLink(page.pageUrl)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1"
                                    title="Test Facebook Page link"
                                  >
                                    <span>Test Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit('facebook_page')}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Edit page"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount('facebook_page', page.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Delete page"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2">
                          <span>No Facebook Pages added yet.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('facebook_page')}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            + Add Facebook Page
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sub-section B: [Facebook Personal Profiles] */}
                    <div className="space-y-3 bg-white dark:bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                              [Facebook Personal Profiles]
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              {fbProfiles.length} configured
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Supports Profile Posts & Profile Reels (Personal Timeline)
                          </div>
                        </div>

                        <button
                          id="btn-add-facebook-profile"
                          type="button"
                          onClick={() => handleOpenEdit('facebook_profile')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Facebook Personal Profile</span>
                        </button>
                      </div>

                      {/* Facebook Profiles List */}
                      {fbProfiles.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {fbProfiles.map((prof) => (
                            <div
                              key={prof.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{prof.profileName || 'Personal Profile'}</span>
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium">
                                    Personal Profile
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                  {prof.profileUrl || 'No profile URL set'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                {prof.profileUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleTestLink(prof.profileUrl)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1"
                                    title="Test Facebook Personal Profile link"
                                  >
                                    <span>Test Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit('facebook_profile')}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Edit profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount('facebook_profile', prof.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Delete profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2">
                          <span>No Facebook Personal Profiles added yet.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('facebook_profile')}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            + Add Facebook Personal Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Other Platforms (Instagram, TikTok, YouTube, X, WhatsApp) */}
              {otherPlatformsList.map((pId) => {
                const platform = PLATFORMS[pId];
                if (!platform) return null;

                const destinations = getDestinationsForPlatform(pId, userAccounts);
                const hasAccounts = destinations.length > 0;
                const addBtnLabel = getAddButtonText(pId);

                return (
                  <div
                    key={pId}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 transition-colors"
                  >
                    {/* Platform Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                          style={{ backgroundColor: platform.accentColor }}
                        >
                          {platform.name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {platform.name}
                            </span>
                            {hasAccounts ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <Check className="w-2.5 h-2.5" />
                                <span>{destinations.length} configured</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                                0 configured
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {platform.badge}
                          </div>
                        </div>
                      </div>

                      {/* Add Account Button for this platform */}
                      <button
                        id={`btn-add-${pId}`}
                        type="button"
                        onClick={() => handleOpenEdit(pId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{addBtnLabel}</span>
                      </button>
                    </div>

                    {/* Configured Accounts List for this platform */}
                    {hasAccounts ? (
                      <div className="space-y-2 pt-1">
                        {destinations.map((dest) => (
                          <div
                            key={dest.id}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                {dest.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {dest.url || dest.secondaryInfo || 'No destination link'}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {dest.url && (
                                <button
                                  type="button"
                                  onClick={() => handleTestLink(dest.url)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                                  title="Test destination link"
                                >
                                  <span>Test Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(pId)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit in manager"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(pId, dest.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span>No accounts or channels added yet.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pId)}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          {addBtnLabel}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clear Transparent Notice */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2.5 mt-2">
              <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Manual Destination Targets:</span>{' '}
                These saved URLs and handles specify your destination profiles and pages. They customize the live multi-platform previews and guide your 1-tap manual cross-posting actions. Profile URLs are not simulated as automated publishing APIs.
              </div>
            </div>
          </div>

          {/* Google Drive Integration Card */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/30 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Google Drive Media Access
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isDriveConnected ? `Connected (${driveEmail})` : 'Import photos & videos directly into posts'}
                  </div>
                </div>
              </div>

              {isDriveConnected ? (
                <button
                  onClick={onDisconnectDrive}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={onConnectDrive}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Connect Drive</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Accounts Modal */}
      <SocialAccountsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        accounts={userAccounts}
        onSave={(newAccs) => {
          onUpdateUserAccounts(newAccs);
        }}
        initialFocusPlatform={focusPlatform}
      />

      {/* SUB-TAB 2: GROUPS MANAGER */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <GroupsManager
            groups={socialGroups}
            userAccounts={userAccounts}
            onCreateGroup={onCreateGroup}
            onUpdateGroup={onUpdateGroup}
            onDeleteGroup={onDeleteGroup}
            onDuplicateGroup={onDuplicateGroup}
            onSelectGroupForPost={onSelectGroupForPost}
          />
        </div>
      )}

      {/* SUB-TAB 3: GENERAL SETTINGS */}
      {activeSubTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Default Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => onUpdateSettings({ timezone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (GMT+7) - Default</option>
                <option value="Asia/Makassar">Asia/Makassar (GMT+8)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (GMT+9)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="en">English (US)</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                Appearance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    settings.theme === 'light'
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light Mode
                </button>
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    settings.theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark Mode
                </button>
              </div>
            </div>
          </div>

          {/* APP HEALTH CHECK SECTION IN GENERAL */}
          <AppHealthCheckSection
            userAccounts={userAccounts}
            socialGroups={socialGroups}
            drafts={drafts}
            history={history}
          />
        </div>
      )}

      {/* SUB-TAB: APP HEALTH CHECK DEDICATED */}
      {activeSubTab === 'health' && (
        <div className="space-y-4">
          <AppHealthCheckSection
            userAccounts={userAccounts}
            socialGroups={socialGroups}
            drafts={drafts}
            history={history}
          />
        </div>
      )}

      {/* SUB-TAB: NEWS HUNTER SETTINGS & RSS SOURCES */}
      {activeSubTab === 'rss_sources' && (
        <div className="space-y-4">

          {/* Toast Notification */}
          {(mediaCacheToast || autoHuntToast) && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mediaCacheToast || autoHuntToast}</span>
            </div>
          )}

          {/* SECTION 1: AUTO HUNT / NEWS MONITOR SETTINGS (Requirement #1, #2, #3, #7, #12, #18) */}
          <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-3xl p-4 sm:p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Settings → News Hunter → Auto Hunt
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                  <span>AUTO HUNT / NEWS MONITOR</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    autoHuntSettings.status === 'on'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : autoHuntSettings.status === 'paused'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    Status: {autoHuntSettings.status.toUpperCase()}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatically checks configured news sources for new stories on a schedule, without publishing anything.
                </p>
              </div>

              {/* Status Toggle Button (Requirement #1) */}
              <button
                id="btn-toggle-auto-hunt"
                type="button"
                onClick={handleToggleAutoHunt}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                  autoHuntSettings.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                <span>{autoHuntSettings.enabled ? '✓ Auto Hunt Enabled' : 'Enable Auto Hunt'}</span>
              </button>
            </div>

            {/* 1. Hunt Interval (Requirement #1) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Hunt Interval
                </span>
                <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  Selected: Every {autoHuntSettings.interval === '24h' ? '24 hours (Once per day)' : autoHuntSettings.interval}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
                {[
                  { id: '15m' as AutoHuntInterval, label: 'Every 15 min' },
                  { id: '30m' as AutoHuntInterval, label: 'Every 30 min' },
                  { id: '1h' as AutoHuntInterval, label: 'Every 1 hour' },
                  { id: '3h' as AutoHuntInterval, label: 'Every 3 hours' },
                  { id: '6h' as AutoHuntInterval, label: 'Every 6 hours' },
                  { id: '12h' as AutoHuntInterval, label: 'Every 12 hours' },
                  { id: '24h' as AutoHuntInterval, label: 'Once per day' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdateInterval(opt.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                      autoHuntSettings.interval === opt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Category Selection (Requirement #2) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Category Selection
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {autoHuntSettings.categories.length} categories active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose which news beats Auto Hunt should monitor for incoming stories:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                {[
                  'Hype / Viral',
                  'Nasional',
                  'Internasional',
                  'Sepakbola',
                  'Persib',
                  'Teknologi',
                  'Ekonomi',
                  'Lifestyle',
                  'Adventure'
                ].map(cat => {
                  const isChecked = autoHuntSettings.categories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCategory(cat)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  );
                })}
              </div>

              {/* Custom Category Input */}
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  Custom Category:
                </span>
                <input
                  type="text"
                  placeholder="e.g. Kuliner, Otomotif, Gaming"
                  value={autoHuntSettings.customCategory || ''}
                  onChange={e => handleUpdateCustomCategory(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 3. Source Selection (Requirement #3) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Source Selection
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Verified Data Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Active RSS Sources */}
                <label className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  autoHuntSettings.sources.rss
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={autoHuntSettings.sources.rss}
                    onChange={() => handleToggleSourceType('rss')}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Active RSS Sources</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Direct feeds from configured news outlets
                    </div>
                  </div>
                </label>

                {/* Web Search */}
                <label className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  autoHuntSettings.sources.web
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={autoHuntSettings.sources.web}
                    onChange={() => handleToggleSourceType('web')}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Web Search Discovery</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supplementary search for fresh stories
                    </div>
                  </div>
                </label>

                {/* X Trending */}
                <label className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  autoHuntSettings.sources.xTrending
                    ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={autoHuntSettings.sources.xTrending}
                    onChange={() => handleToggleSourceType('xTrending')}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">X Trending</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Real trend stream (requires valid X API)
                    </div>
                  </div>
                </label>
              </div>

              {/* X Trending Warning when checked (Requirement #3) */}
              {autoHuntSettings.sources.xTrending && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">X Trending unavailable — valid access is required.</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                      Do not simulate X trends. Auto Hunt continues using verified RSS feeds and search without fake trend data.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Minimum Hype Score / Threshold (Requirement #7 & #6) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Minimum Hype Score Threshold
                </span>
                <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  Filter: {autoHuntSettings.minimumHype === 'any' ? 'Any Score (0)' : `${autoHuntSettings.minimumHype}+`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Internal topic momentum score — not an official popularity measurement. Auto Hunt still stores lower-scoring stories when &apos;Any&apos; is chosen.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { id: 'any' as HypeThresholdOption, label: 'Any (0)' },
                  { id: '50' as HypeThresholdOption, label: '50+' },
                  { id: '70' as HypeThresholdOption, label: '70+ (Default)' },
                  { id: '85' as HypeThresholdOption, label: '85+ (High Only)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdateMinimumHype(opt.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                      autoHuntSettings.minimumHype === opt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Notifications & Native Compatibility (Requirement #12 & #20) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  High-Interest Story Notifications
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoHuntSettings.notifyOnHighPriority}
                    onChange={handleToggleNotification}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Notify when a story with Priority 🔥 HIGH (Hype 85-100) is detected by Auto Hunt.
              </p>

              {/* Requirement #12 Disclaimer */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Notice regarding background notifications:</span> Background notifications require the Android development/native build. Active in-app alerts are active while the tab is open.
                </div>
              </div>
            </div>

            {/* 6. STORAGE & RETENTION SECTION (Requirement #18) */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    News Hunter → Storage
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Storage & Retention Management
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Local Retention
                </span>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Discovered Stories</div>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">
                    {storageStats.discoveredCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">News Library</div>
                  <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                    {storageStats.libraryCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Cache Size</div>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">
                    ~{storageStats.cacheSizeKb} KB
                  </div>
                </div>
              </div>

              {/* Clear Action & Safety Rule */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                  <strong>Important:</strong> Clearing discovery cache only removes temporary discovery logs. It will <strong>NOT</strong> delete your News Library, Drafts, History, Accounts, Posting Groups, or Settings.
                </p>

                <button
                  id="btn-clear-discovery-cache"
                  type="button"
                  onClick={handleClearDiscoveryCache}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white dark:text-rose-400 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800/40 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Discovery Cache</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: NEWS HUNTER MEDIA CONTROLS (Requirement #10) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                News Media Hunter
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Media Download & Storage Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control automatic size limits for media downloads and manage local media cache safely.
              </p>
            </div>

            {/* 1. Media Download Limit */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Media Download Limit
                </span>
                <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  Current: {newsSettings.mediaDownloadLimitMb === 0 ? 'No limit' : `${newsSettings.mediaDownloadLimitMb} MB`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prevents downloading large files over cellular connections without confirmation.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {[
                  { label: '10 MB', val: 10 },
                  { label: '25 MB (Default)', val: 25 },
                  { label: '50 MB', val: 50 },
                  { label: '100 MB', val: 100 },
                  { label: 'No limit', val: 0 }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleUpdateMediaLimit(opt.val)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                      newsSettings.mediaDownloadLimitMb === opt.val
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Clear Media Cache */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Clear Media Cache
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Safe Maintenance
                </span>
              </div>

              {/* Cache Stats Display */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Cached Items</div>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5 font-mono">
                    {mediaCacheStats.count} items
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Cache Size</div>
                  <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                    {mediaCacheStats.formattedSize}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Cleared</div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                    {mediaCacheStats.lastCleared
                      ? new Date(mediaCacheStats.lastCleared).toLocaleDateString([], { month: 'short', day: 'numeric' })
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Clear Action & Safety Note */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                  Clearing media cache frees local temporary storage. It will <strong>NOT</strong> delete your News Library, Drafts, History, Accounts, or RSS Feeds.
                </p>

                <button
                  type="button"
                  onClick={handleClearMediaCache}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white dark:text-rose-400 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800/40 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Media Cache</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION: NEWS RSS SOURCES MANAGER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>News RSS Sources Manager</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {rssSources.length} Feeds ({rssSources.filter(s => s.active).length} Active)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure news and sports feeds used by News Hunter
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to default curated RSS sources list?')) {
                      setRssSources(DEFAULT_RSS_SOURCES);
                      saveNewsSources(DEFAULT_RSS_SOURCES);
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRss(true);
                    setEditingRssSource(null);
                    setRssName('');
                    setRssUrl('');
                    setRssCategory('Nasional');
                    setRssPriority('high');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add RSS Feed</span>
                </button>
              </div>
            </div>

            {/* Inline Add / Edit Form */}
            {(isAddingRss || editingRssSource) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!rssName.trim() || !rssUrl.trim()) return;
                  if (editingRssSource) {
                    const updated = rssSources.map(s => 
                      s.id === editingRssSource.id 
                        ? { ...s, name: rssName.trim(), url: rssUrl.trim(), category: rssCategory, priority: rssPriority }
                        : s
                    );
                    setRssSources(updated);
                    saveNewsSources(updated);
                    setEditingRssSource(null);
                  } else {
                    const newSource: NewsRssSource = {
                      id: `src-${Date.now()}`,
                      name: rssName.trim(),
                      url: rssUrl.trim(),
                      category: rssCategory,
                      priority: rssPriority,
                      active: true
                    };
                    const updated = [newSource, ...rssSources];
                    setRssSources(updated);
                    saveNewsSources(updated);
                    setIsAddingRss(false);
                  }
                }}
                className="bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {editingRssSource ? 'Edit RSS Feed' : 'Add New RSS Feed'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsAddingRss(false); setEditingRssSource(null); }}
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Feed Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. detikJabar, Bola.com, CNN Indonesia"
                    value={rssName}
                    onChange={e => setRssName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Feed URL (XML/RSS/Atom)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://.../rss.xml"
                    value={rssUrl}
                    onChange={e => setRssUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={rssCategory}
                      onChange={e => setRssCategory(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {['Persib', 'Sepakbola', 'Nasional', 'Hype / Viral', 'Internasional', 'Teknologi', 'Ekonomi', 'Lifestyle', 'Adventure', 'Custom'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Priority
                    </label>
                    <select
                      value={rssPriority}
                      onChange={e => setRssPriority(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsAddingRss(false); setEditingRssSource(null); }}
                    className="px-3 py-1.5 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                  >
                    Save Feed
                  </button>
                </div>
              </form>
            )}

            {/* Feeds List */}
            <div className="space-y-2.5 pt-1">
              {rssSources.map(src => {
                const testRes = rssTestResults[src.id];
                const isTesting = testingRssId === src.id;

                return (
                  <div
                    key={src.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      src.active
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {src.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {src.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                            {src.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                          {src.url}
                        </div>
                      </div>

                      {/* Active toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={src.active}
                          onChange={() => {
                            const updated = rssSources.map(s => s.id === src.id ? { ...s, active: !s.active } : s);
                            setRssSources(updated);
                            saveNewsSources(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Test result message if any */}
                    {testRes && (
                      <div className={`mt-2 p-2 rounded-xl text-[11px] flex items-start gap-1.5 ${
                        testRes.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                      }`}>
                        {testRes.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                        )}
                        <div>
                          <span>{testRes.message}</span>
                          {testRes.latencyMs && (
                            <span className="ml-1 opacity-70 font-mono">({testRes.latencyMs}ms)</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={async () => {
                          setTestingRssId(src.id);
                          const res = await testRssSource(src.url, src.name);
                          setRssTestResults(prev => ({ ...prev, [src.id]: res }));
                          setTestingRssId(null);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isTesting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Test Feed</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRssSource(src);
                            setIsAddingRss(false);
                            setRssName(src.name);
                            setRssUrl(src.url);
                            setRssCategory(src.category);
                            setRssPriority(src.priority);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Edit Feed"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this RSS feed?')) {
                              const updated = rssSources.filter(s => s.id !== src.id);
                              setRssSources(updated);
                              saveNewsSources(updated);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Delete Feed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: NOTIFICATION SETTINGS & EXPO GO COMPATIBILITY */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  Scheduled Post Reminders
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify when a scheduled post is ready to be shared
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationEnabled}
                onChange={(e) => onUpdateSettings({ notificationEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              >
              </input>
            </div>

            {/* Expo Go Status Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                Expo Go Notice (SDK 53+):
              </div>
              <p className="leading-relaxed">
                Remote push notifications require a development build. When running in Expo Go on Android, push token initialization is automatically bypassed to prevent crashes.
              </p>
              <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pt-1">
                Status: <span className="font-semibold">Local in-app reminders & timers active. Remote push gracefully disabled.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: DATA & BACKUP */}
      {activeSubTab === 'backup' && (
        <DataBackupSection onReloadAllData={onReloadAllData} />
      )}

      {/* SUB-TAB 4: ABOUT */}
      {activeSubTab === 'about' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-indigo-500" />
              About Social Share Scheduler
            </div>
            <p>
              An Android-first mobile application allowing users to create ONE social media post and share across multiple platforms manually from one place.
            </p>
            <div className="space-y-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div>• Version: 1.0.0 (MVP Build)</div>
              <div>• Supported: Facebook, Facebook Fan Page, YouTube Shorts, Instagram, TikTok, X (Twitter)</div>
              <div>• Google Drive: Google Workspace integration enabled</div>
              <div>• Native Android: ACTION_SEND & Deep link intent workflows</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
