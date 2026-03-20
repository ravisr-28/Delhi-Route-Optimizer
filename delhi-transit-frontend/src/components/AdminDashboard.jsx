import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

// ═══════════════════════════════════════════════
// Time-aware crowdsourced feedback
// ═══════════════════════════════════════════════

const ALL_CATEGORIES = ['Overcrowding', 'Delay', 'Cleanliness', 'Safety', 'Accessibility', 'AC Issue', 'Staff Behavior', 'Noise', 'Metro Closed'];
const STATIONS = ['Rajiv Chowk', 'Kashmere Gate', 'Hauz Khas', 'Huda City Centre', 'Chandni Chowk', 'New Delhi', 'AIIMS', 'Central Secretariat', 'Mandi House', 'Lajpat Nagar', 'Janakpuri West', 'Dwarka', 'Rohini', 'Noida Sector 18', 'Botanical Garden', 'Saket', 'ITO', 'Patel Chowk', 'Green Park', 'Malviya Nagar'];
const LINES = ['Red Line', 'Yellow Line', 'Blue Line', 'Green Line', 'Violet Line', 'Magenta Line', 'Pink Line', 'Orange Line'];
const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];
const LINE_COLORS = { 'Red Line': '#ef4444', 'Yellow Line': '#eab308', 'Blue Line': '#3b82f6', 'Green Line': '#22c55e', 'Violet Line': '#8b5cf6', 'Magenta Line': '#ec4899', 'Pink Line': '#f472b6', 'Orange Line': '#f97316' };

function getMetroPeriod(hour) {
  if (hour >= 23 || hour < 6) return 'closed';
  if (hour >= 6 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 10) return 'morning_rush';
  if (hour >= 10 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 14) return 'afternoon';
  if (hour >= 14 && hour < 17) return 'post_lunch';
  if (hour >= 17 && hour < 20) return 'evening_rush';
  return 'late_evening';
}

const PERIOD_INFO = {
  closed: { label: 'Operational Standby', icon: 'fas fa-moon', color: '#ef4444', desc: 'Service unavailable (11 PM – 6 AM)' },
  early_morning: { label: 'Morning Protocol', icon: 'fas fa-sun', color: '#f97316', desc: 'Light crowd, stations opening' },
  morning_rush: { label: 'AM Peak Flow', icon: 'fas fa-bolt', color: '#ef4444', desc: 'Peak crowding (8–10 AM)' },
  late_morning: { label: 'Mid-Day Operations', icon: 'fas fa-cloud-sun', color: '#eab308', desc: 'Moderate crowd' },
  afternoon: { label: 'Afternoon Ops', icon: 'fas fa-sun', color: '#22c55e', desc: 'Comfortable off-peak' },
  post_lunch: { label: 'Transition Phase', icon: 'fas fa-cloud-sun', color: '#84cc16', desc: 'Gradually building' },
  evening_rush: { label: 'PM Peak Flow', icon: 'fas fa-bolt', color: '#ef4444', desc: 'Peak crowding (5–8 PM)' },
  late_evening: { label: 'Evening Protocol', icon: 'fas fa-moon', color: '#8b5cf6', desc: 'Winding down' },
};

// Category weights per period
const CAT_WEIGHTS = {
  closed: [0, 0, 5, 15, 5, 0, 5, 5, 65],
  early_morning: [5, 10, 20, 10, 15, 5, 15, 5, 0],
  morning_rush: [35, 20, 3, 5, 3, 10, 3, 10, 0],
  late_morning: [10, 10, 20, 10, 10, 15, 10, 10, 0],
  afternoon: [8, 8, 25, 10, 10, 20, 10, 5, 0],
  post_lunch: [10, 10, 15, 10, 10, 15, 15, 10, 0],
  evening_rush: [30, 25, 3, 8, 3, 10, 3, 12, 0],
  late_evening: [5, 10, 15, 20, 10, 5, 15, 10, 0],
};

// Time-specific messages
const MESSAGES = {
  closed: {
    'Metro Closed': ['Metro is closed, had to take auto', 'Waiting for first metro at 6 AM', 'No service, took cab', 'Station gates locked', 'Metro closed — night bus only', 'Wish metro ran 24 hours', 'No info display outside station', 'Waiting at station not knowing it\'s closed'],
    Safety: ['Station area poorly lit', 'No staff visible outside', 'Security guard absent', 'Good police patrol near station'],
    Cleanliness: ['Night cleaning in progress', 'Construction debris near exit', 'Station area littered at night'],
  },
  morning_rush: {
    Overcrowding: ['Packed like sardines at 9 AM', 'Couldn\'t board first 2 trains', 'Platform dangerously crowded', 'People pushing to board', 'Crush at interchange', 'Long queue at entry gates', 'Women\'s coach also packed'],
    Delay: ['8 min gap during rush', '5 min delay at peak', 'Signal issue caused holdup', 'Door malfunction delayed train'],
    'AC Issue': ['AC can\'t handle crowd heat', 'Coach like a sauna at 9 AM', 'Ventilation failing with full load'],
    Noise: ['Rush hour announcements drowned', 'Can\'t hear in the crowd', 'Platform noise unbearable'],
  },
  evening_rush: {
    Overcrowding: ['Evening rush worse than morning', 'Return commute is nightmare', 'Blue Line packed at 6 PM', 'Office crowd overwhelming', 'Standing 45 min in evening metro'],
    Delay: ['12 min delay at 6 PM', 'Huge gap between evening trains', 'Technical issue at peak', 'Service disrupted 20 min'],
    Noise: ['Crowd noise deafening', 'Very chaotic platform at 7 PM', 'Everyone honking outside station'],
  },
  early_morning: {
    Cleanliness: ['Station spotless at 7 AM', 'Floors just mopped, slippery', 'Clean and fresh early morning'],
    'Staff Behavior': ['Staff very helpful early morning', 'Guard wished good morning', 'Ticket counter opened late'],
    Accessibility: ['Lift working fine this morning', 'Escalator under maintenance'],
  },
  afternoon: {
    'AC Issue': ['AC too cold inside coach', 'Perfect temperature afternoon', 'One coach AC not working'],
    Cleanliness: ['Post-lunch mess on platform', 'Food wrappers everywhere', 'Well maintained station'],
  },
};

const GENERIC_MESSAGES = {
  Overcrowding: ['Standing room only', 'Moderately crowded', 'Platform overflowing', 'Comfortable space today'],
  Delay: ['Train arrived late', 'Long gap between trains', 'On time today', 'Slight delay noticed'],
  Cleanliness: ['Station floors dirty', 'Washrooms need attention', 'Well maintained', 'Trash on platform'],
  Safety: ['CCTV not working', 'Good security presence', 'Escalator broken', 'Emergency exit blocked'],
  Accessibility: ['Lift out of service', 'No wheelchair ramp', 'Tactile path damaged', 'Great accessibility signage'],
  'AC Issue': ['AC not working', 'Too cold inside', 'Perfect temperature', 'Poor ventilation'],
  'Staff Behavior': ['Staff was helpful', 'Rude at ticket counter', 'Guard helped with directions', 'No staff at info desk'],
  Noise: ['Announcements too loud', 'Couldn\'t hear station name', 'Music playing nicely', 'Very noisy platform'],
  'Metro Closed': ['Metro service unavailable', 'Station closed for the night'],
};

function generateOneFeedback(id, timestamp) {
  const hour = timestamp.getHours();
  const period = getMetroPeriod(hour);
  const weights = CAT_WEIGHTS[period];
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  let catIdx = 0;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { catIdx = i; break; }
  }
  const category = ALL_CATEGORIES[catIdx];
  const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
  const line = LINES[Math.floor(Math.random() * LINES.length)];

  // Sentiment based on category + period
  let sw;
  if (category === 'Metro Closed') sw = [0.05, 0.25, 0.70];
  else if (period === 'morning_rush' || period === 'evening_rush') {
    sw = (category === 'Overcrowding' || category === 'Delay') ? [0.05, 0.15, 0.80] : [0.25, 0.35, 0.40];
  } else if (period === 'closed') sw = [0.10, 0.30, 0.60];
  else if (period === 'early_morning') sw = [0.55, 0.30, 0.15];
  else sw = [0.35, 0.35, 0.30];

  const r = Math.random();
  const sentiment = r < sw[0] ? 'Positive' : r < sw[0] + sw[1] ? 'Neutral' : 'Negative';
  const severity = sentiment === 'Negative' ? 3 + Math.floor(Math.random() * 3) : sentiment === 'Neutral' ? 2 + Math.floor(Math.random() * 2) : 1;

  const pool = MESSAGES[period]?.[category] || GENERIC_MESSAGES[category] || ['Feedback submitted'];
  const message = pool[Math.floor(Math.random() * pool.length)];

  return { id, category, station, line, sentiment, severity, message, timestamp, upvotes: Math.floor(Math.random() * 50), user: `User_${1000 + Math.floor(Math.random() * 9000)}`, period };
}

function generateFeedback(count = 250) {
  const now = Date.now();
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(generateOneFeedback(i + 1, new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000)));
  return arr.sort((a, b) => b.timestamp - a.timestamp);
}

// ═══════════════════════════════════════════════
// Dashboard Component
// ═══════════════════════════════════════════════

export default function AdminDashboard({ onClose, user, onLogout }) {
  const [feedbacks, setFeedbacks] = useState(() => generateFeedback(250));
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLine, setFilterLine] = useState('All');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [realTimeTick, setRealTimeTick] = useState(0);
  const [liveFeed, setLiveFeed] = useState([]);

  // Live: new feedback trickles in every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeTick(t => t + 1);
      const fb = generateOneFeedback(Date.now(), new Date());
      setLiveFeed(prev => [fb, ...prev].slice(0, 5));
      setFeedbacks(prev => [fb, ...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredFeedbacks = useMemo(() => {
    const msMap = { '24h': 864e5, '3d': 2592e5, '7d': 6048e5, '30d': 2592e6 };
    const cutoff = Date.now() - (msMap[timeRange] || msMap['7d']);
    return feedbacks.filter(f => {
      if (filterCategory !== 'All' && f.category !== filterCategory) return false;
      if (filterLine !== 'All' && f.line !== filterLine) return false;
      if (filterSentiment !== 'All' && f.sentiment !== filterSentiment) return false;
      if (f.timestamp.getTime() < cutoff) return false;
      if (searchQuery && !f.message.toLowerCase().includes(searchQuery.toLowerCase()) && !f.station.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [feedbacks, filterCategory, filterLine, filterSentiment, timeRange, searchQuery]);

  const perPage = 10;
  const totalPages = Math.ceil(filteredFeedbacks.length / perPage);
  const paginated = filteredFeedbacks.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Charts
  const categoryData = useMemo(() => {
    const c = {};
    filteredFeedbacks.forEach(f => { c[f.category] = (c[f.category] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredFeedbacks]);

  const sentimentData = useMemo(() => {
    const c = { Positive: 0, Neutral: 0, Negative: 0 };
    filteredFeedbacks.forEach(f => c[f.sentiment]++);
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredFeedbacks]);

  const lineData = useMemo(() => {
    const c = {};
    filteredFeedbacks.forEach(f => { c[f.line] = (c[f.line] || 0) + 1; });
    const SHORT = { Red: 'Red', Yellow: 'Yel', Blue: 'Blue', Green: 'Grn', Violet: 'Vio', Magenta: 'Mag', Pink: 'Pink', Orange: 'Org' };
    return Object.entries(c).map(([name, value]) => {
      const short = name.replace(' Line', '');
      return { name: SHORT[short] || short, fullName: short, value, fill: LINE_COLORS[name] || '#6b7280' };
    }).sort((a, b) => b.value - a.value);
  }, [filteredFeedbacks]);

  const trendData = useMemo(() => {
    const days = {};
    filteredFeedbacks.forEach(f => {
      const d = f.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!days[d]) days[d] = { day: d, Positive: 0, Neutral: 0, Negative: 0 };
      days[d][f.sentiment]++;
    });
    return Object.values(days).reverse();
  }, [filteredFeedbacks]);

  const stationHotspots = useMemo(() => {
    const c = {};
    filteredFeedbacks.filter(f => f.sentiment === 'Negative').forEach(f => { c[f.station] = (c[f.station] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredFeedbacks]);

  // KPIs
  const totalReports = filteredFeedbacks.length;
  const negPct = totalReports ? Math.round(filteredFeedbacks.filter(f => f.sentiment === 'Negative').length / totalReports * 100) : 0;
  const avgSev = totalReports ? (filteredFeedbacks.reduce((s, f) => s + f.severity, 0) / totalReports).toFixed(1) : 0;
  const topIssue = categoryData[0]?.name || 'N/A';

  const SC = { Positive: '#22c55e', Neutral: '#eab308', Negative: '#ef4444' };
  const SEV_C = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

  const now = new Date();
  const hour = now.getHours();
  const period = getMetroPeriod(hour);
  const pInfo = PERIOD_INFO[period];
  const metroOpen = hour >= 6 && hour < 23;
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top bar */}
      <div className="bg-[#0f172a]/60 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-50 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-lg sm:text-xl shadow-xl shadow-blue-500/20 flex-shrink-0 relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <i className="fas fa-chart-line relative"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-normal font-display truncate">Operations Intel</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 tracking-[0.1em] sm:tracking-[0.2em] mt-0.5 hidden sm:block">Delhi Transit • Live Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden lg:block text-right">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest leading-none mb-1">{dateStr}</p>
              <p className="text-sm font-bold text-blue-400 tracking-wide">{timeStr}</p>
            </div>
            <div className="h-10 w-px bg-white/5 mx-2 hidden lg:block"></div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-blue-400 tracking-widest">Live</span>
            </div>
            <button onClick={onClose} className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold bg-[#020617] border border-gray-800 hover:border-blue-500/50 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95">
              <i className="fas fa-chevron-left sm:mr-2"></i> <span className="hidden sm:inline">Exit</span>
            </button>
            {user && (
              <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-6 border-l border-white/5">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-white font-bold tracking-wide">{user.name || user.username}</p>
                  <p className="text-[9px] font-bold text-gray-500 tracking-widest">{user.role === 'super_admin' ? 'System Overseer' : 'Traffic Mod'}</p>
                </div>
                <button onClick={onLogout} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer border border-red-500/20">
                  <i className="fas fa-power-off"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Metro Status Banner */}
        <div className="rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group shadow-2xl"
          style={{ borderColor: pInfo.color + '20', backgroundColor: pInfo.color + '05' }}>

          {/* Animated glow */}
          <div className="absolute -left-20 -top-20 w-60 h-60 rounded-full blur-[100px] opacity-20 transition-opacity group-hover:opacity-30"
            style={{ backgroundColor: pInfo.color }}></div>

          <div className="flex items-center gap-4 sm:gap-6 relative min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl shadow-xl shadow-black/40 relative overflow-hidden flex-shrink-0"
              style={{ backgroundColor: pInfo.color + '20', border: `1px solid ${pInfo.color}30` }}>
              <div className="absolute inset-0 bg-white/5 blur-lg"></div>
              <i className={`${pInfo.icon || 'fas fa-clock'} text-base sm:text-lg`}></i>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-lg sm:text-2xl font-bold text-white tracking-normal font-display">{pInfo.label}</span>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full tracking-widest shadow-inner"
                  style={{ backgroundColor: pInfo.color + '20', color: pInfo.color, border: `1px solid ${pInfo.color}30` }}>
                  {metroOpen ? 'Operational' : 'Hibernating'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-medium tracking-wide">{pInfo.desc}</p>
            </div>
          </div>
          <div className="text-left md:text-right relative">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 tracking-[0.15em] sm:tracking-[0.2em] mb-2 px-2 sm:px-3 py-1 bg-black/30 rounded-full w-fit md:ml-auto">Intelligence Feed Active</p>
            <p className="text-xs sm:text-sm font-bold tracking-wide" style={{ color: pInfo.color }}>
              {period === 'closed' ? '🚨 Service suspended' :
                period === 'morning_rush' || period === 'evening_rush' ? '⚠️ Peak load detected' :
                  period === 'early_morning' ? '✅ Stations clean' :
                    '✅ Nominal commuter flow'}
            </p>
          </div>
        </div>

        {/* Live Feed Banner */}
        {liveFeed.length > 0 && (
          <div className="bg-[#0f172a]/30 backdrop-blur-sm border border-white/5 rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <i className="fas fa-satellite fa-5x text-blue-500"></i>
            </div>
            <h3 className="text-xs font-bold text-gray-300 tracking-[0.25em] mb-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Real-time Inflow • <span className="text-blue-500">Sub-minute Latency</span>
            </h3>
            <div className="space-y-2">
              {liveFeed.map((f, i) => (
                <div key={f.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 text-xs font-medium px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all hover:bg-white/5 ${i === 0 ? 'bg-blue-600/10 ring-1 ring-blue-500/20' : 'bg-black/20'}`}>
                  <span className="text-gray-500 font-mono text-[10px] sm:text-xs tracking-normal">{f.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  <span className="text-white font-bold tracking-wide truncate max-w-[120px] sm:max-w-none">{f.station}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest border border-white/5 shadow-sm" style={{ backgroundColor: LINE_COLORS[f.line] + '30', color: LINE_COLORS[f.line], borderColor: LINE_COLORS[f.line] + '40' }}>{f.line.replace(' Line', '')}</span>
                  <span className="text-gray-400 hidden sm:inline flex-1 truncate">"{f.message}"</span>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-lg leading-none">
                      {f.sentiment === 'Positive' ? <i className="fas fa-smile text-emerald-500"></i> :
                        f.sentiment === 'Neutral' ? <i className="fas fa-meh text-amber-500"></i> :
                          <i className="fas fa-frown text-red-500"></i>}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest" style={{ color: SC[f.sentiment] }}>{f.sentiment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[1.5rem] hover:border-blue-500/30 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-2 sm:mb-4 gap-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 text-sm sm:text-xl border border-blue-500/20 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform flex-shrink-0">
                <i className="fas fa-file-alt"></i>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-emerald-500 tracking-wider sm:tracking-widest bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">Total</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-white tracking-normal font-display">{totalReports}</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 tracking-wider sm:tracking-[0.2em] mt-1">Intelligence Logs</p>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[1.5rem] hover:border-blue-500/30 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-2 sm:mb-4 gap-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 text-sm sm:text-xl border border-red-500/20 shadow-lg shadow-red-500/5 group-hover:scale-110 transition-transform flex-shrink-0">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-red-500 tracking-wider sm:tracking-widest bg-red-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">Critical</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-white tracking-normal font-display">{negPct}%</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 tracking-wider sm:tracking-[0.2em] mt-1">Negativity Index</p>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[1.5rem] hover:border-blue-500/30 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-2 sm:mb-4 gap-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 text-sm sm:text-xl border border-orange-500/20 shadow-lg shadow-orange-500/5 group-hover:scale-110 transition-transform flex-shrink-0">
                <i className="fas fa-bolt"></i>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-orange-400 tracking-wider sm:tracking-widest bg-orange-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">Weighted</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-white tracking-normal font-display">{avgSev}</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 tracking-wider sm:tracking-[0.2em] mt-1">Avg Severity</p>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[1.5rem] hover:border-blue-500/30 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-2 sm:mb-4 gap-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 text-sm sm:text-xl border border-purple-500/20 shadow-lg shadow-purple-500/5 group-hover:scale-110 transition-transform flex-shrink-0">
                <i className="fas fa-star"></i>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-purple-400 tracking-wider sm:tracking-widest bg-purple-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">Hotspot</span>
            </div>
            <p className="text-lg sm:text-3xl font-bold text-white tracking-normal font-display truncate">{topIssue}</p>
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 tracking-wider sm:tracking-[0.2em] mt-1">Primary Issue</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <h4 className="text-[10px] font-bold text-gray-500 tracking-widest">Filter Matrix:</h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select value={timeRange} onChange={e => { setTimeRange(e.target.value); setCurrentPage(1); }} className="bg-[#020617] border border-gray-800 rounded-xl px-2 py-2 text-[10px] font-bold tracking-wider text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer flex-1 sm:flex-none min-w-0">
                <option value="24h">24H</option>
                <option value="3d">72H</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>

              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }} className="bg-[#020617] border border-gray-800 rounded-xl px-2 py-2 text-[10px] font-bold tracking-wider text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer flex-1 sm:flex-none min-w-0">
                <option value="All">All Categories</option>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={filterLine} onChange={e => { setFilterLine(e.target.value); setCurrentPage(1); }} className="bg-[#020617] border border-gray-800 rounded-xl px-2 py-2 text-[10px] font-bold tracking-wider text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer flex-1 sm:flex-none min-w-0">
                <option value="All">All Lines</option>
                {LINES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              <select value={filterSentiment} onChange={e => { setFilterSentiment(e.target.value); setCurrentPage(1); }} className="bg-[#020617] border border-gray-800 rounded-xl px-2 py-2 text-[10px] font-bold tracking-wider text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer flex-1 sm:flex-none min-w-0">
                <option value="All">All Polarity</option>
                {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors"></i>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-[#020617] border border-gray-800 rounded-xl sm:rounded-2xl text-[10px] font-bold tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em] mb-6 flex items-center gap-3">
              <i className="fas fa-list-ul text-blue-500"></i> Domain Analysis
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={85} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '10px' }} itemStyle={{ color: '#ffffffff', fontSize: '10px', fontWeight: 'bold' }} labelStyle={{ color: '#ffffffff', fontWeight: 'bold', fontSize: '11px' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em] mb-6 flex items-center gap-3">
              <i className="fas fa-chart-pie text-indigo-500"></i> Satisfaction Mix
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={6} dataKey="value" stroke="none">
                  {sentimentData.map(e => <Cell key={e.name} fill={SC[e.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#e3e5ebff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em] mb-6 flex items-center gap-3">
              <i className="fas fa-network-wired text-cyan-500"></i> Vector Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={40} interval={0} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '10px' }} itemStyle={{ color: '#ffffffff', fontSize: '10px', fontWeight: 'bold' }} labelStyle={{ color: '#ffffffff', fontWeight: 'bold', fontSize: '11px' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={15}>
                  {lineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trends Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em] mb-6 flex items-center gap-3">
              <i className="fas fa-chart-line text-blue-500"></i> Temporal Intensity Metrics
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="negTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  <linearGradient id="posTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" strokeWidth={3} fill="url(#negTrend)" />
                <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#eab308" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" strokeWidth={3} fill="url(#posTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em] mb-6 flex items-center gap-3">
              <i className="fas fa-fire text-red-500"></i> Operational Hotspots
            </h3>
            <div className="space-y-3">
              {stationHotspots.map((s, i) => {
                const mx = stationHotspots[0]?.value || 1;
                return (
                  <div key={s.name} className="flex items-center gap-4 bg-black/20 p-2.5 rounded-xl border border-white/5 transition-all hover:bg-black/40">
                    <span className="text-[10px] font-bold text-gray-600 w-5 text-center font-mono">#{i + 1}</span>
                    <span className="text-[10px] font-bold text-white tracking-wide w-36 truncate">{s.name}</span>
                    <div className="flex-1 bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(s.value / mx) * 100}%`, backgroundColor: i < 2 ? '#ef4444' : i < 4 ? '#f97316' : '#eab308', boxShadow: `0 0 10px ${i < 2 ? '#ef444440' : '#f9731640'}` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 w-8 text-right font-mono">{s.value}</span>
                  </div>
                );
              })}
              {stationHotspots.length === 0 && <p className="text-[10px] font-bold text-gray-600 tracking-widest text-center py-12">Clear Sector Map</p>}
            </div>
          </div>
        </div>

        {/* Feedback Inventory */}
        <div className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
            <h3 className="text-[10px] font-bold text-white tracking-[0.25em]">Intelligence Inventory</h3>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] font-bold tracking-widest text-gray-500">
              <span className="text-blue-500">{currentPage}</span> / <span className="text-blue-500">{totalPages || 1}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center bg-[#020617] text-white rounded-lg border border-white/10 hover:border-blue-500/50 disabled:opacity-20 transition-all cursor-pointer shadow-lg active:scale-95">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="w-8 h-8 flex items-center justify-center bg-[#020617] text-white rounded-lg border border-white/10 hover:border-blue-500/50 disabled:opacity-20 transition-all cursor-pointer shadow-lg active:scale-95">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-[10px] font-bold text-gray-500 tracking-widest border-b border-white/5">
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Time</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Station</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">Log</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {paginated.map(f => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                      <p className="text-[10px] font-bold text-white tracking-normal">{f.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] font-bold text-gray-500 tracking-widest mt-0.5">{f.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-6 sm:h-8 rounded-full shadow-sm" style={{ backgroundColor: LINE_COLORS[f.line] }}></div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">{f.station}</p>
                          <p className="text-[9px] sm:text-[10px] font-bold tracking-widest" style={{ color: LINE_COLORS[f.line] }}>{f.line.replace(' Line', '')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 hidden sm:table-cell">
                      <div className="max-w-md">
                        <span className="text-[9px] font-bold text-blue-500 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 mb-2 inline-block">{f.category}</span>
                        <p className="text-sm text-gray-300 leading-relaxed font-medium truncate max-w-[300px]">"{f.message}"</p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">
                            {f.sentiment === 'Positive' ? <i className="fas fa-smile text-emerald-500"></i> :
                              f.sentiment === 'Neutral' ? <i className="fas fa-meh text-amber-500"></i> :
                                <i className="fas fa-frown text-red-500"></i>}
                          </span>
                          <span className="text-[10px] font-bold tracking-widest" style={{ color: SC[f.sentiment] }}>{f.sentiment}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className="w-3 h-1 rounded-full shadow-sm" style={{ backgroundColor: s <= f.severity ? SEV_C[f.severity] : '#1f2937' }}></div>
                          ))}
                        </div>
                        <span className="text-[9px] font-semibold text-gray-600 tracking-widest mt-1">Impact: {f.upvotes} units</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginated.length === 0 && (
            <div className="py-20 text-center bg-black/20">
              <h4 className="text-[10px] font-bold text-gray-600 tracking-widest">Inventory Void</h4>
            </div>
          )}
        </div>

        {/* Dashboard Footer */}
        <footer className="mt-8 border-t border-white/5 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <i className="fas fa-subway text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200">Delhi Route Optimizer</h3>
                <p className="text-[10px] text-gray-500">Smart Commute Planning</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              {['twitter', 'facebook', 'instagram', 'linkedin'].map((icon) => (
                <a key={icon} href="#" className="hover:text-blue-400 transition hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                  <i className={`fab fa-${icon}`}></i>
                </a>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center text-[10px] text-gray-600">
            <p>© 2026 Delhi Route Optimizer • Data provided by DMRC & DTC</p>
            <p className="mt-1">Demonstration project for route optimization concepts.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}