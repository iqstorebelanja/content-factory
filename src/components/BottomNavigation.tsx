import React from 'react';
import { 
  Home, 
  PlusCircle, 
  FileText, 
  Clock, 
  Settings as SettingsIcon,
  Radio,
  CalendarClock
} from 'lucide-react';
import { NavigationTab } from '../types';

export type { NavigationTab };

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  draftsCount?: number;
  newStoriesCount?: number;
  queueCount?: number;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  draftsCount = 0,
  newStoriesCount = 0,
  queueCount = 0
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number; customBadge?: React.ReactNode; badgeColor?: string }[] = [
    { id: 'home', label: 'HOME', icon: <Home className="w-4.5 h-4.5" /> },
    { 
      id: 'news', 
      label: 'NEWS', 
      icon: <Radio className="w-4.5 h-4.5" />,
      customBadge: newStoriesCount > 0 ? (
        <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full bg-rose-600 text-white text-[7.5px] font-black flex items-center justify-center leading-tight shadow-sm whitespace-nowrap">
          {newStoriesCount > 99 ? '99+' : newStoriesCount}
        </span>
      ) : null
    },
    { id: 'create', label: 'CREATE', icon: <PlusCircle className="w-4.5 h-4.5" /> },
    { 
      id: 'queue', 
      label: 'QUEUE', 
      icon: <CalendarClock className="w-4.5 h-4.5" />, 
      badge: queueCount,
      badgeColor: 'bg-indigo-600 text-white'
    },
    { id: 'drafts', label: 'DRAFTS', icon: <FileText className="w-4.5 h-4.5" />, badge: draftsCount },
    { id: 'history', label: 'HISTORY', icon: <Clock className="w-4.5 h-4.5" /> },
    { id: 'settings', label: 'SETTINGS', icon: <SettingsIcon className="w-4.5 h-4.5" /> },
  ];

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-bottom shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-7 h-16 px-0.5">
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
                <span className="absolute top-1 w-6 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}

              <div className="relative">
                {item.icon}
                {item.customBadge ? (
                  item.customBadge
                ) : (
                  !!item.badge && item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 rounded-full ${item.badgeColor || 'bg-amber-500 text-white'} text-[8px] font-bold flex items-center justify-center leading-none`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )
                )}
              </div>

              <span className={`text-[8.5px] tracking-tight mt-0.5 truncate max-w-full px-0.5 ${isActive ? 'scale-105' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

