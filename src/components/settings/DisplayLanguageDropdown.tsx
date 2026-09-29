import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe2, Sparkles } from 'lucide-react';
import { AppSettings, LanguageMode } from '../../types';
import { 
  LANGUAGE_OPTIONS, 
  detectBrowserLanguage, 
  getNativeLanguageName, 
  getLanguageOption 
} from '../../utils/i18n';

interface DisplayLanguageDropdownProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const DisplayLanguageDropdown: React.FC<DisplayLanguageDropdownProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isAutomatic = settings.languageMode !== 'manual';
  const detectedCode = detectBrowserLanguage();
  const detectedNativeName = getNativeLanguageName(detectedCode);

  // Determine button trigger display label
  let buttonLabel = '';
  if (isAutomatic) {
    buttonLabel = `Automatic — ${detectedNativeName}`;
  } else {
    const selectedOpt = getLanguageOption(settings.selectedLanguage || settings.language);
    buttonLabel = selectedOpt ? selectedOpt.nativeName : (settings.selectedLanguage || 'English');
  }

  const handleSelectAutomatic = () => {
    const detected = detectBrowserLanguage();
    onUpdateSettings({
      languageMode: 'automatic',
      selectedLanguage: undefined,
      language: detected
    });
    setIsOpen(false);
  };

  const handleSelectManual = (code: string) => {
    onUpdateSettings({
      languageMode: 'manual',
      selectedLanguage: code,
      language: code
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full sm:w-auto min-w-[230px] flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Globe2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">{buttonLabel}</span>
        </div>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div 
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-full sm:w-[280px] max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
        >
          {/* Automatic Option */}
          <button
            type="button"
            role="option"
            aria-selected={isAutomatic}
            onClick={handleSelectAutomatic}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
              isAutomatic
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span>Automatic</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  Detected: {detectedNativeName}
                </span>
              </div>
            </div>
            {isAutomatic && (
              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {/* Supported Languages List */}
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = !isAutomatic && (settings.selectedLanguage === lang.code || settings.language === lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectManual(lang.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{lang.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
