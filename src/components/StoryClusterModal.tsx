import React from 'react';
import { 
  X, 
  Layers, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { NewsCluster, NewsArticle } from '../types';

interface StoryClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: NewsCluster | null;
  onRewrite: (article: NewsArticle, cluster: NewsCluster) => void;
  onCreatePost: (article: NewsArticle, cluster?: NewsCluster) => void;
}

export const StoryClusterModal: React.FC<StoryClusterModalProps> = ({
  isOpen,
  onClose,
  cluster,
  onRewrite,
  onCreatePost
}) => {
  if (!isOpen || !cluster) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[88vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                STORY CLUSTER
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                {cluster.mainTopic}
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
          {/* Cluster Status Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Number of sources:
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  {cluster.sourcesCount}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Average Hype: <span className="text-indigo-600 dark:text-indigo-400">{cluster.averageHypeScore}/100</span>
              </div>
            </div>

            {/* Fact Safety Notice */}
            {cluster.factStatus === 'differing' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Sources differ:</span> {cluster.differingSummary || 'Perbedaan detail pelaporan antar sumber media.'}
                </div>
              </div>
            )}
            {cluster.factStatus === 'developing' && (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Developing story:</span> Verifikasi sebelum mempublikasikan ke media sosial.
                </div>
              </div>
            )}
            {cluster.factStatus === 'confirmed' && (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Informasi terkonfirmasi oleh {cluster.sourcesCount} sumber independen.</span>
              </div>
            )}
          </div>

          {/* Sources List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Covering Sources ({cluster.articles.length}):
            </div>
            {cluster.articles.map((art, idx) => (
              <div 
                key={art.id || idx}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {art.source}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-white leading-relaxed">
                  "{art.title}"
                </div>
                {art.summary && art.summary !== art.title && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {art.summary}
                  </div>
                )}
                <div className="pt-1 flex items-center justify-between gap-2">
                  {art.media ? (
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      {art.media.type === 'video' ? <Film className="w-3 h-3 text-rose-500" /> : <ImageIcon className="w-3 h-3 text-indigo-500" />}
                      <span>{art.media.type === 'video' ? 'Video included' : 'Image included'}</span>
                    </span>
                  ) : <span />}
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                  >
                    <span>View Original Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              onRewrite(cluster.representativeArticle, cluster);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rewrite Topic</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onCreatePost(cluster.representativeArticle, cluster);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Create Post</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
