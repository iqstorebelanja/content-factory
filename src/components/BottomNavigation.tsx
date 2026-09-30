import React from 'react';
import { 
  Home, 
  PlusCircle, 
  Settings as SettingsIcon,
  Radio,
  CalendarClock
} from 'lucide-react';
import { NavigationTab } from '../types';
import { t } from '../utils/i18n';

export type { NavigationTab };

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  newStoriesCount?: number;
  queueCount?: number;
  language?: string;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  newStoriesCount = 0,
  queueCount = 0,
  language
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number; customBadge?: React.ReactNode; badgeColor?: string }[] = [
    { id: 'home', label: t('nav.home', language, 'HOME'), icon: <Home className="w-5 h-5" /> },
    { 
      id: 'news', 
      label: t('nav.news', language, 'NEWS'), 
      icon: <Radio className="w-5 h-5" />,
      customBadge: newStoriesCount > 0 ? (
        <span className="absolute -top-1.5 -right-3 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black flex items-center justify-center leading-tight shadow-sm whitespace-nowrap">
          {newStoriesCount > 99 ? '99+' : newStoriesCount}
        </span>
      ) : null
    },
    { id: 'create', label: t('nav.create', language, 'CREATE'), icon: <PlusCircle className="w-5 h-5" /> },
    { 
      id: 'queue', 
      label: t('nav.queue', language, 'QUEUE'), 
      icon: <CalendarClock className="w-5 h-5" />, 
      badge: queueCount,
      badgeColor: 'bg-indigo-600 text-white'
    },
    { id: 'settings', label: t('nav.settings', language, 'SETTINGS'), icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-bottom shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center relative transition-all duration-200 py-1 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              {/* Highlight background pill for active state */}
              {isActive && (
                <span className="absolute top-1 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}

              <div className="relative">
                {item.icon}
                {item.customBadge ? (
                  item.customBadge
                ) : (
                  !!item.badge && item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full ${item.badgeColor || 'bg-amber-500 text-white'} text-[9px] font-bold flex items-center justify-center leading-none`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-full px-0.5 ${isActive ? 'scale-105' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
