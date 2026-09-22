import React, { useState, useEffect } from 'react';
import { 
  SocialPost, 
  PlatformId, 
  AppSettings, 
  MediaItem,
  UserSocialAccounts,
  DEFAULT_USER_ACCOUNTS,
  SocialGroup,
  DEFAULT_SOCIAL_GROUPS,
  PlatformCustomContent,
  ContentQueueItem,
  QueueItemStatus,
  QueueItemPriority,
  SAMPLE_QUEUE_ITEMS,
  DATA_SCHEMA_VERSION
} from './types';
import { PLATFORMS, SAMPLE_MEDIA_LIBRARY } from './data/platforms';
import { HomeScreen } from './components/HomeScreen';
import { NewsHunterScreen } from './components/NewsHunterScreen';
import { CreatePostScreen } from './components/CreatePostScreen';
import { ShareConfirmationScreen } from './components/ShareConfirmationScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { DraftsScreen } from './components/DraftsScreen';
import { QueueScreen } from './components/QueueScreen';
import { SettingsScreen } from './components/SettingsScreen';

import { GoogleDriveModal } from './components/GoogleDriveModal';
import { BottomNavigation, NavigationTab } from './components/BottomNavigation';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import { useAndroidBackHandler } from './hooks/useAndroidBackHandler';
import { getNotificationRuntimeStatus, schedulePostReminder } from './utils/notificationHelper';
import { getActiveShareSession, clearActiveShareSession } from './utils/shareEngine';
import { getUnviewedStoriesCount, executeAutoHuntRun, loadAutoHuntSettings } from './utils/newsEngine';
import { Bell, Share2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [confirmingPost, setConfirmingPost] = useState<SocialPost | null>(null);
  const [editingDraft, setEditingDraft] = useState<SocialPost | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [inAppAlert, setInAppAlert] = useState<{ title: string; message: string } | null>(null);
  const [activeSession, setActiveSession] = useState(() => getActiveShareSession());
  const [newStoriesCount, setNewStoriesCount] = useState<number>(() => getUnviewedStoriesCount());

  // Android System Back Button & Escape key navigation handler (Requirement #22)
  useAndroidBackHandler({
    hasOpenModal: isDriveModalOpen,
    onCloseModal: () => setIsDriveModalOpen(false),
    isSubscreen: Boolean(confirmingPost) || (activeTab === 'create' && Boolean(editingDraft)),
    onExitSubscreen: () => {
      if (confirmingPost) {
        setConfirmingPost(null);
      } else if (editingDraft) {
        setEditingDraft(null);
        setActiveTab('home');
      }
    },
    activeTab,
    onGoHome: () => setActiveTab('home')
  });

  // Periodically refresh activeSession indicator if exists
  useEffect(() => {
    const s = getActiveShareSession();
    if (s && !s.isComplete) {
      setActiveSession(s);
    } else {
      setActiveSession(null);
    }
  }, [confirmingPost, activeTab]);

  // Auto Hunt background monitor while app is active in foreground (Requirement #7, #9, #13)
  useEffect(() => {
    // Initial check
    setNewStoriesCount(getUnviewedStoriesCount());

    const timer = setInterval(async () => {
      const autoSettings = loadAutoHuntSettings();
      if (!autoSettings.enabled || autoSettings.status !== 'on') return;

      const now = Date.now();
      const nextTimestampMs = autoSettings.nextHuntTimestamp ? new Date(autoSettings.nextHuntTimestamp).getTime() : 0;
      if (!autoSettings.nextHuntTimestamp || now >= nextTimestampMs) {
        try {
          const huntExecution = await executeAutoHuntRun();
          const unviewed = getUnviewedStoriesCount();
          setNewStoriesCount(unviewed);
          if (huntExecution.result.newStoriesCount > 0) {
            setInAppAlert({
              title: 'Auto Hunt: New Stories',
              message: `Discovered ${huntExecution.result.newStoriesCount} new stories from ${huntExecution.result.sourcesChecked} sources.`
            });
            setTimeout(() => setInAppAlert(null), 4000);
          }
        } catch {
          // Gracefully continue
        }
      }
    }, 60000); // Check every minute while app is open

    return () => clearInterval(timer);
  }, []);
  const [userAccounts, setUserAccounts] = useState<UserSocialAccounts>(() => {
    const saved = localStorage.getItem('sss_user_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_USER_ACCOUNTS;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sss_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      language: 'en',
      timezone: 'Asia/Jakarta',
      notificationEnabled: true,
      isExpoGoMode: true, // Expo Go compatibility flag active
      hasDevBuild: false,
      defaultHashtags: ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture'],
      theme: 'dark'
    };
  });

  // History State
  const [history, setHistory] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('sss_history');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Initial sample record matching prompt test case
    return [
      {
        id: 'sample-post-1',
        title: 'Jangari, Surga Pemancing di Jawa Barat',
        caption: 'Jangari bukan cuma tempat mancing, tapi juga menawarkan panorama dan suasana yang menarik untuk dijelajahi.',
        description: 'Jangari Reservoir di Jawa Barat merupakan destinasi favorit pecinta mancing.',
        hashtags: ['#Jangari', '#Mancing', '#WisataJawaBarat', '#Fishing', '#NgabloeVenture'],
        media: SAMPLE_MEDIA_LIBRARY[0],
        selectedPlatforms: ['facebook_page', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        platformStatuses: {
          facebook_page: { status: 'SHARED', note: 'Shared to Facebook Page', updatedAt: new Date().toISOString() },
          instagram: { status: 'SHARED', note: 'Shared to Instagram Reels', updatedAt: new Date().toISOString() },
          tiktok: { status: 'OPENED', note: 'Opened in TikTok composer', updatedAt: new Date().toISOString() },
          youtube: { status: 'SHARED', note: 'Uploaded to YouTube', updatedAt: new Date().toISOString() },
          twitter: { status: 'SHARED', note: 'Shared to X', updatedAt: new Date().toISOString() },
          whatsapp: { status: 'SHARED', note: 'Sent via WhatsApp chat', updatedAt: new Date().toISOString() }
        }
      }
    ];
  });

  // Drafts State
  const [drafts, setDrafts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('sss_drafts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  // Content Queue State (Scheduled posts with metadata: status, priority, scheduled date/time)
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>(() => {
    const saved = localStorage.getItem('sss_content_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return SAMPLE_QUEUE_ITEMS;
  });

  // Social Media Groups State

  const [socialGroups, setSocialGroups] = useState<SocialGroup[]>(() => {
    const saved = localStorage.getItem('sss_social_groups');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_SOCIAL_GROUPS;
  });

  const [selectedGroupIdForCreate, setSelectedGroupIdForCreate] = useState<string | null>(null);

  // Google Drive integration hook
  const drive = useGoogleDrive();

  // Sync settings theme to document
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sss_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist history & drafts & social accounts
  useEffect(() => {
    localStorage.setItem('sss_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('sss_drafts', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('sss_user_accounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  useEffect(() => {
    localStorage.setItem('sss_social_groups', JSON.stringify(socialGroups));
  }, [socialGroups]);

  useEffect(() => {
    localStorage.setItem('sss_content_queue', JSON.stringify(contentQueue));
  }, [contentQueue]);

  // Schema preservation check (ensures local data is never overwritten with defaults)
  useEffect(() => {
    const existingVer = localStorage.getItem('sss_schema_version');
    if (!existingVer) {
      localStorage.setItem('sss_schema_version', DATA_SCHEMA_VERSION.toString());
    }
  }, []);

  // Reload all state when a backup is restored, merged, or reset
  const handleReloadAllData = (mergedOrRestored?: any) => {
    if (mergedOrRestored) {
      if (mergedOrRestored.accounts) setUserAccounts(mergedOrRestored.accounts);
      if (mergedOrRestored.groups) setSocialGroups(mergedOrRestored.groups);
      if (mergedOrRestored.drafts) setDrafts(mergedOrRestored.drafts);
      if (mergedOrRestored.history) setHistory(mergedOrRestored.history);
      if (mergedOrRestored.queue) setContentQueue(mergedOrRestored.queue);
      if (mergedOrRestored.settings) setSettings(mergedOrRestored.settings);
    } else {
      const acc = localStorage.getItem('sss_user_accounts');
      if (acc) { try { setUserAccounts(JSON.parse(acc)); } catch {} }
      const grp = localStorage.getItem('sss_social_groups');
      if (grp) { try { setSocialGroups(JSON.parse(grp)); } catch {} }
      const drf = localStorage.getItem('sss_drafts');
      if (drf) { try { setDrafts(JSON.parse(drf)); } catch {} }
      const hst = localStorage.getItem('sss_history');
      if (hst) { try { setHistory(JSON.parse(hst)); } catch {} }
      const que = localStorage.getItem('sss_content_queue');
      if (que) { try { setContentQueue(JSON.parse(que)); } catch {} }
      const setts = localStorage.getItem('sss_settings');
      if (setts) { try { setSettings(JSON.parse(setts)); } catch {} }
    }
  };


  // Handle setting updates
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Handle user configured social media accounts
  const handleUpdateUserAccounts = (newAccounts: UserSocialAccounts) => {
    setUserAccounts(newAccounts);
  };

  // Handle Groups CRUD operations
  const handleCreateGroup = (newGroupData: Omit<SocialGroup, 'id' | 'createdAt'>) => {
    const newGroup: SocialGroup = {
      ...newGroupData,
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setSocialGroups(prev => [...prev, newGroup]);
    setInAppAlert({
      title: 'Group Created',
      message: `Group "${newGroup.name}" created with ${newGroup.destinationIds.length} destinations.`
    });
    setTimeout(() => setInAppAlert(null), 3000);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<Omit<SocialGroup, 'id' | 'createdAt'>>) => {
    setSocialGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const handleDeleteGroup = (groupId: string) => {
    setSocialGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleDuplicateGroup = (groupId: string) => {
    const original = socialGroups.find(g => g.id === groupId);
    if (!original) return;
    const duplicated: SocialGroup = {
      ...original,
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setSocialGroups(prev => [...prev, duplicated]);
  };

  const handleSelectGroupForPost = (groupId: string) => {
    setEditingDraft(null);
    setConfirmingPost(null);
    setSelectedGroupIdForCreate(groupId);
    setActiveTab('create');
  };

  // User starts creating from scratch
  const handleStartCreate = (targetDate?: string) => {
    if (targetDate) {
      const scheduledIso = targetDate.includes('T') ? targetDate : `${targetDate}T12:00:00`;
      setEditingDraft({
        id: `draft-${Date.now()}`,
        title: '',
        caption: '',
        description: '',
        hashtags: [],
        media: null,
        selectedPlatforms: [],
        selectedDestinationIds: [],
        selectedGroupId: null,
        scheduledAt: scheduledIso,
        createdAt: new Date().toISOString(),
        isDraft: true,
        platformStatuses: {}
      });
    } else {
      setEditingDraft(null);
    }
    setConfirmingPost(null);
    setSelectedGroupIdForCreate(null);
    setActiveTab('create');
  };

  // User sends rewritten news story to Post Composer (NEWS → CONTENT FACTORY)
  const handleCreatePostWithNews = (newsData: any) => {
    // Media behavior: only attach media if news story actually has media or image URL
    // Do NOT automatically download media or substitute fake presets
    const newsMedia: MediaItem | null = newsData.media ? {
      id: newsData.media.id || `media-news-${Date.now()}`,
      name: (newsData.title || 'Discovered Media').slice(0, 30),
      type: newsData.media.type,
      url: newsData.media.url,
      thumbnailUrl: newsData.media.thumbnailUrl,
      source: 'local'
    } : newsData.imageUrl ? {
      id: `media-news-${Date.now()}`,
      name: (newsData.title || 'News Cover').slice(0, 30),
      type: 'image',
      url: newsData.imageUrl,
      source: 'local'
    } : null;

    const platformOverrides: Partial<Record<PlatformId, PlatformCustomContent>> = {};
    if (newsData.platformContent) {
      const pc = newsData.platformContent;
      if (pc.facebookCaption) {
        platformOverrides.facebook_page = { caption: pc.facebookCaption, hashtags: pc.hashtags || [] };
        platformOverrides.facebook_profile = { caption: pc.facebookCaption, hashtags: pc.hashtags || [] };
      }
      if (pc.instagramCaption) {
        platformOverrides.instagram = { caption: pc.instagramCaption, hashtags: pc.hashtags || [] };
      }
      if (pc.tiktokCaption) {
        platformOverrides.tiktok = { caption: pc.tiktokCaption, hashtags: pc.hashtags || [] };
      }
      if (pc.youtubeTitle) {
        platformOverrides.youtube = { title: pc.youtubeTitle, description: pc.youtubeDescription || '', hashtags: pc.hashtags || [] };
      }
      if (pc.twitterCaption) {
        platformOverrides.twitter = { caption: pc.twitterCaption, hashtags: pc.hashtags?.slice(0, 3) || [] };
      }
      if (pc.whatsappCaption) {
        platformOverrides.whatsapp = { caption: pc.whatsappCaption, hashtags: [] };
      }
    }

    // Default requirement: No destinations selected until user chooses group or destinations.
    // Imported News story must NOT automatically choose a group. User must choose group.
    const newsDraft: SocialPost = {
      id: `draft-news-${Date.now()}`,
      title: newsData.title || 'News Update',
      caption: newsData.description || newsData.title || '',
      description: newsData.description || '',
      hashtags: newsData.platformContent?.hashtags || ['#BeritaTerkini', '#Update', '#News'],
      media: newsMedia,
      selectedPlatforms: [],
      selectedDestinationIds: [],
      selectedGroupId: null,
      createdAt: new Date().toISOString(),
      platformOverrides: Object.keys(platformOverrides).length > 0 ? platformOverrides : undefined,
      platformStatuses: {},
      isDraft: true,
      newsSourceInfo: {
        sourceName: newsData.sourceName || newsData.source || 'News Hunter',
        articleTitle: newsData.originalTitle || newsData.title || '',
        articleUrl: newsData.sourceUrl || newsData.url || '',
        publishedAt: newsData.publishedAt,
        category: newsData.category,
        hypeScore: newsData.hypeScore,
        summary: newsData.summary || newsData.description,
        media: newsData.media || (newsData.imageUrl ? {
          id: `media-${Date.now()}`,
          type: 'image',
          url: newsData.imageUrl,
          sourceName: newsData.sourceName || newsData.source || 'News Source',
          sourceUrl: newsData.sourceUrl || newsData.url,
          status: 'downloadable'
        } : null),
        mediaSource: newsData.media?.sourceName || newsData.sourceName || newsData.source,
        factStatus: newsData.factStatus || 'confirmed',
        factNotice: newsData.factNotice,
        generatedTitles: newsData.generatedTitles || (newsData.rewrite ? [
          { type: 'Viral Hook', title: newsData.rewrite.selectedTitle || newsData.title },
          { type: 'Straightforward News', title: newsData.originalTitle || newsData.title },
          { type: 'Short Title', title: (newsData.originalTitle || newsData.title).slice(0, 50) }
        ] : undefined),
        generatedDescriptions: newsData.generatedDescriptions || (newsData.rewrite ? {
          short: newsData.rewrite.shortDescription || newsData.description,
          medium: newsData.rewrite.mediumDescription || newsData.summary || newsData.description,
          social: newsData.rewrite.facebookCaption || newsData.description
        } : undefined),
        includeSourceNameInCaption: false,
        includeArticleLinkInCaption: false
      }
    };

    setEditingDraft(newsDraft);
    setSelectedGroupIdForCreate(null);
    setConfirmingPost(null);
    setActiveTab('create');
  };

  // Content Queue Operations
  const handleAddToQueue = (
    item: Omit<ContentQueueItem, 'id' | 'createdAt' | 'updatedAt'> | SocialPost,
    options?: { priority?: QueueItemPriority; scheduledAt?: string }
  ) => {
    const isSocialPost = 'selectedPlatforms' in item && !('status' in item);
    const id = `queue-${Date.now()}`;
    const now = new Date().toISOString();

    let newQueueItem: ContentQueueItem;

    if (isSocialPost) {
      const post = item as SocialPost;
      newQueueItem = {
        id,
        postId: post.id,
        title: post.title,
        caption: post.caption,
        description: post.description,
        hashtags: post.hashtags,
        callToAction: post.callToAction,
        media: post.media,
        selectedPlatforms: post.selectedPlatforms,
        selectedDestinationIds: post.selectedDestinationIds,
        selectedGroupId: post.selectedGroupId,
        scheduledAt: options?.scheduledAt || post.scheduledAt || new Date(Date.now() + 3600000 * 2).toISOString(),
        status: 'scheduled',
        priority: options?.priority || 'medium',
        createdAt: now,
        updatedAt: now,
        platformOverrides: post.platformOverrides,
        metadata: {
          source: post.newsSourceInfo ? 'news_hunter' : 'manual',
          newsSourceTitle: post.newsSourceInfo?.articleTitle,
          newsSourceUrl: post.newsSourceInfo?.articleUrl
        },
        post
      };
    } else {
      const qItem = item as Omit<ContentQueueItem, 'id' | 'createdAt' | 'updatedAt'>;
      newQueueItem = {
        ...qItem,
        id,
        createdAt: now,
        updatedAt: now
      };
    }

    setContentQueue(prev => [newQueueItem, ...prev]);
    return newQueueItem;
  };

  const handleUpdateQueueStatus = (id: string, status: QueueItemStatus) => {
    setContentQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
    ));
  };

  const handleUpdateQueuePriority = (id: string, priority: QueueItemPriority) => {
    setContentQueue(prev => prev.map(item => 
      item.id === id ? { ...item, priority, updatedAt: new Date().toISOString() } : item
    ));
  };

  const handleRescheduleQueueItem = (id: string, newScheduledAt: string, newPriority?: QueueItemPriority) => {
    setContentQueue(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        scheduledAt: newScheduledAt, 
        ...(newPriority ? { priority: newPriority } : {}),
        status: 'scheduled',
        updatedAt: new Date().toISOString() 
      } : item
    ));
    setInAppAlert({
      title: 'Post Rescheduled',
      message: `Updated schedule time to ${new Date(newScheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`
    });
    setTimeout(() => setInAppAlert(null), 3000);
  };

  const handleDeleteQueueItem = (id: string) => {
    setContentQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleDuplicateQueueItem = (id: string) => {
    const item = contentQueue.find(q => q.id === id);
    if (!item) return;
    const duplicated: ContentQueueItem = {
      ...item,
      id: `queue-${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setContentQueue(prev => [duplicated, ...prev]);
    setInAppAlert({
      title: 'Post Duplicated',
      message: `Duplicated "${item.title.slice(0, 20)}..." in Queue.`
    });
    setTimeout(() => setInAppAlert(null), 2500);
  };

  const handleShareFromQueue = (item: ContentQueueItem) => {
    // Convert ContentQueueItem to SocialPost and trigger manual cross-posting session
    const postToShare: SocialPost = item.post || {
      id: item.postId || `queue-post-${item.id}`,
      title: item.title,
      caption: item.caption,
      description: item.description || '',
      hashtags: item.hashtags,
      callToAction: item.callToAction,
      media: item.media,
      selectedPlatforms: item.selectedPlatforms,
      selectedDestinationIds: item.selectedDestinationIds,
      selectedGroupId: item.selectedGroupId,
      scheduledAt: item.scheduledAt,
      createdAt: item.createdAt,
      platformOverrides: item.platformOverrides,
      platformStatuses: {}
    };

    // Mark as publishing
    handleUpdateQueueStatus(item.id, 'publishing');
    setConfirmingPost(postToShare);
  };

  const handleEditQueueItem = (item: ContentQueueItem) => {
    const postToEdit: SocialPost = item.post || {
      id: item.postId || `queue-post-${item.id}`,
      title: item.title,
      caption: item.caption,
      description: item.description || '',
      hashtags: item.hashtags,
      callToAction: item.callToAction,
      media: item.media,
      selectedPlatforms: item.selectedPlatforms,
      selectedDestinationIds: item.selectedDestinationIds,
      selectedGroupId: item.selectedGroupId,
      scheduledAt: item.scheduledAt,
      createdAt: item.createdAt,
      platformOverrides: item.platformOverrides,
      platformStatuses: {}
    };
    setEditingDraft(postToEdit);
    setConfirmingPost(null);
    setActiveTab('create');
  };

  // User proceeds to share confirmation screen
  const handleShareNowFromCreate = (post: SocialPost) => {
    if (post.scheduledAt) {
      // Add scheduled post to Content Queue data structure
      const queueItem: ContentQueueItem = {
        id: `queue-${Date.now()}`,
        postId: post.id,
        title: post.title,
        caption: post.caption,
        description: post.description,
        hashtags: post.hashtags,
        callToAction: post.callToAction,
        media: post.media,
        selectedPlatforms: post.selectedPlatforms,
        selectedDestinationIds: post.selectedDestinationIds,
        selectedGroupId: post.selectedGroupId,
        scheduledAt: post.scheduledAt,
        status: 'scheduled',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        platformOverrides: post.platformOverrides,
        metadata: {
          source: post.newsSourceInfo ? 'news_hunter' : 'manual',
          newsSourceTitle: post.newsSourceInfo?.articleTitle,
          newsSourceUrl: post.newsSourceInfo?.articleUrl
        },
        post
      };

      setContentQueue(prev => [queueItem, ...prev]);
      setEditingDraft(null);
      setInAppAlert({
        title: 'Post Scheduled & Queued',
        message: `"${post.title || post.caption.slice(0, 25)}..." added to Content Queue for ${new Date(post.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.`
      });
      setTimeout(() => setInAppAlert(null), 3500);
      setActiveTab('queue');
      return;
    }

    setConfirmingPost(post);
  };

  // User saves draft
  const handleSaveDraft = (draft: SocialPost) => {
    setDrafts(prev => {
      const filtered = prev.filter(d => d.id !== draft.id);
      return [draft, ...filtered];
    });
    setEditingDraft(null);
    setInAppAlert({
      title: 'Draft Saved',
      message: `Post "${draft.title || draft.caption.slice(0, 25)}..." saved to Drafts.`
    });
    setTimeout(() => setInAppAlert(null), 3000);
    setActiveTab('drafts');
  };

  // Edit draft
  const handleEditDraft = (draft: SocialPost) => {
    setEditingDraft(draft);
    setConfirmingPost(null);
    setActiveTab('create');
  };

  // Delete draft
  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  // Re-share from history
  const handleReShare = (post: SocialPost) => {
    const freshPost: SocialPost = {
      ...post,
      id: `reshare-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setConfirmingPost(freshPost);
  };

  // Duplicate from history to create new post (Requirement #13)
  const handleDuplicateHistory = (post: SocialPost) => {
    const duplicatedPost: SocialPost = {
      ...post,
      id: `copy-${Date.now()}`,
      createdAt: new Date().toISOString(),
      scheduledAt: undefined,
      platformStatuses: {}
    };
    setEditingDraft(duplicatedPost);
    setConfirmingPost(null);
    setActiveTab('create');
  };

  // Delete history item
  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  // Post completed from confirmation screen
  const handlePostCompleted = (completedPost: SocialPost) => {
    // Record into History without duplicates (Requirement #7 & #10)
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== completedPost.id);
      return [completedPost, ...filtered];
    });

    // Mark corresponding queue item as published if present
    setContentQueue(prev => prev.map(item => {
      if (item.postId === completedPost.id || item.id === completedPost.id) {
        return {
          ...item,
          status: 'published',
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    // NOTE (Requirement #10): Preserve the original draft when sharing from a draft! Do NOT delete it automatically!
    clearActiveShareSession();
    setActiveSession(null);
    setConfirmingPost(null);
    setActiveTab('history');
  };


  // Media selected from Google Drive modal
  const handleSelectDriveMedia = (media: MediaItem) => {
    if (editingDraft) {
      setEditingDraft({ ...editingDraft, media });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex justify-center selection:bg-indigo-500 selection:text-white">
      {/* Mobile Frame Container (Max width typical for Android phone screens) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white dark:bg-slate-950 shadow-2xl relative">
        
        {/* Top Android Status Bar emulation */}
        <header className="px-5 pt-3 pb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 font-bold tracking-tight text-slate-800 dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Social Share Scheduler</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span>{settings.timezone.replace('Asia/', '')}</span>
          </div>
        </header>

        {/* In-app Toast / Notification Alert */}
        {inAppAlert && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-bounce">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">{inAppAlert.title}</div>
              <div className="text-[11px] opacity-80 truncate">{inAppAlert.message}</div>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 px-4 pt-4 pb-20 overflow-y-auto">
          {/* Active Share Session Banner if saved session exists and not currently in Share Center */}
          {activeSession && !confirmingPost && (
            <div className="mb-3.5 p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Active Share Session in Progress</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {activeSession.destinations.filter(d => d.status === 'Completed').length} of {activeSession.destinations.length} destinations completed
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    clearActiveShareSession();
                    setActiveSession(null);
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingPost(activeSession.post)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1"
                >
                  <span>Resume</span>
                  <Share2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {confirmingPost ? (
            <ShareConfirmationScreen
              post={confirmingPost}
              onBack={() => setConfirmingPost(null)}
              onPostCompleted={handlePostCompleted}
              userAccounts={userAccounts}
              socialGroups={socialGroups}
              isFromDraft={Boolean(confirmingPost.isDraft)}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  onCreatePost={handleStartCreate}
                  onSelectTab={setActiveTab}
                  onOpenDriveModal={() => setIsDriveModalOpen(true)}
                  history={history}
                  drafts={drafts}
                  queueCount={contentQueue.filter(q => q.status === 'scheduled' || q.status === 'queued').length}
                  isDriveConnected={drive.isConnected}
                  driveUserEmail={drive.userEmail}
                  isExpoGoMode={settings.isExpoGoMode}
                />
              )}

              {activeTab === 'news' && (
                <NewsHunterScreen
                  onCreatePostWithNews={handleCreatePostWithNews}
                  onSaveDraftDirectly={handleSaveDraft}
                  onOpenSettings={() => setActiveTab('settings')}
                  onStoryCountChange={(count) => setNewStoriesCount(count)}
                />
              )}

              {activeTab === 'create' && (
                <CreatePostScreen
                  key={editingDraft?.id || selectedGroupIdForCreate || 'new-create-post'}
                  initialPost={editingDraft}
                  initialGroupId={selectedGroupIdForCreate}
                  onShareNow={handleShareNowFromCreate}
                  onSaveDraft={handleSaveDraft}
                  onOpenDriveModal={() => setIsDriveModalOpen(true)}
                  isDriveConnected={drive.isConnected}
                  isExpoGoMode={settings.isExpoGoMode}
                  userAccounts={userAccounts}
                  socialGroups={socialGroups}
                />
              )}

              {activeTab === 'queue' && (
                <QueueScreen
                  queue={contentQueue}
                  onShareItem={handleShareFromQueue}
                  onEditItem={handleEditQueueItem}
                  onDeleteItem={handleDeleteQueueItem}
                  onUpdateStatus={handleUpdateQueueStatus}
                  onUpdatePriority={handleUpdateQueuePriority}
                  onRescheduleItem={handleRescheduleQueueItem}
                  onDuplicateItem={handleDuplicateQueueItem}
                  onCreateNewScheduled={handleStartCreate}
                  userAccounts={userAccounts}
                  socialGroups={socialGroups}
                />
              )}

              {activeTab === 'drafts' && (
                <DraftsScreen
                  drafts={drafts}
                  onEditDraft={handleEditDraft}
                  onDeleteDraft={handleDeleteDraft}
                  onShareDraft={(draft) => setConfirmingPost({ ...draft, isDraft: true })}
                  onCreateNew={handleStartCreate}
                  userAccounts={userAccounts}
                  socialGroups={socialGroups}
                />
              )}


              {activeTab === 'history' && (
                <HistoryScreen
                  history={history}
                  onReShare={handleReShare}
                  onDelete={handleDeleteHistory}
                  onCreateNew={handleStartCreate}
                  onDuplicate={handleDuplicateHistory}
                  userAccounts={userAccounts}
                  socialGroups={socialGroups}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  userAccounts={userAccounts}
                  onUpdateUserAccounts={handleUpdateUserAccounts}
                  socialGroups={socialGroups}
                  onCreateGroup={handleCreateGroup}
                  onUpdateGroup={handleUpdateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onDuplicateGroup={handleDuplicateGroup}
                  onSelectGroupForPost={handleSelectGroupForPost}
                  isDriveConnected={drive.isConnected}
                  driveEmail={drive.userEmail}
                  onConnectDrive={drive.connectDrive}
                  onDisconnectDrive={drive.disconnectDrive}
                  drafts={drafts}
                  history={history}
                  onReloadAllData={handleReloadAllData}
                />
              )}
            </>
          )}
        </main>

        {/* Google Drive Media Picker Modal */}
        <GoogleDriveModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          onSelectMedia={handleSelectDriveMedia}
          isConnected={drive.isConnected}
          userEmail={drive.userEmail}
          onConnect={drive.connectDrive}
          files={drive.files}
          isLoading={drive.isLoading}
        />

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setConfirmingPost(null);
            setActiveTab(tab);
          }}
          draftsCount={drafts.length}
          newStoriesCount={newStoriesCount}
          queueCount={contentQueue.filter(q => q.status === 'scheduled' || q.status === 'queued').length}
        />

      </div>
    </div>
  );
}
