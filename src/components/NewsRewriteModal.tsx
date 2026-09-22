import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight, 
  Bookmark, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Send,
  Share2
} from 'lucide-react';
import { NewsArticle, NewsCluster, NewsAiRewrite, PlatformId } from '../types';
import { requestNewsAiRewrite } from '../utils/newsEngine';
import { nativeBridge } from '../services/nativeBridge';
import { isOnline } from '../services/networkState';

interface NewsRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle | null;
  cluster: NewsCluster | null;
  initialRewrite?: NewsAiRewrite | null;
  onCreatePost: (
    article: NewsArticle,
    rewrite: NewsAiRewrite,
    selectedTitle: string
  ) => void;
  onSaveToLibrary: (article: NewsArticle, rewrite: NewsAiRewrite) => void;
}

export const NewsRewriteModal: React.FC<NewsRewriteModalProps> = ({
  isOpen,
  onClose,
  article,
  cluster,
  initialRewrite,
  onCreatePost,
  onSaveToLibrary
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rewrite, setRewrite] = useState<NewsAiRewrite | null>(initialRewrite || null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [activePlatformTab, setActivePlatformTab] = useState<PlatformId>('facebook');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && article) {
      setIsSaved(false);
      setErrorMsg(null);
      if (initialRewrite) {
        setRewrite(initialRewrite);
        setSelectedTitle(initialRewrite.selectedTitle);
      } else {
        fetchRewrite();
      }
    }
  }, [isOpen, article, initialRewrite]);

  const fetchRewrite = async () => {
    if (!article) return;
    if (!isOnline()) {
      setErrorMsg('Offline Mode: AI News Rewrite requires an active internet connection.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await requestNewsAiRewrite(article, cluster || undefined);
      setRewrite(result);
      setSelectedTitle(result.selectedTitle || article.title);
    } catch (err: any) {
      console.error('Failed rewrite:', err);
      setErrorMsg(err?.message || 'Failed to generate rewrite');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !article) return null;

  const handleCopyText = (text: string, key: string) => {
    nativeBridge.copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveClick = () => {
    if (!rewrite) return;
    onSaveToLibrary(article, { ...rewrite, selectedTitle });
    setIsSaved(true);
  };

  const handleCreatePostClick = () => {
    if (!rewrite) return;
    onCreatePost(article, rewrite, selectedTitle || article.title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AI SOCIAL MEDIA REWRITE
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                {article.source}: {article.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Generating Original Fact-Checked Content...
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Analyzing verified source information, preparing 4 title variations, and tailoring captions for each platform.
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto text-rose-500" />
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                {errorMsg}
              </div>
              <button
                onClick={fetchRewrite}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
              >
                Retry Rewrite
              </button>
            </div>
          ) : rewrite ? (
            <>
              {/* Fact Safety Indicator */}
              <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                rewrite.factStatus === 'differing'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : rewrite.factStatus === 'developing'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              }`}>
                {rewrite.factStatus === 'differing' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />}
                {rewrite.factStatus === 'developing' && <Clock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />}
                {rewrite.factStatus === 'confirmed' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />}
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px]">
                    {rewrite.factStatus === 'differing' ? 'Sources Differ' : rewrite.factStatus === 'developing' ? 'Developing Story' : 'Confirmed Information'}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {rewrite.factNotice || (
                      rewrite.factStatus === 'developing'
                        ? 'Developing story — verify before publishing.'
                        : 'Informasi konsisten berdasarkan laporan sumber resmi.'
                    )}
                  </div>
                </div>
              </div>

              {/* Title Generator Section (4 Options) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Select Title Option:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click "Use Title" to apply
                  </span>
                </div>

                <div className="space-y-2">
                  {rewrite.titleOptions?.map((opt, idx) => {
                    const isSelected = selectedTitle === opt.title;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {opt.label}
                            </span>
                          </div>
                          <div className="text-xs font-semibold leading-snug">
                            {opt.title}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTitle(opt.title)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3 h-3" />
                              Selected
                            </>
                          ) : (
                            'Use Title'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Description
                </label>
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                  {rewrite.shortDescription}
                </div>
              </div>

              {/* Platform Preview & Copy Tabs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Platform Content:
                  </span>
                  {/* Platform Sub Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto text-[11px]">
                    {(['facebook', 'instagram', 'tiktok', 'youtube', 'twitter', 'whatsapp'] as PlatformId[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActivePlatformTab(p)}
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                          activePlatformTab === p
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {p === 'twitter' ? 'X (Twitter)' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Specific Display */}
                {activePlatformTab === 'facebook' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {rewrite.facebookCaption}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewrite.hashtags?.facebook?.map((tag, i) => (
                        <span key={i} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${rewrite.facebookCaption}\n\n${(rewrite.hashtags?.facebook || []).join(' ')}`, 'fb')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'fb' ? 'Copied to Clipboard' : 'Copy Facebook Post'}</span>
                    </button>
                  </div>
                )}

                {activePlatformTab === 'instagram' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {rewrite.instagramCaption}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewrite.hashtags?.instagram?.map((tag, i) => (
                        <span key={i} className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${rewrite.instagramCaption}\n\n${(rewrite.hashtags?.instagram || []).join(' ')}`, 'ig')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'ig' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'ig' ? 'Copied to Clipboard' : 'Copy Instagram Caption'}</span>
                    </button>
                  </div>
                )}

                {activePlatformTab === 'tiktok' && (
                  <div className="space-y-2">
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 p-2.5 rounded-xl text-xs">
                      <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">Video Hook:</span>
                      <span className="text-slate-800 dark:text-slate-200 italic">"{rewrite.tiktokHook}"</span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {rewrite.tiktokCaption}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewrite.hashtags?.tiktok?.map((tag, i) => (
                        <span key={i} className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${rewrite.tiktokHook}\n\n${rewrite.tiktokCaption}\n\n${(rewrite.hashtags?.tiktok || []).join(' ')}`, 'tt')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'tt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'tt' ? 'Copied to Clipboard' : 'Copy TikTok Text'}</span>
                    </button>
                  </div>
                )}

                {activePlatformTab === 'youtube' && (
                  <div className="space-y-2">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-bold text-slate-500 block mb-0.5">Title:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{rewrite.youtubeTitle}</span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {rewrite.youtubeDescription}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewrite.hashtags?.youtube?.map((tag, i) => (
                        <span key={i} className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${rewrite.youtubeTitle}\n\n${rewrite.youtubeDescription}\n\n${(rewrite.hashtags?.youtube || []).join(' ')}`, 'yt')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'yt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'yt' ? 'Copied to Clipboard' : 'Copy YouTube Info'}</span>
                    </button>
                  </div>
                )}

                {activePlatformTab === 'twitter' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      {rewrite.xPost}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Length: {rewrite.xPost?.length || 0} / 280</span>
                      <div className="flex gap-1">
                        {rewrite.hashtags?.x?.map((tag, i) => (
                          <span key={i} className="font-semibold text-sky-600 dark:text-sky-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${rewrite.xPost}\n\n${(rewrite.hashtags?.x || []).join(' ')}`, 'x')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'x' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'x' ? 'Copied to Clipboard' : 'Copy X Post'}</span>
                    </button>
                  </div>
                )}

                {activePlatformTab === 'whatsapp' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-sans">
                      {rewrite.whatsappMessage}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(rewrite.whatsappMessage, 'wa')}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:text-indigo-600"
                    >
                      {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wa' ? 'Copied to Clipboard' : 'Copy WhatsApp Message'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!rewrite || isSaved}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-sm"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved to Library</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to News Library</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCreatePostClick}
            disabled={!rewrite}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span>Create Post With This News</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
