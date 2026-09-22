import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Play, 
  RefreshCw,
  Check,
  RotateCcw
} from 'lucide-react';
import { NewsRssSource, DEFAULT_RSS_SOURCES } from '../types';
import { testRssSource } from '../utils/newsEngine';

interface NewsSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: NewsRssSource[];
  onSaveSources: (updated: NewsRssSource[]) => void;
}

export const NewsSourcesModal: React.FC<NewsSourcesModalProps> = ({
  isOpen,
  onClose,
  sources,
  onSaveSources
}) => {
  const [editingSource, setEditingSource] = useState<NewsRssSource | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Nasional');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; itemCount?: number; latencyMs?: number }>>({});

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingSource(null);
    setName('');
    setUrl('');
    setCategory('Nasional');
    setPriority('high');
  };

  const handleStartEdit = (src: NewsRssSource) => {
    setEditingSource(src);
    setIsAddingNew(false);
    setName(src.name);
    setUrl(src.url);
    setCategory(src.category);
    setPriority(src.priority);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    if (editingSource) {
      const updated = sources.map(s => 
        s.id === editingSource.id 
          ? { ...s, name: name.trim(), url: url.trim(), category, priority }
          : s
      );
      onSaveSources(updated);
      setEditingSource(null);
    } else {
      const newSource: NewsRssSource = {
        id: `src-${Date.now()}`,
        name: name.trim(),
        url: url.trim(),
        category,
        priority,
        active: true
      };
      onSaveSources([newSource, ...sources]);
      setIsAddingNew(false);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = sources.map(s => s.id === id ? { ...s, active: !s.active } : s);
    onSaveSources(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this RSS source?')) {
      const updated = sources.filter(s => s.id !== id);
      onSaveSources(updated);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset to default curated RSS sources list?')) {
      onSaveSources(DEFAULT_RSS_SOURCES);
    }
  };

  const handleTestSource = async (src: NewsRssSource) => {
    setTestingId(src.id);
    const res = await testRssSource(src.url, src.name);
    setTestResults(prev => ({
      ...prev,
      [src.id]: res
    }));
    setTestingId(null);
  };

  const categoriesList = [
    'Persib',
    'Sepakbola',
    'Nasional',
    'Hype / Viral',
    'Internasional',
    'Teknologi',
    'Ekonomi',
    'Lifestyle',
    'Adventure',
    'Custom'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                RSS Sources Manager
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure, enable/disable, and test RSS feed URLs
              </p>
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
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {sources.length} Configured Sources ({sources.filter(s => s.active).length} Active)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleStartAdd}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Source
              </button>
            </div>
          </div>

          {/* Add / Edit Form */}
          {(isAddingNew || editingSource) && (
            <form onSubmit={handleSaveForm} className="bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {editingSource ? 'Edit RSS Source' : 'Add New RSS Source'}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsAddingNew(false); setEditingSource(null); }}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. detikJabar, Bola.com, CNN Indonesia"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  RSS Feed URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://.../rss.xml"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
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
                  onClick={() => { setIsAddingNew(false); setEditingSource(null); }}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Source
                </button>
              </div>
            </form>
          )}

          {/* Sources List */}
          <div className="space-y-2.5">
            {sources.map(src => {
              const testResult = testResults[src.id];
              const isTesting = testingId === src.id;

              return (
                <div
                  key={src.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    src.active
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {src.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {src.category}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          src.priority === 'high' 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
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
                        onChange={() => handleToggleActive(src.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Test Result Message */}
                  {testResult && (
                    <div className={`mt-2 p-2 rounded-xl text-[11px] flex items-start gap-1.5 ${
                      testResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' 
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <div>
                        <span>{testResult.message}</span>
                        {testResult.latencyMs && (
                          <span className="ml-1 opacity-70 font-mono">({testResult.latencyMs}ms)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestSource(src)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Test RSS Source
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(src)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit Source"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(src.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                        title="Delete Source"
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

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
