import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  Trash2, 
  Edit3, 
  Share2, 
  PlusCircle, 
  Clock,
  Layers,
  Sparkles,
  Calendar,
  CalendarDays,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowUpDown,
  Copy,
  X,
  Flame,
  AlertCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { 
  ContentQueueItem, 
  QueueItemStatus, 
  QueueItemPriority, 
  UserSocialAccounts, 
  SocialGroup,
  PlatformId
} from '../types';
import { PLATFORMS } from '../data/platforms';
import { CalendarView } from './CalendarView';

export type TimelineFilter = 'all' | 'due_now' | 'today' | 'upcoming';

interface QueueScreenProps {
  queue: ContentQueueItem[];
  onShareItem: (item: ContentQueueItem) => void;
  onEditItem: (item: ContentQueueItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateStatus: (id: string, status: QueueItemStatus) => void;
  onUpdatePriority: (id: string, priority: QueueItemPriority) => void;
  onRescheduleItem: (id: string, newScheduledAt: string, newPriority?: QueueItemPriority) => void;
  onDuplicateItem: (id: string) => void;
  onCreateNewScheduled: (targetDate?: string) => void;
  userAccounts?: UserSocialAccounts;
  socialGroups?: SocialGroup[];
}

export const QueueScreen: React.FC<QueueScreenProps> = ({
  queue,
  onShareItem,
  onEditItem,
  onDeleteItem,
  onUpdateStatus,
  onUpdatePriority,
  onRescheduleItem,
  onDuplicateItem,
  onCreateNewScheduled,
  userAccounts,
  socialGroups = []
}) => {
  // View mode switcher: Timeline vs Calendar
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');

  // Primary requested filter: 'Today', 'Upcoming', 'Due Now', and 'All'
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  
  // Secondary filters & sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'time_asc' | 'time_desc' | 'priority'>('time_asc');

  // Reschedule modal state
  const [rescheduleItem, setRescheduleItem] = useState<ContentQueueItem | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editPriority, setEditPriority] = useState<QueueItemPriority>('medium');

  // Helper date functions
  const checkIsDueNow = (item: ContentQueueItem) => {
    const t = new Date(item.scheduledAt).getTime();
    return !isNaN(t) && t <= Date.now() && item.status !== 'published';
  };

  const checkIsToday = (item: ContentQueueItem) => {
    const d = new Date(item.scheduledAt);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const checkIsUpcoming = (item: ContentQueueItem) => {
    const t = new Date(item.scheduledAt).getTime();
    return !isNaN(t) && t > Date.now();
  };

  // Open reschedule modal
  const handleOpenReschedule = (item: ContentQueueItem) => {
    setRescheduleItem(item);
    const d = new Date(item.scheduledAt);
    if (!isNaN(d.getTime())) {
      setEditDate(d.toISOString().split('T')[0]);
      setEditTime(d.toTimeString().slice(0, 5));
    } else {
      const now = new Date();
      setEditDate(now.toISOString().split('T')[0]);
      setEditTime('12:00');
    }
    setEditPriority(item.priority);
  };

  const handleSaveReschedule = () => {
    if (!rescheduleItem || !editDate || !editTime) return;
    const newTimestamp = `${editDate}T${editTime}:00`;
    onRescheduleItem(rescheduleItem.id, newTimestamp, editPriority);
    setRescheduleItem(null);
  };

  // Timeline Filter Counts
  const timelineCounts = useMemo(() => {
    let dueNow = 0;
    let today = 0;
    let upcoming = 0;

    queue.forEach(item => {
      if (checkIsDueNow(item)) dueNow++;
      if (checkIsToday(item)) today++;
      if (checkIsUpcoming(item)) upcoming++;
    });

    return {
      all: queue.length,
      due_now: dueNow,
      today,
      upcoming
    };
  }, [queue]);

  // Filtered & Sorted items (chronologically sorted by date and time)
  const filteredQueue = useMemo(() => {
    return queue
      .filter(item => {
        // Primary Timeline Filter
        if (timelineFilter === 'due_now' && !checkIsDueNow(item)) return false;
        if (timelineFilter === 'today' && !checkIsToday(item)) return false;
        if (timelineFilter === 'upcoming' && !checkIsUpcoming(item)) return false;

        // Secondary status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        // Secondary priority filter
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchCaption = item.caption?.toLowerCase().includes(q);
          const matchCampaign = item.metadata?.campaignName?.toLowerCase().includes(q);
          const matchTag = item.hashtags?.some(h => h.toLowerCase().includes(q));
          if (!matchTitle && !matchCaption && !matchCampaign && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'time_asc') {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        }
        if (sortOrder === 'time_desc') {
          return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
        }
        if (sortOrder === 'priority') {
          const priorityWeights: Record<QueueItemPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityWeights[b.priority] - priorityWeights[a.priority];
        }
        return 0;
      });
  }, [queue, timelineFilter, statusFilter, priorityFilter, searchQuery, sortOrder]);

  // Format date helper with countdown/relative cues
  const formatScheduledTime = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const isTodayDate = date.toDateString() === now.toDateString();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrowDate = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (isTodayDate) return `Today at ${timeStr}`;
    if (isTomorrowDate) return `Tomorrow at ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  // Priority styling helper
  const getPriorityBadge = (priority: QueueItemPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'URGENT',
          badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-black',
          icon: <Flame className="w-2.5 h-2.5 text-red-500" />
        };
      case 'high':
        return {
          label: 'HIGH',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        };
      case 'low':
      default:
        return {
          label: 'LOW',
          badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-medium',
          icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        };
    }
  };

  // Status styling helper
  const getStatusBadge = (status: QueueItemStatus) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'SCHEDULED',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
        };
      case 'queued':
        return {
          label: 'READY TO POST',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
        };
      case 'publishing':
        return {
          label: 'PUBLISHING',
          badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 animate-pulse'
        };
      case 'published':
        return {
          label: 'PUBLISHED',
          badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30'
        };
      case 'paused':
        return {
          label: 'PAUSED',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
        };
      case 'failed':
      default:
        return {
          label: 'FAILED',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
        };
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Content Queue</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {queue.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Posts timeline, scheduled calendar delivery & cross-post execution
          </p>
        </div>
        <button
          id="btn-new-scheduled"
          onClick={onCreateNewScheduled}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Scheduled</span>
        </button>
      </div>

      {/* VIEW SWITCHER: TIMELINE vs CALENDAR */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <button
          id="btn-view-timeline"
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'timeline'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline View</span>
        </button>
        <button
          id="btn-view-calendar"
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'calendar'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar View</span>
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          queue={queue}
          onShareItem={onShareItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onOpenReschedule={handleOpenReschedule}
          onDuplicateItem={onDuplicateItem}
          onCreateNewScheduled={onCreateNewScheduled}
          socialGroups={socialGroups}
          userAccounts={userAccounts}
        />
      ) : (
        <>
          {/* PRIMARY TIMELINE FILTERS: 'Today', 'Upcoming', 'Due Now', and 'All' */}
          <div className="grid grid-cols-4 gap-2">
        <button
          id="filter-timeline-all"
          onClick={() => setTimelineFilter('all')}
          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative ${
            timelineFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${timelineFilter === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>
            All
          </span>
          <span className="text-base font-black mt-0.5">{timelineCounts.all}</span>
        </button>

        <button
          id="filter-timeline-due-now"
          onClick={() => setTimelineFilter('due_now')}
          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative ${
            timelineFilter === 'due_now'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500/40'
          }`}
        >
          {timelineCounts.due_now > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${timelineFilter === 'due_now' ? 'text-rose-100' : 'text-rose-500 dark:text-rose-400'}`}>
            Due Now
          </span>
          <span className={`text-base font-black mt-0.5 ${timelineFilter === 'due_now' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {timelineCounts.due_now}
          </span>
        </button>

        <button
          id="filter-timeline-today"
          onClick={() => setTimelineFilter('today')}
          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
            timelineFilter === 'today'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${timelineFilter === 'today' ? 'text-amber-100' : 'text-amber-500'}`}>
            Today
          </span>
          <span className={`text-base font-black mt-0.5 ${timelineFilter === 'today' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {timelineCounts.today}
          </span>
        </button>

        <button
          id="filter-timeline-upcoming"
          onClick={() => setTimelineFilter('upcoming')}
          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
            timelineFilter === 'upcoming'
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${timelineFilter === 'upcoming' ? 'text-indigo-100' : 'text-indigo-500'}`}>
            Upcoming
          </span>
          <span className={`text-base font-black mt-0.5 ${timelineFilter === 'upcoming' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {timelineCounts.upcoming}
          </span>
        </button>
      </div>

      {/* SEARCH & SECONDARY CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="queue-search-input"
            type="text"
            placeholder="Search scheduled posts, captions, #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Secondary filters row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs flex-wrap gap-2">
          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="queued">Ready to Post</option>
              <option value="paused">Paused</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Priority & Sorting */}
          <div className="flex items-center gap-2">
            <select
              id="select-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="urgent">🔥 Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="flex items-center gap-1 text-slate-400">
              <ArrowUpDown className="w-3 h-3" />
              <select
                id="select-sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
              >
                <option value="time_asc">Earliest Time</option>
                <option value="time_desc">Latest Time</option>
                <option value="priority">Priority First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* QUEUE ITEMS LIST - SORTED BY DATE & TIME */}
      {filteredQueue.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <CalendarClock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {timelineFilter === 'due_now'
              ? 'No Posts Due Now'
              : timelineFilter === 'today'
              ? 'No Posts Scheduled for Today'
              : timelineFilter === 'upcoming'
              ? 'No Upcoming Posts Scheduled'
              : 'No Scheduled Posts Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {timelineFilter !== 'all'
              ? `There are currently no items matching the "${timelineFilter.replace('_', ' ').toUpperCase()}" filter.`
              : 'Schedule your content to automate publishing pipelines across your social accounts and groups.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {timelineFilter !== 'all' ? (
              <button
                onClick={() => { setTimelineFilter('all'); setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all"
              >
                Show All Posts
              </button>
            ) : null}
            <button
              onClick={onCreateNewScheduled}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-xl transition-all shadow-sm"
            >
              Schedule New Post
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map(item => {
            const priorityBadge = getPriorityBadge(item.priority);
            const statusBadge = getStatusBadge(item.status);
            const group = socialGroups.find(g => g.id === item.selectedGroupId);
            const isDueOrPast = checkIsDueNow(item);
            const isTodayPost = checkIsToday(item);

            return (
              <div
                key={item.id}
                id={`queue-card-${item.id}`}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-xs hover:border-indigo-500/40 transition-all ${
                  isDueOrPast
                    ? 'border-rose-400/60 dark:border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10'
                    : item.priority === 'urgent'
                    ? 'border-red-500/30 dark:border-red-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* TOP META & TIME ROW */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 ${priorityBadge.badgeClass}`}>
                      {priorityBadge.icon}
                      <span>{priorityBadge.label}</span>
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusBadge.badgeClass}`}>
                      {statusBadge.label}
                    </span>

                    {/* Group Badge */}
                    {group && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        <span>{group.name}</span>
                      </span>
                    )}

                    {/* Campaign tag */}
                    {item.metadata?.campaignName && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        📁 {item.metadata.campaignName}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Date/Time Badge */}
                  <div className={`flex items-center gap-1 text-xs font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                    isDueOrPast
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-extrabold animate-pulse'
                      : isTodayPost
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatScheduledTime(item.scheduledAt)}</span>
                  </div>
                </div>

                {/* CONTENT PREVIEW */}
                <div className="flex gap-3 items-start">
                  {/* Media Thumbnail */}
                  {item.media ? (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                      {item.media.type === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                          <Play className="w-6 h-6 text-white/80" />
                        </div>
                      ) : (
                        <img
                          src={item.media.url}
                          alt="Thumbnail"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-bold text-white uppercase">
                        {item.media.type}
                      </span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                  )}

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title || 'Untitled Post'}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.caption || 'No caption entered'}
                    </p>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {item.hashtags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-medium text-indigo-500 dark:text-indigo-400">
                            {tag}
                          </span>
                        ))}
                        {item.hashtags.length > 3 && (
                          <span className="text-[9px] text-slate-400">
                            +{item.hashtags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* TARGET PLATFORMS ROW */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.selectedPlatforms.map(pId => {
                      const p = PLATFORMS[pId];
                      return (
                        <span
                          key={pId}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                          style={{ backgroundColor: p?.color || '#4f46e5' }}
                        >
                          {p?.badge || pId}
                        </span>
                      );
                    })}
                    {item.selectedDestinationIds && item.selectedDestinationIds.length > 0 && (
                      <span className="text-[9px] font-semibold text-slate-400 ml-1">
                        ({item.selectedDestinationIds.length} accounts)
                      </span>
                    )}
                  </div>

                  {item.metadata?.notes && (
                    <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
                      💬 {item.metadata.notes}
                    </span>
                  )}
                </div>

                {/* ACTION BUTTONS ROW: Edit, Reschedule, Duplicate, and Share Now */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* 1. Share Now Action Button */}
                    <button
                      id={`btn-share-now-${item.id}`}
                      onClick={() => onShareItem(item)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                      title="Initiate Manual Cross-Post Sharing Session"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Share Now</span>
                    </button>

                    {/* 2. Edit Action Button */}
                    <button
                      id={`btn-edit-${item.id}`}
                      onClick={() => onEditItem(item)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95 whitespace-nowrap"
                      title="Edit Caption, Media, and Platforms"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Edit</span>
                    </button>

                    {/* 3. Reschedule Action Button */}
                    <button
                      id={`btn-reschedule-${item.id}`}
                      onClick={() => handleOpenReschedule(item)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95 whitespace-nowrap"
                      title="Reschedule Date, Time & Priority"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Reschedule</span>
                    </button>

                    {/* 4. Duplicate Action Button */}
                    <button
                      id={`btn-duplicate-${item.id}`}
                      onClick={() => onDuplicateItem(item.id)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors active:scale-95 whitespace-nowrap"
                      title="Duplicate Post in Queue"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Duplicate</span>
                    </button>
                  </div>

                  {/* Secondary control bar: pause/play & delete */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {item.status === 'paused' ? (
                        <button
                          onClick={() => onUpdateStatus(item.id, 'scheduled')}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          <Play className="w-3 h-3" />
                          <span>Resume Delivery</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(item.id, 'paused')}
                          className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      )}
                    </div>

                    <button
                      id={`btn-delete-${item.id}`}
                      onClick={() => onDeleteItem(item.id)}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reschedule Post</h3>
                  <p className="text-[11px] text-slate-500">Update timeline & priority</p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Scheduled Date
                </label>
                <input
                  id="input-reschedule-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Scheduled Time (Local)
                </label>
                <input
                  id="input-reschedule-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Queue Priority
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['urgent', 'high', 'medium', 'low'] as QueueItemPriority[]).map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setEditPriority(pri)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        editPriority === pri
                          ? pri === 'urgent'
                            ? 'bg-red-600 text-white shadow-xs'
                            : pri === 'high'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : pri === 'medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRescheduleItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="btn-save-reschedule"
                type="button"
                onClick={handleSaveReschedule}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
