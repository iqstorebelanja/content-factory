import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Share2, 
  Edit3, 
  Copy, 
  Trash2, 
  Plus, 
  Layers, 
  Flame, 
  Play, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';
import { 
  ContentQueueItem, 
  QueueItemPriority, 
  QueueItemStatus, 
  SocialGroup, 
  UserSocialAccounts, 
  PlatformId 
} from '../types';
import { PLATFORMS } from '../data/platforms';

interface CalendarViewProps {
  queue: ContentQueueItem[];
  onShareItem: (item: ContentQueueItem) => void;
  onEditItem: (item: ContentQueueItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenReschedule: (item: ContentQueueItem) => void;
  onDuplicateItem: (id: string) => void;
  onCreateNewScheduled: (targetDate?: string) => void;
  socialGroups?: SocialGroup[];
  userAccounts?: UserSocialAccounts;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  queue,
  onShareItem,
  onEditItem,
  onDeleteItem,
  onOpenReschedule,
  onDuplicateItem,
  onCreateNewScheduled,
  socialGroups = []
}) => {
  // Mode: 'month' or 'week'
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  // Navigated date (controls which month or week is shown)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected date for day inspector
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Helper to get YYYY-MM-DD from Date or string
  const toDateKey = (dateInput: Date | string) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayKey = toDateKey(new Date());

  // Map queue items grouped by date key: Record<string, ContentQueueItem[]>
  const queueByDate = useMemo(() => {
    const map: Record<string, ContentQueueItem[]> = {};
    queue.forEach(item => {
      const key = toDateKey(item.scheduledAt);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    });

    // Sort items inside each day by scheduled time ascending
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });

    return map;
  }, [queue]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (calendarMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (calendarMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateKey(toDateKey(now));
  };

  // Month calculations
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: ContentQueueItem[];
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        items: queueByDate[key] || []
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayKey,
        items: queueByDate[key] || []
      });
    }

    // Next month padding days to complete full weeks grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        items: queueByDate[key] || []
      });
    }

    return days;
  }, [currentDate, queueByDate, todayKey]);

  // Week calculations (7 days starting on Sunday of current week)
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days: Array<{
      date: Date;
      dateKey: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
      items: ContentQueueItem[];
    }> = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: key === todayKey,
        items: queueByDate[key] || []
      });
    }

    return days;
  }, [currentDate, queueByDate, todayKey]);

  // Title label formatted for header
  const headerLabel = useMemo(() => {
    if (calendarMode === 'month') {
      return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
    } else {
      if (weekData.length === 7) {
        const first = weekData[0].date;
        const last = weekData[6].date;
        const firstMonth = first.toLocaleDateString([], { month: 'short' });
        const lastMonth = last.toLocaleDateString([], { month: 'short' });
        if (firstMonth === lastMonth) {
          return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
        }
        return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${last.getFullYear()}`;
      }
      return currentDate.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }
  }, [calendarMode, currentDate, weekData]);

  // Selected day items for inspector
  const selectedDayItems = useMemo(() => {
    return queueByDate[selectedDateKey] || [];
  }, [queueByDate, selectedDateKey]);

  const selectedDateObj = useMemo(() => {
    if (!selectedDateKey) return new Date();
    const parts = selectedDateKey.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [selectedDateKey]);

  // Helper for priority badge rendering
  const renderPriorityDot = (priority: QueueItemPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px]">🔥</span>;
      case 'high':
        return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />;
      case 'medium':
        return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />;
      case 'low':
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />;
    }
  };

  const formatItemTime = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* CALENDAR CONTROLS & HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Month / Week Switcher Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              id="calendar-mode-month"
              onClick={() => setCalendarMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                calendarMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              id="calendar-mode-week"
              onClick={() => setCalendarMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                calendarMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
          </div>

          {/* Current Period Label */}
          <div className="text-center font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>{headerLabel}</span>
          </div>

          {/* Navigation Arrows & Today Button */}
          <div className="flex items-center gap-1">
            <button
              id="btn-calendar-prev"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-calendar-today"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Today
            </button>
            <button
              id="btn-calendar-next"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {calendarMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={day} className={`py-2 text-[11px] font-bold ${idx === 0 || idx === 6 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Month Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthData.map((cell) => {
              const isSelected = cell.dateKey === selectedDateKey;
              const hasPosts = cell.items.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`min-h-[86px] sm:min-h-[96px] p-1.5 flex flex-col transition-all cursor-pointer relative ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 opacity-60'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                  } ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 z-10'
                      : ''
                  }`}
                >
                  {/* Day Header row */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasPosts && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {cell.items.length}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items in this Day */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {cell.items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={`text-[10px] rounded-md px-1.5 py-0.5 font-medium truncate flex items-center gap-1 border ${
                          item.status === 'published'
                            ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
                            : item.priority === 'urgent'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/40'
                        }`}
                        title={`${formatItemTime(item.scheduledAt)} - ${item.title}`}
                      >
                        {renderPriorityDot(item.priority)}
                        <span className="font-semibold text-[9px] shrink-0">{formatItemTime(item.scheduledAt)}</span>
                        <span className="truncate">{item.title || item.caption}</span>
                      </div>
                    ))}

                    {cell.items.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                        +{cell.items.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW GRID */}
      {calendarMode === 'week' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekData.map((day) => {
              const isSelected = day.dateKey === selectedDateKey;

              return (
                <div
                  key={day.dateKey}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-2.5 space-y-2 shadow-xs transition-all ${
                    day.isToday
                      ? 'border-indigo-500/60 bg-indigo-50/10 dark:bg-indigo-950/10'
                      : isSelected
                      ? 'border-indigo-400'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Day Column Header */}
                  <div
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {day.dayName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-black ${
                            day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        {day.isToday && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">
                            Today
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateNewScheduled(day.dateKey);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Schedule for this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Column Scheduled Items */}
                  <div className="space-y-2 min-h-[120px]">
                    {day.items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-400 text-xs">
                        <Clock className="w-4 h-4 mb-1 text-slate-300 dark:text-slate-600" />
                        <span className="text-[11px]">No posts</span>
                      </div>
                    ) : (
                      day.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 hover:border-indigo-400 transition-all text-xs"
                        >
                          {/* Time & Priority */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatItemTime(item.scheduledAt)}
                            </span>
                            <span className="text-[10px] flex items-center gap-1">
                              {renderPriorityDot(item.priority)}
                              <span className="uppercase text-[9px] font-bold text-slate-500">{item.priority}</span>
                            </span>
                          </div>

                          {/* Post Title */}
                          <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                            {item.title || item.caption}
                          </h4>

                          {/* Platforms */}
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {item.selectedPlatforms.map(pId => {
                              const p = PLATFORMS[pId];
                              return (
                                <span
                                  key={pId}
                                  className="text-[8px] font-bold px-1.5 py-0.2 rounded text-white"
                                  style={{ backgroundColor: p?.color || '#6366f1' }}
                                >
                                  {p?.badge || pId}
                                </span>
                              );
                            })}
                          </div>

                          {/* Quick Actions in Week Card */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            <button
                              onClick={() => onShareItem(item)}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Share</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEditItem(item)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title="Edit"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onOpenReschedule(item)}
                                className="p-1 rounded text-slate-400 hover:text-amber-500"
                                title="Reschedule"
                              >
                                <Clock className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDuplicateItem(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-purple-500"
                                title="Duplicate"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED DAY SCHEDULE INSPECTOR (Especially helpful in Month View) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedDateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-[11px] text-slate-500">
                {selectedDayItems.length} {selectedDayItems.length === 1 ? 'post scheduled' : 'posts scheduled'} for this day
              </p>
            </div>
          </div>

          <button
            onClick={() => onCreateNewScheduled(selectedDateKey)}
            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule for this Day</span>
          </button>
        </div>

        {selectedDayItems.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">No posts scheduled on this date.</p>
            <p className="text-[11px] text-slate-400">Click &apos;Schedule for this Day&apos; to add content to your calendar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayItems.map((item) => {
              const group = socialGroups.find(g => g.id === item.selectedGroupId);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3 space-y-2.5"
                >
                  {/* Post Top Row */}
                  <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatItemTime(item.scheduledAt)}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {renderPriorityDot(item.priority)}
                        <span>{item.priority}</span>
                      </span>
                      {group && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{group.name}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                      {item.status}
                    </span>
                  </div>

                  {/* Body & Media */}
                  <div className="flex gap-2.5 items-start">
                    {item.media && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                        {item.media.type === 'video' ? (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                            <Play className="w-4 h-4 text-white/80" />
                          </div>
                        ) : (
                          <img
                            src={item.media.url}
                            alt="Media"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title || 'Untitled Post'}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                        {item.caption}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {item.selectedPlatforms.map(pId => {
                          const p = PLATFORMS[pId];
                          return (
                            <span
                              key={pId}
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white"
                              style={{ backgroundColor: p?.color || '#6366f1' }}
                            >
                              {p?.badge || pId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar: Share Now, Edit, Reschedule, Duplicate, Delete */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onShareItem(item)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share Now</span>
                      </button>

                      <button
                        onClick={() => onEditItem(item)}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onOpenReschedule(item)}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => onDuplicateItem(item.id)}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3 text-purple-500" />
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete"
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
    </div>
  );
};
