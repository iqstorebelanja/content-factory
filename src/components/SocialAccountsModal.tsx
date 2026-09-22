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
  AlertCircle
} from 'lucide-react';
import { 
  UserSocialAccounts, 
  PlatformId,
  FacebookPageAccount,
  FacebookProfileAccount,
  InstagramAccount,
  TikTokAccount,
  YouTubeChannelAccount,
  TwitterAccount,
  WhatsAppAccount
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { 
  SAMPLE_DEMO_ACCOUNTS, 
  sanitizeUrl, 
  generateAccountId,
  normalizeUserAccounts
} from '../utils/socialAccounts';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserSocialAccounts;
  onSave: (newAccounts: UserSocialAccounts) => void;
  initialFocusPlatform?: PlatformId | null;
}

type PlatformTab = 'all' | 'facebook_page' | 'facebook_profile' | 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'whatsapp';

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSave,
  initialFocusPlatform
}) => {
  const [formData, setFormData] = useState<UserSocialAccounts>(() => normalizeUserAccounts(accounts));
  const [activeTab, setActiveTab] = useState<PlatformTab>(
    (initialFocusPlatform as PlatformTab) || 'all'
  );
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [addingForPlatform, setAddingForPlatform] = useState<PlatformId | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Temp draft states for add/edit form
  const [fbDraft, setFbDraft] = useState({ pageName: '', pageUrl: '' });
  const [fbProfDraft, setFbProfDraft] = useState({ profileName: '', profileUrl: '' });
  const [igDraft, setIgDraft] = useState({ username: '', profileUrl: '' });
  const [ttDraft, setTtDraft] = useState({ username: '', profileUrl: '' });
  const [ytDraft, setYtDraft] = useState({ channelName: '', channelUrl: '' });
  const [twDraft, setTwDraft] = useState({ username: '', profileUrl: '' });
  const [waDraft, setWaDraft] = useState({ name: '', phoneNumber: '', waLink: '' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(normalizeUserAccounts(accounts));
      if (initialFocusPlatform) {
        if (initialFocusPlatform === 'facebook_page' || initialFocusPlatform === 'facebook_profile') {
          setActiveTab('facebook_page');
          setAddingForPlatform(initialFocusPlatform);
        } else {
          setActiveTab(initialFocusPlatform as PlatformTab);
          setAddingForPlatform(initialFocusPlatform);
        }
      } else {
        setAddingForPlatform(null);
      }
      setEditingAccountId(null);
      setFormError(null);
    }
  }, [isOpen, accounts, initialFocusPlatform]);

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
    setFormData(SAMPLE_DEMO_ACCOUNTS);
    setEditingAccountId(null);
    setAddingForPlatform(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all configured accounts?')) {
      setFormData({
        facebook_page: [],
        facebook_profile: [],
        instagram: [],
        tiktok: [],
        youtube: [],
        twitter: [],
        whatsapp: []
      });
      setEditingAccountId(null);
      setAddingForPlatform(null);
    }
  };

  // --- Handlers for Facebook Pages ---
  const startAddFacebook = () => {
    setFbDraft({ pageName: '', pageUrl: '' });
    setAddingForPlatform('facebook_page');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditFacebook = (item: FacebookPageAccount) => {
    setFbDraft({ pageName: item.pageName, pageUrl: item.pageUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveFacebookItem = () => {
    if (!fbDraft.pageName.trim() && !fbDraft.pageUrl.trim()) {
      setFormError('Please enter at least a Page Name or Page URL');
      return;
    }
    const cleanUrl = sanitizeUrl(fbDraft.pageUrl) || (fbDraft.pageName.trim() ? `https://facebook.com/${encodeURIComponent(fbDraft.pageName.trim())}` : '');
    const cleanName = fbDraft.pageName.trim() || 'Facebook Page';

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        facebook_page: prev.facebook_page.map(item => 
          item.id === editingAccountId 
            ? { ...item, pageName: cleanName, pageUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: FacebookPageAccount = {
        id: generateAccountId('fb'),
        pageName: cleanName,
        pageUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        facebook_page: [...prev.facebook_page, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteFacebookItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      facebook_page: prev.facebook_page.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Facebook Personal Profiles ---
  const startAddFacebookProfile = () => {
    setFbProfDraft({ profileName: '', profileUrl: '' });
    setAddingForPlatform('facebook_profile');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditFacebookProfile = (item: FacebookProfileAccount) => {
    setFbProfDraft({ profileName: item.profileName, profileUrl: item.profileUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveFacebookProfileItem = () => {
    if (!fbProfDraft.profileName.trim() && !fbProfDraft.profileUrl.trim()) {
      setFormError('Please enter at least a Profile Name or Profile URL');
      return;
    }
    const cleanUrl = sanitizeUrl(fbProfDraft.profileUrl) || (fbProfDraft.profileName.trim() ? `https://facebook.com/${encodeURIComponent(fbProfDraft.profileName.trim())}` : '');
    const cleanName = fbProfDraft.profileName.trim() || 'Personal Profile';

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        facebook_profile: prev.facebook_profile.map(item => 
          item.id === editingAccountId 
            ? { ...item, profileName: cleanName, profileUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: FacebookProfileAccount = {
        id: generateAccountId('fb_prof'),
        profileName: cleanName,
        profileUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        facebook_profile: [...prev.facebook_profile, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteFacebookProfileItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      facebook_profile: prev.facebook_profile.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Instagram ---
  const startAddInstagram = () => {
    setIgDraft({ username: '', profileUrl: '' });
    setAddingForPlatform('instagram');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditInstagram = (item: InstagramAccount) => {
    setIgDraft({ username: item.username, profileUrl: item.profileUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveInstagramItem = () => {
    const cleanUser = igDraft.username.replace(/^@/, '').trim();
    if (!cleanUser && !igDraft.profileUrl.trim()) {
      setFormError('Please enter at least a Username or Profile URL');
      return;
    }
    const cleanUrl = sanitizeUrl(igDraft.profileUrl) || (cleanUser ? `https://instagram.com/${cleanUser}` : '');

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        instagram: prev.instagram.map(item => 
          item.id === editingAccountId 
            ? { ...item, username: cleanUser, profileUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: InstagramAccount = {
        id: generateAccountId('ig'),
        username: cleanUser,
        profileUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        instagram: [...prev.instagram, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteInstagramItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      instagram: prev.instagram.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for TikTok ---
  const startAddTikTok = () => {
    setTtDraft({ username: '', profileUrl: '' });
    setAddingForPlatform('tiktok');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditTikTok = (item: TikTokAccount) => {
    setTtDraft({ username: item.username, profileUrl: item.profileUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveTikTokItem = () => {
    const cleanUser = ttDraft.username.replace(/^@/, '').trim();
    if (!cleanUser && !ttDraft.profileUrl.trim()) {
      setFormError('Please enter at least a Username or Profile URL');
      return;
    }
    const cleanUrl = sanitizeUrl(ttDraft.profileUrl) || (cleanUser ? `https://tiktok.com/@${cleanUser}` : '');

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        tiktok: prev.tiktok.map(item => 
          item.id === editingAccountId 
            ? { ...item, username: cleanUser, profileUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: TikTokAccount = {
        id: generateAccountId('tt'),
        username: cleanUser,
        profileUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        tiktok: [...prev.tiktok, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteTikTokItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tiktok: prev.tiktok.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for YouTube ---
  const startAddYouTube = () => {
    setYtDraft({ channelName: '', channelUrl: '' });
    setAddingForPlatform('youtube');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditYouTube = (item: YouTubeChannelAccount) => {
    setYtDraft({ channelName: item.channelName, channelUrl: item.channelUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveYouTubeItem = () => {
    if (!ytDraft.channelName.trim() && !ytDraft.channelUrl.trim()) {
      setFormError('Please enter at least a Channel Name or Channel URL');
      return;
    }
    const cleanName = ytDraft.channelName.trim() || 'YouTube Channel';
    const cleanUrl = sanitizeUrl(ytDraft.channelUrl) || `https://youtube.com/results?search_query=${encodeURIComponent(cleanName)}`;

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        youtube: prev.youtube.map(item => 
          item.id === editingAccountId 
            ? { ...item, channelName: cleanName, channelUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: YouTubeChannelAccount = {
        id: generateAccountId('yt'),
        channelName: cleanName,
        channelUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        youtube: [...prev.youtube, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteYouTubeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      youtube: prev.youtube.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for Twitter / X ---
  const startAddTwitter = () => {
    setTwDraft({ username: '', profileUrl: '' });
    setAddingForPlatform('twitter');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditTwitter = (item: TwitterAccount) => {
    setTwDraft({ username: item.username, profileUrl: item.profileUrl });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveTwitterItem = () => {
    const cleanUser = twDraft.username.replace(/^@/, '').trim();
    if (!cleanUser && !twDraft.profileUrl.trim()) {
      setFormError('Please enter at least a Username or Profile URL');
      return;
    }
    const cleanUrl = sanitizeUrl(twDraft.profileUrl) || (cleanUser ? `https://x.com/${cleanUser}` : '');

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        twitter: prev.twitter.map(item => 
          item.id === editingAccountId 
            ? { ...item, username: cleanUser, profileUrl: cleanUrl } 
            : item
        )
      }));
    } else {
      const newItem: TwitterAccount = {
        id: generateAccountId('x'),
        username: cleanUser,
        profileUrl: cleanUrl
      };
      setFormData(prev => ({
        ...prev,
        twitter: [...prev.twitter, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteTwitterItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      twitter: prev.twitter.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
  };

  // --- Handlers for WhatsApp ---
  const startAddWhatsApp = () => {
    setWaDraft({ name: '', phoneNumber: '', waLink: '' });
    setAddingForPlatform('whatsapp');
    setEditingAccountId(null);
    setFormError(null);
  };

  const startEditWhatsApp = (item: WhatsAppAccount) => {
    setWaDraft({ name: item.name, phoneNumber: item.phoneNumber, waLink: item.waLink || '' });
    setEditingAccountId(item.id);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const saveWhatsAppItem = () => {
    const cleanPhone = waDraft.phoneNumber.trim();
    const cleanName = waDraft.name.trim() || (cleanPhone ? `WA: ${cleanPhone}` : 'WhatsApp Contact');
    if (!cleanPhone && !waDraft.waLink.trim() && !cleanName) {
      setFormError('Please enter at least an Account Name or WhatsApp Number');
      return;
    }
    const cleanNumeric = cleanPhone.replace(/[^0-9]/g, '');
    const cleanLink = sanitizeUrl(waDraft.waLink) || (cleanNumeric ? `https://wa.me/${cleanNumeric}` : '');

    if (editingAccountId) {
      setFormData(prev => ({
        ...prev,
        whatsapp: prev.whatsapp.map(item => 
          item.id === editingAccountId 
            ? { ...item, name: cleanName, phoneNumber: cleanPhone, waLink: cleanLink } 
            : item
        )
      }));
    } else {
      const newItem: WhatsAppAccount = {
        id: generateAccountId('wa'),
        name: cleanName,
        phoneNumber: cleanPhone,
        waLink: cleanLink
      };
      setFormData(prev => ({
        ...prev,
        whatsapp: [...prev.whatsapp, newItem]
      }));
    }
    setEditingAccountId(null);
    setAddingForPlatform(null);
    setFormError(null);
  };

  const deleteWhatsAppItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      whatsapp: prev.whatsapp.filter(i => i.id !== id)
    }));
    if (editingAccountId === id) setEditingAccountId(null);
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
    formData.whatsapp.length;

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
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>WhatsApp</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {formData.whatsapp.length}
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
                          Page Name *
                        </label>
                        <input
                          type="text"
                          value={fbDraft.pageName}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, pageName: e.target.value }))}
                          placeholder="e.g. Jangari Adventure Official"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Page URL
                        </label>
                        <input
                          type="text"
                          value={fbDraft.pageUrl}
                          onChange={(e) => setFbDraft(prev => ({ ...prev, pageUrl: e.target.value }))}
                          placeholder="https://facebook.com/jangarioutdoor"
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
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.pageName || 'Unnamed Page'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.pageUrl || 'No page URL set'}
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
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Page"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                          Profile Name (or Person's Name) *
                        </label>
                        <input
                          type="text"
                          value={fbProfDraft.profileName}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, profileName: e.target.value }))}
                          placeholder="e.g. Budi Santoso (Personal)"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Facebook Profile URL
                        </label>
                        <input
                          type="url"
                          value={fbProfDraft.profileUrl}
                          onChange={(e) => setFbProfDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                          placeholder="https://facebook.com/budi.santoso"
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
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{item.profileName || 'Personal Profile'}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                              Personal Profile
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.profileUrl || 'No profile URL set'}
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
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                        Username (without @) *
                      </label>
                      <input
                        type="text"
                        value={igDraft.username}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. jangari_venture"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Profile URL
                      </label>
                      <input
                        type="text"
                        value={igDraft.profileUrl}
                        onChange={(e) => setIgDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://instagram.com/jangari_venture"
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
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          @{item.username.replace(/^@/, '') || 'Unnamed Account'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.profileUrl || `https://instagram.com/${item.username}`}
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
                        Username (without @) *
                      </label>
                      <input
                        type="text"
                        value={ttDraft.username}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. jangari_official"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Profile URL
                      </label>
                      <input
                        type="text"
                        value={ttDraft.profileUrl}
                        onChange={(e) => setTtDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://tiktok.com/@jangari_official"
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
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          @{item.username.replace(/^@/, '') || 'Unnamed Account'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.profileUrl || `https://tiktok.com/@${item.username}`}
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
                        Channel Name *
                      </label>
                      <input
                        type="text"
                        value={ytDraft.channelName}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, channelName: e.target.value }))}
                        placeholder="e.g. Jangari Fishing TV"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Channel URL
                      </label>
                      <input
                        type="text"
                        value={ytDraft.channelUrl}
                        onChange={(e) => setYtDraft(prev => ({ ...prev, channelUrl: e.target.value }))}
                        placeholder="https://youtube.com/@jangarifishing"
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
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {item.channelName || 'YouTube Channel'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.channelUrl || 'No channel URL set'}
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Channel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
                        Username (without @) *
                      </label>
                      <input
                        type="text"
                        value={twDraft.username}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g. jangariview"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Profile URL
                      </label>
                      <input
                        type="text"
                        value={twDraft.profileUrl}
                        onChange={(e) => setTwDraft(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://x.com/jangariview"
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
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          @{item.username.replace(/^@/, '') || 'Unnamed Account'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.profileUrl || `https://x.com/${item.username}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(item.profileUrl || item.username) && (
                          <button
                            type="button"
                            onClick={() => openTestLink(item.profileUrl || `https://x.com/${item.username}`)}
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
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

          {/* 6. WHATSAPP SECTION */}
          {(activeTab === 'all' || activeTab === 'whatsapp') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    WA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      WhatsApp Accounts & Numbers
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formData.whatsapp.length} Account{formData.whatsapp.length === 1 ? '' : 's'} configured
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-whatsapp-account"
                  type="button"
                  onClick={startAddWhatsApp}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add WhatsApp Account</span>
                </button>
              </div>

              {/* Add/Edit Form for WhatsApp */}
              {(addingForPlatform === 'whatsapp' || (editingAccountId && formData.whatsapp.some(i => i.id === editingAccountId))) && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingAccountId ? 'Edit WhatsApp Account' : 'Add New WhatsApp Account'}</span>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[11px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Account / Contact Name *
                      </label>
                      <input
                        type="text"
                        value={waDraft.name}
                        onChange={(e) => setWaDraft(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. CS Pemancingan Jangari"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        value={waDraft.phoneNumber}
                        onChange={(e) => setWaDraft(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="e.g. +6281234567890"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Optional WhatsApp Link
                      </label>
                      <input
                        type="text"
                        value={waDraft.waLink}
                        onChange={(e) => setWaDraft(prev => ({ ...prev, waLink: e.target.value }))}
                        placeholder="https://wa.me/6281234567890"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      onClick={saveWhatsAppItem}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAccountId ? 'Update Account' : 'Save Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List of WhatsApp Accounts */}
              {formData.whatsapp.length === 0 ? (
                <div className="text-center py-4 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No WhatsApp accounts added yet. Tap "+ Add WhatsApp Account" to configure.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.whatsapp.map((item) => {
                    const cleanPhone = item.phoneNumber?.replace(/[^0-9]/g, '');
                    const testLink = item.waLink || (cleanPhone ? `https://wa.me/${cleanPhone}` : null);
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {item.name || item.phoneNumber || 'WhatsApp Account'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.phoneNumber ? `${item.phoneNumber}` : ''} {item.waLink ? `• ${item.waLink}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {testLink && (
                            <button
                              type="button"
                              onClick={() => openTestLink(testLink)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1"
                              title="Test Link"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditWhatsApp(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWhatsAppItem(item.id)}
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
