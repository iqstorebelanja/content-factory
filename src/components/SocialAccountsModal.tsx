import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  Plus, 
  Globe, 
  User, 
  Phone, 
  Save,
  AlertCircle,
  Copy,
  Power
} from 'lucide-react';
import { 
  UserSocialAccounts, 
  PlatformId,
  AccountConnectionStatus,
  FacebookPageAccount,
  FacebookProfileAccount,
  InstagramAccount,
  TikTokAccount,
  YouTubeChannelAccount,
  TwitterAccount,
  ThreadsAccount
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  SAMPLE_DEMO_ACCOUNTS, 
  sanitizeUrl, 
  generateAccountId,
  normalizeUserAccounts,
  validatePlatformUrl,
  extractHandleFromUrl
} from '../utils/socialAccounts';
import { usePlanContext } from '../contexts/PlanContext';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserSocialAccounts;
  onSave: (newAccounts: UserSocialAccounts) => void;
  initialFocusPlatform?: PlatformId | null;
  initialEditAccountId?: string | null;
}

type PlatformTab = 'all' | 'facebook_page' | 'facebook_profile' | 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'threads';

const CONNECTION_STATUS_OPTIONS: AccountConnectionStatus[] = [
  'Ready for Manual Share',
  'Saved Profile Link',
  'Manual Share',
  'Not Connected'
];

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSave,
  initialFocusPlatform,
  initialEditAccountId
}) => {
  const { canUseFeature, openUpgradeModal } = usePlanContext();
  const [formData, setFormData] = useState<UserSocialAccounts>(() => normalizeUserAccounts(accounts));
  const [activeTab, setActiveTab] = useState<PlatformTab>(
    (initialFocusPlatform as PlatformTab) || 'all'
  );
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [addingForPlatform, setAddingForPlatform] = useState<PlatformId | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Temp draft states for add/edit form
  const [fbDraft, setFbDraft] = useState({
    pageName: '',
    pageId: '',
    pageUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [fbProfDraft, setFbProfDraft] = useState({
    profileName: '',
    profileId: '',
    profileUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [igDraft, setIgDraft] = useState({
    displayName: '',
    username: '',
    profileUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [ttDraft, setTtDraft] = useState({
    displayName: '',
    username: '',
    profileUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [ytDraft, setYtDraft] = useState({
    channelName: '',
    channelId: '',
    channelUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [twDraft, setTwDraft] = useState({
    displayName: '',
    username: '',
    profileUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [thDraft, setThDraft] = useState({
    displayName: '',
    username: '',
    profileUrl: '',
    notes: '',
    connectionStatus: 'Ready for Manual Share' as AccountConnectionStatus
  });
  const [formError, setFormError] = useState<string | null>(null);

  const updateAndPersist = (updater: (prev: UserSocialAccounts) => UserSocialAccounts) => {
    const next = updater(formData);
    setFormData(next);
    onSave(next);
  };

  useEffect(() => {
    if (isOpen) {
      const normalized = normalizeUserAccounts(accounts);
      setFormData(normalized);
      setFormError(null);

      if (initialFocusPlatform) {
        if (initialFocusPlatform === 'facebook_page' || initialFocusPlatform === 'facebook_profile') {
          setActiveTab('facebook_page');
        } else {
          setActiveTab(initialFocusPlatform as PlatformTab);
        }
      } else {
        setActiveTab('all');
      }

      if (initialEditAccountId) {
        setAddingForPlatform(null);
        setEditingAccountId(initialEditAccountId);
        const fbPage = normalized.facebook_page.find(i => i.id === initialEditAccountId);
        if (fbPage) {
          setFbDraft({
            pageName: fbPage.pageName,
            pageId: fbPage.pageId || '',
            pageUrl: fbPage.isExamplePlaceholder ? '' : fbPage.pageUrl,
            notes: fbPage.notes || '',
            connectionStatus: fbPage.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const fbProf = normalized.facebook_profile.find(i => i.id === initialEditAccountId);
        if (fbProf) {
          setFbProfDraft({
            profileName: fbProf.profileName,
            profileId: fbProf.profileId || '',
            profileUrl: fbProf.isExamplePlaceholder ? '' : fbProf.profileUrl,
            notes: fbProf.notes || '',
            connectionStatus: fbProf.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const ig = normalized.instagram.find(i => i.id === initialEditAccountId);
        if (ig) {
          setIgDraft({
            displayName: ig.displayName || '',
            username: ig.username,
            profileUrl: ig.isExamplePlaceholder ? '' : ig.profileUrl,
            notes: ig.notes || '',
            connectionStatus: ig.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const tt = normalized.tiktok.find(i => i.id === initialEditAccountId);
        if (tt) {
          setTtDraft({
            displayName: tt.displayName || '',
            username: tt.username,
            profileUrl: tt.isExamplePlaceholder ? '' : tt.profileUrl,
            notes: tt.notes || '',
            connectionStatus: tt.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const yt = normalized.youtube.find(i => i.id === initialEditAccountId);
        if (yt) {
          setYtDraft({
            channelName: yt.channelName,
            channelId: yt.channelId || '',
            channelUrl: yt.isExamplePlaceholder ? '' : yt.channelUrl,
            notes: yt.notes || '',
            connectionStatus: yt.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const tw = normalized.twitter.find(i => i.id === initialEditAccountId);
        if (tw) {
          setTwDraft({
            displayName: tw.displayName || '',
            username: tw.username,
            profileUrl: tw.isExamplePlaceholder ? '' : tw.profileUrl,
            notes: tw.notes || '',
            connectionStatus: tw.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
        const th = (normalized.threads || []).find(i => i.id === initialEditAccountId);
        if (th) {
          setThDraft({
            displayName: th.displayName || '',
            username: th.username,
            profileUrl: th.isExamplePlaceholder ? '' : th.profileUrl,
            notes: th.notes || '',
            connectionStatus: th.connectionStatus || 'Ready for Manual Share'
          });
          return;
        }
      } else if (initialFocusPlatform) {
        setEditingAccountId(null);
        setAddingForPlatform(initialFocusPlatform);
      } else {
        setEditingAccountId(null);
        setAddingForPlatform(null);
      }
    }
  }, [isOpen, initialFocusPlatform, initialEditAccountId]);

  if (!isOpen) return null;

  const handleSaveModal = () => {
    onSave(formData);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 350);
  };

  const handleFillDemo = () => {
    try {
      localStorage.removeItem('sss_accounts_cleared_by_user');
    } catch {}
    setFormData(SAMPLE_DEMO_ACCOUNTS);
    onSave(SAMPLE_DEMO_ACCOUNTS);
    setEditingAccountId(null);
    setAddingForPlatform(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all configured accounts?')) {
      try {
        localStorage.setItem('sss_accounts_cleared_by_user', 'true');
      } catch {}
      const empty: UserSocialAccounts = {
        facebook_page: [],
        facebook_profile: [],
        instagram: [],
        tiktok: [],
        youtube: [],
        twitter: [],
        threads: []
      };
      setFormData(empty);
      onSave(empty);
      setEditingAccountId(null);
      setAddingForPlatform(null);
    }
  };

  // --- Handlers for Facebook Pages ---
  const checkCanAddAccount = (pId: PlatformId): boolean => {
    const list = (formData[pId] || []) as any[];
    const nonExampleCount = list.filter(item => !item.isExamplePlaceholder).length;
    const check = canUseFeature('accounts_per_platform', nonExampleCount);
    if (!check.allowed) {
      openUpgradeModal('Social Accounts', check.reason || 'Account limit reached for this platform on your plan.');
      return false;
    }
    return true;
  };

  const startAddFacebook = () => {
    if (!checkCanAddAccount('facebook_page')) return;
    setFbDraft({ pageName: '', pageId: '', pageUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('facebook_page');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditFacebook = (item: FacebookPageAccount) => {
    setFbDraft({
      pageName: item.pageName,
      pageId: item.pageId || '',
      pageUrl: item.isExamplePlaceholder ? '' : item.pageUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveFacebookItem = () => {
    const validation = validatePlatformUrl('facebook_page', fbDraft.pageUrl, fbDraft.pageId || fbDraft.pageName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid Facebook Page URL');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const cleanName = fbDraft.pageName.trim() || extracted || 'Facebook Page';

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        facebook_page: prev.facebook_page.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                pageName: cleanName,
                pageId: fbDraft.pageId.trim() || extracted || undefined,
                pageUrl: cleanUrl,
                notes: fbDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: FacebookPageAccount = {
        id: generateAccountId('fb'),
        pageName: cleanName,
        pageId: fbDraft.pageId.trim() || extracted || undefined,
        pageUrl: cleanUrl,
        notes: fbDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        facebook_page: [...prev.facebook_page, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateFacebookItem = (item: FacebookPageAccount) => {
    if (!checkCanAddAccount('facebook_page')) return;
    const copy: FacebookPageAccount = {
      ...item,
      id: generateAccountId('fb'),
      pageName: `${item.pageName} (Copy)`,
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      facebook_page: [...prev.facebook_page, copy]
    }));
  };

  const toggleFacebookItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      facebook_page: prev.facebook_page.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteFacebookItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      facebook_page: prev.facebook_page.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Facebook Personal Profiles ---
  const startAddFacebookProfile = () => {
    if (!checkCanAddAccount('facebook_profile')) return;
    setFbProfDraft({ profileName: '', profileId: '', profileUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('facebook_profile');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditFacebookProfile = (item: FacebookProfileAccount) => {
    setFbProfDraft({
      profileName: item.profileName,
      profileId: item.profileId || '',
      profileUrl: item.isExamplePlaceholder ? '' : item.profileUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveFacebookProfileItem = () => {
    const validation = validatePlatformUrl('facebook_profile', fbProfDraft.profileUrl, fbProfDraft.profileId || fbProfDraft.profileName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid Facebook Profile URL');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const cleanName = fbProfDraft.profileName.trim() || extracted || 'Personal Profile';

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        facebook_profile: prev.facebook_profile.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                profileName: cleanName,
                profileId: fbProfDraft.profileId.trim() || extracted || undefined,
                profileUrl: cleanUrl,
                notes: fbProfDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: FacebookProfileAccount = {
        id: generateAccountId('fb_prof'),
        profileName: cleanName,
        profileId: fbProfDraft.profileId.trim() || extracted || undefined,
        profileUrl: cleanUrl,
        notes: fbProfDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        facebook_profile: [...prev.facebook_profile, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateFacebookProfileItem = (item: FacebookProfileAccount) => {
    if (!checkCanAddAccount('facebook_profile')) return;
    const copy: FacebookProfileAccount = {
      ...item,
      id: generateAccountId('fb_prof'),
      profileName: `${item.profileName} (Copy)`,
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      facebook_profile: [...prev.facebook_profile, copy]
    }));
  };

  const toggleFacebookProfileItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      facebook_profile: prev.facebook_profile.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteFacebookProfileItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      facebook_profile: prev.facebook_profile.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Instagram ---
  const startAddInstagram = () => {
    if (!checkCanAddAccount('instagram')) return;
    setIgDraft({ displayName: '', username: '', profileUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('instagram');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditInstagram = (item: InstagramAccount) => {
    setIgDraft({
      displayName: item.displayName || '',
      username: item.username,
      profileUrl: item.isExamplePlaceholder ? '' : item.profileUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveInstagramItem = () => {
    const validation = validatePlatformUrl('instagram', igDraft.profileUrl, igDraft.username || igDraft.displayName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid Instagram URL or Username');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const typedUser = igDraft.username.replace(/^@/, '').trim();
    const cleanUser = (typedUser && typedUser !== 'your-account') ? typedUser : (extracted || typedUser || 'instagram');

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        instagram: prev.instagram.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                displayName: igDraft.displayName.trim() || undefined,
                username: cleanUser,
                profileUrl: cleanUrl,
                notes: igDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: InstagramAccount = {
        id: generateAccountId('ig'),
        displayName: igDraft.displayName.trim() || undefined,
        username: cleanUser,
        profileUrl: cleanUrl,
        notes: igDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        instagram: [...prev.instagram, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateInstagramItem = (item: InstagramAccount) => {
    if (!checkCanAddAccount('instagram')) return;
    const copy: InstagramAccount = {
      ...item,
      id: generateAccountId('ig'),
      displayName: item.displayName ? `${item.displayName} (Copy)` : undefined,
      username: item.username ? `${item.username}_copy` : 'instagram_copy',
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      instagram: [...prev.instagram, copy]
    }));
  };

  const toggleInstagramItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      instagram: prev.instagram.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteInstagramItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      instagram: prev.instagram.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for TikTok ---
  const startAddTikTok = () => {
    if (!checkCanAddAccount('tiktok')) return;
    setTtDraft({ displayName: '', username: '', profileUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('tiktok');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditTikTok = (item: TikTokAccount) => {
    setTtDraft({
      displayName: item.displayName || '',
      username: item.username,
      profileUrl: item.isExamplePlaceholder ? '' : item.profileUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveTikTokItem = () => {
    const validation = validatePlatformUrl('tiktok', ttDraft.profileUrl, ttDraft.username || ttDraft.displayName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid TikTok URL or Username');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const typedUser = ttDraft.username.replace(/^@/, '').trim();
    const cleanUser = (typedUser && typedUser !== 'your-account') ? typedUser : (extracted || typedUser || 'tiktok');

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        tiktok: prev.tiktok.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                displayName: ttDraft.displayName.trim() || undefined,
                username: cleanUser,
                profileUrl: cleanUrl,
                notes: ttDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: TikTokAccount = {
        id: generateAccountId('tt'),
        displayName: ttDraft.displayName.trim() || undefined,
        username: cleanUser,
        profileUrl: cleanUrl,
        notes: ttDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        tiktok: [...prev.tiktok, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateTikTokItem = (item: TikTokAccount) => {
    if (!checkCanAddAccount('tiktok')) return;
    const copy: TikTokAccount = {
      ...item,
      id: generateAccountId('tt'),
      displayName: item.displayName ? `${item.displayName} (Copy)` : undefined,
      username: item.username ? `${item.username}_copy` : 'tiktok_copy',
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      tiktok: [...prev.tiktok, copy]
    }));
  };

  const toggleTikTokItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      tiktok: prev.tiktok.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteTikTokItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      tiktok: prev.tiktok.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for YouTube ---
  const startAddYouTube = () => {
    if (!checkCanAddAccount('youtube')) return;
    setYtDraft({ channelName: '', channelId: '', channelUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('youtube');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditYouTube = (item: YouTubeChannelAccount) => {
    setYtDraft({
      channelName: item.channelName,
      channelId: item.channelId || '',
      channelUrl: item.isExamplePlaceholder ? '' : item.channelUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveYouTubeItem = () => {
    const validation = validatePlatformUrl('youtube', ytDraft.channelUrl, ytDraft.channelId || ytDraft.channelName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid YouTube Channel URL');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const cleanName = ytDraft.channelName.trim() || extracted || 'YouTube Channel';

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        youtube: prev.youtube.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                channelName: cleanName,
                channelId: ytDraft.channelId.trim() || (extracted ? `@${extracted}` : undefined),
                channelUrl: cleanUrl,
                notes: ytDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: YouTubeChannelAccount = {
        id: generateAccountId('yt'),
        channelName: cleanName,
        channelId: ytDraft.channelId.trim() || (extracted ? `@${extracted}` : undefined),
        channelUrl: cleanUrl,
        notes: ytDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        youtube: [...prev.youtube, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateYouTubeItem = (item: YouTubeChannelAccount) => {
    if (!checkCanAddAccount('youtube')) return;
    const copy: YouTubeChannelAccount = {
      ...item,
      id: generateAccountId('yt'),
      channelName: `${item.channelName} (Copy)`,
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      youtube: [...prev.youtube, copy]
    }));
  };

  const toggleYouTubeItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      youtube: prev.youtube.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteYouTubeItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      youtube: prev.youtube.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Twitter / X ---
  const startAddTwitter = () => {
    if (!checkCanAddAccount('twitter')) return;
    setTwDraft({ displayName: '', username: '', profileUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('twitter');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditTwitter = (item: TwitterAccount) => {
    setTwDraft({
      displayName: item.displayName || '',
      username: item.username,
      profileUrl: item.isExamplePlaceholder ? '' : item.profileUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveTwitterItem = () => {
    const validation = validatePlatformUrl('twitter', twDraft.profileUrl, twDraft.username || twDraft.displayName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid X Profile URL or Username');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const typedUser = twDraft.username.replace(/^@/, '').trim();
    const cleanUser = (typedUser && typedUser !== 'your-account') ? typedUser : (extracted || typedUser || 'x_account');

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        twitter: prev.twitter.map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                displayName: twDraft.displayName.trim() || undefined,
                username: cleanUser,
                profileUrl: cleanUrl,
                notes: twDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: TwitterAccount = {
        id: generateAccountId('x'),
        displayName: twDraft.displayName.trim() || undefined,
        username: cleanUser,
        profileUrl: cleanUrl,
        notes: twDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        twitter: [...prev.twitter, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateTwitterItem = (item: TwitterAccount) => {
    if (!checkCanAddAccount('twitter')) return;
    const copy: TwitterAccount = {
      ...item,
      id: generateAccountId('x'),
      displayName: item.displayName ? `${item.displayName} (Copy)` : undefined,
      username: item.username ? `${item.username}_copy` : 'x_copy',
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      twitter: [...prev.twitter, copy]
    }));
  };

  const toggleTwitterItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      twitter: prev.twitter.map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteTwitterItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      twitter: prev.twitter.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Threads ---
  const startAddThreads = () => {
    if (!checkCanAddAccount('threads')) return;
    setThDraft({ displayName: '', username: '', profileUrl: '', notes: '', connectionStatus: 'Ready for Manual Share' });
    setAddingForPlatform('threads');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditThreads = (item: ThreadsAccount) => {
    setThDraft({
      displayName: item.displayName || '',
      username: item.username,
      profileUrl: item.isExamplePlaceholder ? '' : item.profileUrl,
      notes: item.notes || '',
      connectionStatus: item.connectionStatus || 'Ready for Manual Share'
    });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveThreadsItem = () => {
    const validation = validatePlatformUrl('threads', thDraft.profileUrl, thDraft.username || thDraft.displayName);
    if (!validation.valid) {
      setFormError(validation.error || 'Please enter a valid Threads Profile URL (https://threads.com/@jhon.doe)');
      return;
    }
    const cleanUrl = validation.sanitizedUrl;
    const extracted = extractHandleFromUrl(cleanUrl);
    const typedUser = thDraft.username.replace(/^@/, '').trim();
    const cleanUser = (typedUser && typedUser !== 'your-account') ? typedUser : (extracted || typedUser || 'threads_account');

    if (editingAccountId) {
      updateAndPersist(prev => ({
        ...prev,
        threads: (prev.threads || []).map(item => 
          item.id === editingAccountId 
            ? {
                ...item,
                displayName: thDraft.displayName.trim() || undefined,
                username: cleanUser,
                profileUrl: cleanUrl,
                notes: thDraft.notes.trim() || undefined,
                connectionStatus: 'Ready for Manual Share',
                isExamplePlaceholder: false
              }
            : item
        )
      }));
    } else {
      const newItem: ThreadsAccount = {
        id: generateAccountId('th'),
        displayName: thDraft.displayName.trim() || undefined,
        username: cleanUser,
        profileUrl: cleanUrl,
        notes: thDraft.notes.trim() || undefined,
        enabled: true,
        connectionStatus: 'Ready for Manual Share',
        isExamplePlaceholder: false
      };
      updateAndPersist(prev => ({
        ...prev,
        threads: [...(prev.threads || []), newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const duplicateThreadsItem = (item: ThreadsAccount) => {
    if (!checkCanAddAccount('threads')) return;
    const copy: ThreadsAccount = {
      ...item,
      id: generateAccountId('th'),
      displayName: item.displayName ? `${item.displayName} (Copy)` : undefined,
      username: item.username ? `${item.username}_copy` : 'threads_copy',
      isExamplePlaceholder: false
    };
    updateAndPersist(prev => ({
      ...prev,
      threads: [...(prev.threads || []), copy]
    }));
  };

  const toggleThreadsItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      threads: (prev.threads || []).map(i => i.id === id ? { ...i, enabled: i.enabled === false ? true : false } : i)
    }));
  };

  const deleteThreadsItem = (id: string) => {
    updateAndPersist(prev => ({
      ...prev,
      threads: (prev.threads || []).filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  const handleDirectCardUrlUpdate = (platformId: PlatformId, accountId: string, newUrlValue: string) => {
    const trimmed = newUrlValue.trim();
    const extracted = extractHandleFromUrl(trimmed);
    updateAndPersist(prev => {
      if (platformId === 'facebook_page') {
        return {
          ...prev,
          facebook_page: prev.facebook_page.map(i =>
            i.id === accountId
              ? { ...i, pageUrl: trimmed, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'facebook_profile') {
        return {
          ...prev,
          facebook_profile: (prev.facebook_profile || []).map(i =>
            i.id === accountId
              ? { ...i, profileUrl: trimmed, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'instagram') {
        return {
          ...prev,
          instagram: prev.instagram.map(i =>
            i.id === accountId
              ? { ...i, profileUrl: trimmed, username: extracted || i.username, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'tiktok') {
        return {
          ...prev,
          tiktok: prev.tiktok.map(i =>
            i.id === accountId
              ? { ...i, profileUrl: trimmed, username: extracted || i.username, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'youtube') {
        return {
          ...prev,
          youtube: prev.youtube.map(i =>
            i.id === accountId
              ? { ...i, channelUrl: trimmed, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'twitter') {
        return {
          ...prev,
          twitter: prev.twitter.map(i =>
            i.id === accountId
              ? { ...i, profileUrl: trimmed, username: extracted || i.username, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      if (platformId === 'threads') {
        return {
          ...prev,
          threads: (prev.threads || []).map(i =>
            i.id === accountId
              ? { ...i, profileUrl: trimmed, username: extracted || i.username, isExamplePlaceholder: !trimmed, connectionStatus: 'Ready for Manual Share' }
              : i
          )
        };
      }
      return prev;
    });
  };

  const cancelEdit = () => {
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const openTestLink = (url?: string) => {
    if (!url) return;
    window.open(sanitizeUrl(url), '_blank', 'noopener,noreferrer');
  };

  const totalConfigured = 
    formData.facebook_page.length +
    (formData.facebook_profile?.length || 0) +
    formData.instagram.length +
    formData.tiktok.length +
    formData.youtube.length +
    formData.twitter.length +
    (formData.threads?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Social Media Accounts Manager
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {totalConfigured} configured
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure multiple pages, channels, and accounts per platform. Stored locally.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action ribbon */}
        <div className="px-4 sm:px-5 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-300 text-[11px]">
            Add unlimited destinations for 1-tap manual cross-posting:
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Sample Accounts</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Platform filter tabs */}
        <div className="flex gap-1 p-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Platforms ({totalConfigured})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facebook_page')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'facebook_page' || activeTab === 'facebook_profile'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>Facebook (Pages & Profiles)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.facebook_page.length + (formData.facebook_profile?.length || 0)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instagram')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'instagram'
                ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>Instagram</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.instagram.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiktok')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'tiktok'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>TikTok</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.tiktok.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'youtube'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>YouTube</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.youtube.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('twitter')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'twitter'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>X</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.twitter.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('threads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'threads'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>Threads</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.threads?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Body: Scrollable Accounts List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-6">
          {formError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. FACEBOOK UNIFIED SECTION */}
          {(activeTab === 'all' || activeTab === 'facebook_page' || activeTab === 'facebook_profile') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Main FACEBOOK Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    f
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold tracking-wide text-slate-900 dark:text-white uppercase">
                        FACEBOOK
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                        {formData.facebook_page.length + (formData.facebook_profile?.length || 0)} Total
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Manual Sharing Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supports multiple Facebook Pages and Facebook Personal Profiles
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{formData.facebook_page.length} {formData.facebook_page.length === 1 ? 'Page' : 'Pages'}</span>
                  <span className="mx-1.5">•</span>
                  <span>{formData.facebook_profile?.length || 0} {formData.facebook_profile?.length === 1 ? 'Personal Profile' : 'Personal Profiles'}</span>
                </div>
              </div>

              {/* [Facebook Pages] Sub-Section */}
              <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        [Facebook Pages]
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        {formData.facebook_page.length} configured
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      For business and community pages (Page Post & Page Reel)
                    </span>
                  </div>

                  <button
                    id="btn-add-facebook-page"
                    type="button"
                    onClick={startAddFacebook}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Facebook Page</span>
                  </button>
                </div>

                {/* Add/Edit Form for Facebook Page */}
                {(addingForPlatform === 'facebook_page' || (editingAccountId && formData.facebook_page.some(i => i.id === editingAccountId))) && (
                  <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-slate-800/80 border border-blue-500/40 shadow-sm space-y-3 animate-fadeIn">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{editingAccountId ? 'Edit Facebook Page' : 'Add New Facebook Page'}</span>
                      </div>
                      <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Account / Page Name *
                        </label>
                        <input
                          type="text"
                          value={fbDraft.pageName}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, pageName: e.target.value }))}
                          placeholder="e.g. Example Facebook Page"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Account / Profile / Page URL *
                        </label>
                        <input
                          type="text"
                          value={fbDraft.pageUrl}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, pageUrl: e.target.value }))}
                          placeholder="https://facebook.com/jhon.doe"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Optional Identifier / Page ID
                        </label>
                        <input
                          type="text"
                          value={fbDraft.pageId || ''}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, pageId: e.target.value }))}
                          placeholder="Optional Page ID or handle"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Optional Notes
                        </label>
                        <input
                          type="text"
                          value={fbDraft.notes || ''}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Optional notes"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveFacebookItem}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingAccountId ? 'Update Page' : 'Save Page'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Facebook Pages */}
                {formData.facebook_page.length === 0 ? (
                  <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                    No Facebook Pages added yet. Tap "+ Add Facebook Page" to add your first page.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.facebook_page.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span>{item.pageName || 'Unnamed Page'}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              READY FOR MANUAL SHARE
                            </span>
                            {item.isExamplePlaceholder && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Sample
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <input
                              type="text"
                              value={item.isExamplePlaceholder ? '' : (item.pageUrl || '')}
                              onChange={(e) => handleDirectCardUrlUpdate('facebook_page', item.id, e.target.value)}
                              placeholder="https://facebook.com/jhon.doe"
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.pageUrl && (
                            <button
                              type="button"
                              onClick={() => openTestLink(item.pageUrl)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1"
                              title="Test Link"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditFacebook(item)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1"
                            title="Edit Page URL"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFacebookItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* [Facebook Personal Profiles] Sub-Section */}
              <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        [Facebook Personal Profiles]
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        {formData.facebook_profile?.length || 0} configured
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      For personal timelines and accounts (Profile Post & Profile Reel)
                    </span>
                  </div>

                  <button
                    id="btn-add-facebook-profile"
                    type="button"
                    onClick={startAddFacebookProfile}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Facebook Personal Profile</span>
                  </button>
                </div>

                {/* Add/Edit Facebook Profile Form */}
                {(addingForPlatform === 'facebook_profile' || (editingAccountId && formData.facebook_profile?.some(i => i.id === editingAccountId))) && (
                  <div className="p-3.5 bg-blue-50/40 dark:bg-slate-800/80 border border-blue-500/40 rounded-xl space-y-3 shadow-sm animate-fadeIn">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{editingAccountId ? 'Edit Facebook Personal Profile' : 'Add Facebook Personal Profile'}</span>
                      </div>
                      <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Account / Profile Name *
                        </label>
                        <input
                          type="text"
                          value={fbProfDraft.profileName}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, profileName: e.target.value }))}
                          placeholder="e.g. Example Facebook Profile"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Account / Profile / Page URL *
                        </label>
                        <input
                          type="text"
                          value={fbProfDraft.profileUrl}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                          placeholder="https://facebook.com/jhon.doe"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Optional Identifier / Profile Handle
                        </label>
                        <input
                          type="text"
                          value={fbProfDraft.profileId || ''}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, profileId: e.target.value }))}
                          placeholder="Optional identifier"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Optional Notes
                        </label>
                        <input
                          type="text"
                          value={fbProfDraft.notes || ''}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Optional notes"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveFacebookProfileItem}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingAccountId ? 'Update Profile' : 'Save Profile'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Facebook Profiles */}
                {(!formData.facebook_profile || formData.facebook_profile.length === 0) ? (
                  <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                    No Facebook Personal Profiles added yet. Tap "+ Add Facebook Personal Profile" to add your profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.facebook_profile.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span>{item.profileName || 'Personal Profile'}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                              Personal Profile
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              READY FOR MANUAL SHARE
                            </span>
                            {item.isExamplePlaceholder && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Sample
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <input
                              type="text"
                              value={item.isExamplePlaceholder ? '' : (item.profileUrl || '')}
                              onChange={(e) => handleDirectCardUrlUpdate('facebook_profile', item.id, e.target.value)}
                              placeholder="https://facebook.com/jhon.doe"
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.profileUrl && (
                            <button
                              type="button"
                              onClick={() => openTestLink(item.profileUrl)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1"
                              title="Test Link"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditFacebookProfile(item)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1"
                            title="Edit Profile URL"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFacebookProfileItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. INSTAGRAM SECTION */}
          {(activeTab === 'all' || activeTab === 'instagram') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    IG
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Instagram Accounts
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.instagram.length} Account{formData.instagram.length === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-instagram-account"
                  type="button"
                  onClick={startAddInstagram}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Instagram Account</span>
                </button>
              </div>

              {/* Add/Edit Form for Instagram */}
              {(addingForPlatform === 'instagram' || (editingAccountId && formData.instagram.some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-pink-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit Instagram Account' : 'Add New Instagram Account'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account Name / Display Name
                      </label>
                      <input
                        type="text"
                        value={igDraft.displayName || ''}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g. Example Instagram"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Profile / Page URL *
                      </label>
                      <input
                        type="text"
                        value={igDraft.profileUrl}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://instagram.com/jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Identifier / Username (without @)
                      </label>
                      <input
                        type="text"
                        value={igDraft.username}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. your-account"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        value={igDraft.notes || ''}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveInstagramItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Account' : 'Save Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of Instagram Accounts */}
              {formData.instagram.length === 0 ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No Instagram accounts added yet. Tap "+ Add Instagram Account" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.instagram.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{item.displayName ? `${item.displayName}${item.username ? ` (@${item.username.replace(/^@/, '')})` : ''}` : (item.username ? `@${item.username.replace(/^@/, '')}` : 'Example Instagram Account')}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            READY FOR MANUAL SHARE
                          </span>
                          {item.isExamplePlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Sample
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <input
                            type="text"
                            value={item.isExamplePlaceholder ? '' : (item.profileUrl || '')}
                            onChange={(e) => handleDirectCardUrlUpdate('instagram', item.id, e.target.value)}
                            placeholder="https://instagram.com/jhon.doe"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(item.profileUrl || item.username) && (
                          <button
                            type="button"
                            onClick={() => openTestLink(item.profileUrl || `https://instagram.com/${item.username}`)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-pink-200 dark:border-pink-900/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 flex items-center gap-1"
                            title="Test Link"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditInstagram(item)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors flex items-center gap-1"
                          title="Edit Account URL"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteInstagramItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. TIKTOK SECTION */}
          {(activeTab === 'all' || activeTab === 'tiktok') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    TT
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      TikTok Accounts
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.tiktok.length} Account{formData.tiktok.length === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-tiktok-account"
                  type="button"
                  onClick={startAddTikTok}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add TikTok Account</span>
                </button>
              </div>

              {/* Add/Edit Form for TikTok */}
              {(addingForPlatform === 'tiktok' || (editingAccountId && formData.tiktok.some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit TikTok Account' : 'Add New TikTok Account'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account Name / Display Name
                      </label>
                      <input
                        type="text"
                        value={ttDraft.displayName || ''}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g. Example TikTok"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Profile / Page URL *
                      </label>
                      <input
                        type="text"
                        value={ttDraft.profileUrl}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://tiktok.com/@jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Identifier / Username (without @)
                      </label>
                      <input
                        type="text"
                        value={ttDraft.username}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. your-account"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        value={ttDraft.notes || ''}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveTikTokItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Account' : 'Save Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of TikTok Accounts */}
              {formData.tiktok.length === 0 ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No TikTok accounts added yet. Tap "+ Add TikTok Account" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.tiktok.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{item.displayName ? `${item.displayName}${item.username ? ` (@${item.username.replace(/^@/, '')})` : ''}` : (item.username ? `@${item.username.replace(/^@/, '')}` : 'Example TikTok Account')}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            READY FOR MANUAL SHARE
                          </span>
                          {item.isExamplePlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Sample
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <input
                            type="text"
                            value={item.isExamplePlaceholder ? '' : (item.profileUrl || '')}
                            onChange={(e) => handleDirectCardUrlUpdate('tiktok', item.id, e.target.value)}
                            placeholder="https://tiktok.com/@jhon.doe"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(item.profileUrl || item.username) && (
                          <button
                            type="button"
                            onClick={() => openTestLink(item.profileUrl || `https://tiktok.com/@${item.username}`)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                            title="Test Link"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditTikTok(item)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                          title="Edit Account URL"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTikTokItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. YOUTUBE SECTION */}
          {(activeTab === 'all' || activeTab === 'youtube') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    YT
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      YouTube Channels
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.youtube.length} Channel{formData.youtube.length === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-youtube-channel"
                  type="button"
                  onClick={startAddYouTube}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add YouTube Channel</span>
                </button>
              </div>

              {/* Add/Edit Form for YouTube */}
              {(addingForPlatform === 'youtube' || (editingAccountId && formData.youtube.some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-red-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit YouTube Channel' : 'Add New YouTube Channel'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Channel Name *
                      </label>
                      <input
                        type="text"
                        value={ytDraft.channelName}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, channelName: e.target.value }))}
                        placeholder="e.g. Example YouTube Channel"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Profile / Page URL *
                      </label>
                      <input
                        type="text"
                        value={ytDraft.channelUrl}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, channelUrl: e.target.value }))}
                        placeholder="https://youtube.com/@jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Identifier / Channel Handle
                      </label>
                      <input
                        type="text"
                        value={ytDraft.channelId || ''}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, channelId: e.target.value }))}
                        placeholder="e.g. @your-channel"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        value={ytDraft.notes || ''}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveYouTubeItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Channel' : 'Save Channel'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of YouTube Channels */}
              {formData.youtube.length === 0 ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No YouTube channels added yet. Tap "+ Add YouTube Channel" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.youtube.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{item.channelName || 'YouTube Channel'}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            READY FOR MANUAL SHARE
                          </span>
                          {item.isExamplePlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Sample
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <input
                            type="text"
                            value={item.isExamplePlaceholder ? '' : (item.channelUrl || '')}
                            onChange={(e) => handleDirectCardUrlUpdate('youtube', item.id, e.target.value)}
                            placeholder="https://youtube.com/@jhon.doe"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.channelUrl && (
                          <button
                            type="button"
                            onClick={() => openTestLink(item.channelUrl)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                            title="Test Link"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditYouTube(item)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center gap-1"
                          title="Edit Channel URL"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteYouTubeItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. X / TWITTER SECTION */}
          {(activeTab === 'all' || activeTab === 'twitter') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    𝕏
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      X Accounts
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.twitter.length} Account{formData.twitter.length === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-x-account"
                  type="button"
                  onClick={startAddTwitter}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add X Account</span>
                </button>
              </div>

              {/* Add/Edit Form for X */}
              {(addingForPlatform === 'twitter' || (editingAccountId && formData.twitter.some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit X Account' : 'Add New X Account'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account Name / Display Name
                      </label>
                      <input
                        type="text"
                        value={twDraft.displayName || ''}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g. Example X Account"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Profile / Page URL *
                      </label>
                      <input
                        type="text"
                        value={twDraft.profileUrl}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://x.com/jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Identifier / Username (without @)
                      </label>
                      <input
                        type="text"
                        value={twDraft.username}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        value={twDraft.notes || ''}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveTwitterItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Account' : 'Save Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of X Accounts */}
              {formData.twitter.length === 0 ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No X accounts added yet. Tap "+ Add X Account" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.twitter.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{item.displayName ? `${item.displayName}${item.username ? ` (@${item.username.replace(/^@/, '')})` : ''}` : (item.username ? `@${item.username.replace(/^@/, '')}` : 'Example X Account')}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            READY FOR MANUAL SHARE
                          </span>
                          {item.isExamplePlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Sample
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5">
                          <input
                            type="text"
                            value={item.isExamplePlaceholder ? '' : (item.profileUrl || '')}
                            onChange={(e) => handleDirectCardUrlUpdate('twitter', item.id, e.target.value)}
                            placeholder="https://x.com/jhon.doe"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.profileUrl && !item.isExamplePlaceholder && (
                          <button
                            type="button"
                            onClick={() => openTestLink(item.profileUrl)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                            title="Test Link"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditTwitter(item)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                          title="Edit Account Details"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTwitterItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. THREADS SECTION */}
          {(activeTab === 'all' || activeTab === 'threads') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    @
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Threads Accounts
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.threads?.length || 0} Account{(formData.threads?.length || 0) === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-threads-account"
                  type="button"
                  onClick={startAddThreads}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-700 hover:bg-neutral-800 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Threads Account</span>
                </button>
              </div>

              {/* Add/Edit Form for Threads */}
              {(addingForPlatform === 'threads' || (editingAccountId && (formData.threads || []).some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit Threads Account' : 'Add New Threads Account'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account Name / Display Name
                      </label>
                      <input
                        type="text"
                        value={thDraft.displayName}
                        onChange={(e) => setThDraft(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g. Example Threads Account"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Profile / Page URL *
                      </label>
                      <input
                        type="text"
                        value={thDraft.profileUrl}
                        onChange={(e) => setThDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://threads.com/@jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Identifier / Username (without @)
                      </label>
                      <input
                        type="text"
                        value={thDraft.username}
                        onChange={(e) => setThDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. jhon.doe"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional Notes
                      </label>
                      <input
                        type="text"
                        value={thDraft.notes || ''}
                        onChange={(e) => setThDraft(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveThreadsItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-neutral-700 hover:bg-neutral-800 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Account' : 'Save Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of Threads Accounts */}
              {(!formData.threads || formData.threads.length === 0) ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No Threads accounts added yet. Tap "+ Add Threads Account" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.threads.map((item) => {
                    const testLink = item.profileUrl || (item.username ? `https://www.threads.com/@${item.username.replace(/^@/, '')}` : null);
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span>{item.displayName ? `${item.displayName}${item.username ? ` (@${item.username.replace(/^@/, '')})` : ''}` : (item.username ? `@${item.username.replace(/^@/, '')}` : 'Example Threads Account')}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              READY FOR MANUAL SHARE
                            </span>
                            {item.isExamplePlaceholder && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Sample
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <input
                              type="text"
                              value={item.isExamplePlaceholder ? '' : (item.profileUrl || '')}
                              onChange={(e) => handleDirectCardUrlUpdate('threads', item.id, e.target.value)}
                              placeholder="https://threads.com/@jhon.doe"
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {testLink && !item.isExamplePlaceholder && (
                            <button
                              type="button"
                              onClick={() => openTestLink(testLink)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                              title="Test Link"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditThreads(item)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                            title="Edit Account Details"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteThreadsItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-save-all-accounts"
            type="button"
            onClick={handleSaveModal}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply ({totalConfigured} Accounts)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
