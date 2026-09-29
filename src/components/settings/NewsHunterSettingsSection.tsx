import React from 'react';
import { 
  Radio, 
  Flame, 
  Image, 
  ArrowUpDown, 
  Check, 
  Globe2, 
  Languages, 
  AlertCircle,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, NewsHunterGlobalSettings } from '../../types';
import { 
  SUPPORTED_COUNTRIES, 
  detectCountryFromLocale, 
  getCountryByCode,
  getCategoriesForCountry 
} from '../../data/countries';

interface NewsHunterSettingsSectionProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onNavigateToRssSources?: () => void;
}

export const NewsHunterSettingsSection: React.FC<NewsHunterSettingsSectionProps> = ({
  settings,
  onUpdateSettings,
  onNavigateToRssSources
}) => {
  const currentNewsHunterSettings: NewsHunterGlobalSettings = settings.newsHunterSettings || {
    newsRegionMode: 'auto',
    manualCountryCode: 'ID',
    supplementWithGlobal: true,
    rewriteLanguage: 'same_as_news',
    defaultCategories: ['Hype/Viral', 'Nasional', 'Internasional', 'Sepakbola', 'Persib'],
    defaultHypeFilter: 'all',
    defaultMediaFilter: 'all',
    defaultSorting: 'hype',
    autoHuntOnStartup: false
  };

  const detectedCountry = detectCountryFromLocale();
  const currentMode = currentNewsHunterSettings.newsRegionMode || 'auto';
  const activeCountryCode = currentMode === 'auto' 
    ? detectedCountry.code 
    : (currentNewsHunterSettings.manualCountryCode || 'ID');
  const activeCountry = getCountryByCode(activeCountryCode);

  const handleUpdateRegionMode = (mode: 'auto' | 'manual') => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        newsRegionMode: mode
      }
    });
  };

  const handleUpdateCountryCode = (code: string) => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        newsRegionMode: 'manual',
        manualCountryCode: code
      }
    });
  };

  const handleToggleSupplementGlobal = () => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        supplementWithGlobal: !(currentNewsHunterSettings.supplementWithGlobal ?? true)
      }
    });
  };

  const handleUpdateRewriteLanguage = (lang: string) => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        rewriteLanguage: lang
      }
    });
  };

  const handleToggleCategory = (cat: string) => {
    const existing = currentNewsHunterSettings.defaultCategories || [];
    let updated: string[];
    if (existing.includes(cat)) {
      if (existing.length <= 1) return; // Keep at least one
      updated = existing.filter(c => c !== cat);
    } else {
      updated = [...existing, cat];
    }
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        defaultCategories: updated
      }
    });
  };

  const handleUpdateHype = (val: 'all' | '50' | '70' | '85') => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        defaultHypeFilter: val
      }
    });
  };

  const handleUpdateMedia = (val: 'all' | 'images' | 'videos' | 'none' | 'downloadable') => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        defaultMediaFilter: val
      }
    });
  };

  const handleUpdateSorting = (val: 'hype' | 'newest' | 'sources') => {
    onUpdateSettings({
      newsHunterSettings: {
        ...currentNewsHunterSettings,
        defaultSorting: val
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-500" />
            <span>News Hunter Global Defaults</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Region awareness, country-specific feeds, viral hype, and multi-language rewrites
          </p>
        </div>

        {onNavigateToRssSources && (
          <button
            type="button"
            onClick={onNavigateToRssSources}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
          >
            <span>Manage RSS Sources & Auto Hunt</span>
          </button>
        )}
      </div>

      {/* Safety Notice: No Automatic Scraping on App Launch */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Safe Execution Policy:</strong>
          News Hunter does <strong>NOT</strong> automatically query news servers on application startup. Feeds are only fetched when you tap <em>Hunt Now</em> or enable <em>Auto Hunt</em> with your preferred interval.
        </div>
      </div>

      <div className="space-y-4">
        {/* Requirement #2 & #3: NEWS REGION CONFIGURATION */}
        <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  News Region
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target country for local news sources, categories, and web discovery
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {currentMode === 'auto' ? (
                <span>Automatic</span>
              ) : (
                <span>{activeCountry.name}</span>
              )}
            </div>
          </div>

          {/* Mode Selector: Automatic vs Manual */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleUpdateRegionMode('auto')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentMode === 'auto'
                  ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm'
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Automatic</span>
                </span>
                {currentMode === 'auto' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Automatic regional detection
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Detects region from browser locale. No IP tracker used.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateRegionMode('manual')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentMode === 'manual'
                  ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm'
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Manual Override</span>
                </span>
                {currentMode === 'manual' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose specific country
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Overrides browser language
              </div>
            </button>
          </div>

          {/* Manual Country Selection Dropdown */}
          {currentMode === 'manual' && (
            <div className="pt-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Country / Region:
              </label>
              <select
                value={currentNewsHunterSettings.manualCountryCode || 'ID'}
                onChange={e => handleUpdateCountryCode(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Requirement #9: Global Sources Supplement */}
          <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Supplement with Global Sources
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Include verified international wires (Reuters, AP, AFP) alongside local country feeds
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentNewsHunterSettings.supplementWithGlobal ?? true}
                onChange={handleToggleSupplementGlobal}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Requirement #18: REWRITE LANGUAGE SETTING */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default AI Rewrite Language
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Target language when transforming raw news into social media copies
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'same_as_news', label: 'Same as News Source' },
              { id: 'same_as_app', label: 'Same as App Language' },
              { id: 'en', label: 'English' },
              { id: 'id', label: 'Bahasa Indonesia' },
              { id: 'ja', label: 'Japanese (日本語)' },
              { id: 'de', label: 'German (Deutsch)' },
              { id: 'es', label: 'Spanish (Español)' },
              { id: 'fr', label: 'French (Français)' }
            ].map(lang => {
              const isActive = (currentNewsHunterSettings.rewriteLanguage || 'same_as_news') === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleUpdateRewriteLanguage(lang.id)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Categories */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Default Monitored Categories
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Categories enabled when opening News Hunter discovery
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Trending', 'National', 'International', 'Sports', 'Football', 'Technology', 'Business', 'Entertainment', 'Persib'].map((cat) => {
              const isSelected = (currentNewsHunterSettings.defaultCategories || []).includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleToggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Hype Threshold */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Viral Hype Filter
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Minimum velocity score required for discovered stories
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'All Stories (0+)' },
              { id: '50', label: 'Trending (50+)' },
              { id: '70', label: 'Hot (70+)' },
              { id: '85', label: 'Viral Top (85+)' }
            ].map((hp) => {
              const isActive = (currentNewsHunterSettings.defaultHypeFilter || 'all') === hp.id;
              return (
                <button
                  key={hp.id}
                  type="button"
                  onClick={() => handleUpdateHype(hp.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {hp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Media Filter */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Media Preference
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Filter articles based on attached media availability
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'All Media Types' },
              { id: 'images', label: 'Images Only' },
              { id: 'videos', label: 'Videos Only' },
              { id: 'none', label: 'No Media (Text Only)' },
              { id: 'downloadable', label: 'Downloadable Only' }
            ].map((mf) => {
              const isActive = (currentNewsHunterSettings.defaultMediaFilter || 'all') === mf.id;
              return (
                <button
                  key={mf.id}
                  type="button"
                  onClick={() => handleUpdateMedia(mf.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {mf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Sorting */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Default Story Sorting
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Initial order when displaying discovered news articles
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hype', label: 'Highest Hype' },
              { id: 'newest', label: 'Newest First' },
              { id: 'sources', label: 'Most Sources' }
            ].map((st) => {
              const isActive = (currentNewsHunterSettings.defaultSorting || 'hype') === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleUpdateSorting(st.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
