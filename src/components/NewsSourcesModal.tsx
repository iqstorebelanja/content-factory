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
  RotateCcw
} from 'lucide-react';
import { NewsRssSource } from '../types';
import { testRssSource } from '../utils/newsEngine';
import { 
  SUPPORTED_COUNTRIES, 
  getCountryByCode, 
  getCategoriesForCountry 
} from '../data/countries';
import { CURATED_NEWS_SOURCES } from '../data/curatedNewsSources';
import { usePlanContext } from '../contexts/PlanContext';

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
  const { plan, canUseFeature, openUpgradeModal } = usePlanContext();
  const isOwner = plan === 'ADMIN_TEST';

  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [editingSource, setEditingSource] = useState<NewsRssSource | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [countryCode, setCountryCode] = useState('ID');
  const [category, setCategory] = useState('Nasional');
  const [language, setLanguage] = useState('id');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [active, setActive] = useState(true);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; itemCount?: number; latencyMs?: number }>>({});

  if (!isOpen) return null;

  const handleStartAdd = () => {
    if (!isOwner && !canUseFeature('rss_sources').allowed) {
      openUpgradeModal('Custom RSS Feeds', 'Managing and adding custom RSS news sources beyond the FREE limit requires PRO.');
      return;
    }

    setIsAddingNew(true);
    setEditingSource(null);
    setName('');
    setUrl('');
    const defaultCountry = filterCountry !== 'ALL' ? filterCountry : 'ID';
    setCountryCode(defaultCountry);
    const country = getCountryByCode(defaultCountry);
    const cats = getCategoriesForCountry(defaultCountry);
    setCategory(cats[0] || 'National');
    setLanguage(country.defaultLanguage || 'en');
    setPriority('high');
    setActive(true);
  };

  const handleStartEdit = (src: NewsRssSource) => {
    if (!isOwner && !canUseFeature('rss_sources').allowed) {
      openUpgradeModal('Custom RSS Feeds', 'Editing news sources beyond the FREE limit requires PRO.');
      return;
    }

    setEditingSource(src);
    setIsAddingNew(false);
    setName(src.name);
    setUrl(src.url);
    const cCode = src.countryCode || 'ID';
    setCountryCode(cCode);
    setCategory(src.category);
    setLanguage(src.language || 'id');
    setPriority(src.priority);
    setActive(src.active);
  };

  const handleCountryChangeInForm = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const country = getCountryByCode(newCountryCode);
    setLanguage(country.defaultLanguage);
    const cats = getCategoriesForCountry(newCountryCode);
    if (!cats.includes(category)) {
      setCategory(cats[0] || 'National');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    if (editingSource) {
      const updated = sources.map(s => 
        s.id === editingSource.id 
          ? { 
              ...s, 
              name: name.trim(), 
              url: url.trim(), 
              countryCode, 
              category, 
              language, 
              priority, 
              active,
              isGlobal: countryCode === 'GLOBAL'
            }
          : s
      );
      onSaveSources(updated);
      setEditingSource(null);
    } else {
      const newSource: NewsRssSource = {
        id: `src-${Date.now()}`,
        name: name.trim(),
        url: url.trim(),
        countryCode,
        category,
        language,
        priority,
        active,
        isGlobal: countryCode === 'GLOBAL'
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
    if (confirm('Reset to default curated RSS sources list (Global & Indonesia)?')) {
      onSaveSources(CURATED_NEWS_SOURCES);
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

  // Filter sources by country
  const filteredSources = sources.filter(s => {
    if (filterCountry === 'ALL') return true;
    const c = (s.countryCode || 'ID').toUpperCase();
    return c === filterCountry.toUpperCase();
  });

  const availableFormCategories = Array.from(new Set(getCategoriesForCountry(countryCode).filter(c => c !== 'All Categories')));

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
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>RSS Sources Manager</span>
                {isOwner && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Owner Mode
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Country-aware news feeds, categories, priority, and testing
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

        {/* Country Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Region:
          </span>
          <button
            type="button"
            onClick={() => setFilterCountry('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterCountry === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Regions ({sources.length})
          </button>
          {SUPPORTED_COUNTRIES.map(c => {
            const count = sources.filter(s => (s.countryCode || 'ID').toUpperCase() === c.code).length;
            if (count === 0 && c.code !== 'ID' && c.code !== 'US' && c.code !== 'GLOBAL') return null;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setFilterCountry(c.code)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterCountry === c.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {filteredSources.length} Sources ({filteredSources.filter(s => s.active).length} Active)
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

              {/* Country & Language */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Country / Region
                  </label>
                  <select
                    value={countryCode}
                    onChange={e => handleCountryChangeInForm(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {SUPPORTED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Language Code
                  </label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={e => setLanguage(e.target.value.toLowerCase())}
                    placeholder="id, en, ja, de, es, etc."
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NPR News, Bola.com, BBC Football"
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
                    {availableFormCategories.map((cat, idx) => (
                      <option key={`src-cat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">Custom...</option>
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Source Enabled / Active
                  </span>
                </label>

                <button
                  type="submit"
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:bg-indigo-500 transition-all"
                >
                  Save Source
                </button>
              </div>
            </form>
          )}

          {/* Sources List */}
          <div className="space-y-2">
            {filteredSources.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <p>No RSS sources found for {filterCountry === 'ALL' ? 'this filter' : filterCountry}.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  + Add First RSS Source
                </button>
              </div>
            ) : (
              filteredSources.map(src => {
                const test = testResults[src.id];
                const country = getCountryByCode(src.countryCode || 'ID');

                return (
                  <div
                    key={src.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      src.active
                        ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-xs">{country.flag}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {src.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {src.category}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            src.priority === 'high' 
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' 
                              : src.priority === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {src.priority}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 uppercase">
                            {src.language || country.defaultLanguage}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-sm">
                          {src.url}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestSource(src)}
                          disabled={testingId === src.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                          title="Test RSS Feed"
                        >
                          {testingId === src.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleStartEdit(src)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                          title="Edit Source"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(src.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            src.active 
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40' 
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={src.active ? 'Disable Source' : 'Enable Source'}
                        >
                          {src.active ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(src.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          title="Delete Source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Test Results Banner */}
                    {test && (
                      <div className={`mt-2.5 p-2 rounded-xl text-[11px] flex items-center justify-between ${
                        test.success 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {test.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{test.message}</span>
                        </div>
                        <span className="font-mono text-[10px] opacity-75">
                          {test.latencyMs}ms
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
