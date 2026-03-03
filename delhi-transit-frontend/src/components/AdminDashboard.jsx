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
  closed:        { label: 'Metro Closed',   emoji: '', color: '#ef4444', desc: 'Service unavailable (11 PM – 6 AM)' },
  early_morning: { label: 'Early Morning',  emoji: '', color: '#f97316', desc: 'Light crowd, stations opening' },
  morning_rush:  { label: 'Morning Rush',   emoji: '', color: '#ef4444', desc: 'Peak crowding (8–10 AM)' },
  late_morning:  { label: 'Late Morning',   emoji: '', color: '#eab308', desc: 'Moderate crowd' },
  afternoon:     { label: 'Afternoon',      emoji: '', color: '#22c55e', desc: 'Comfortable off-peak' },
  post_lunch:    { label: 'Post Lunch',     emoji: '', color: '#84cc16', desc: 'Gradually building' },
  evening_rush:  { label: 'Evening Rush',   emoji: '', color: '#ef4444', desc: 'Peak crowding (5–8 PM)' },
  late_evening:  { label: 'Late Evening',   emoji: '', color: '#8b5cf6', desc: 'Winding down' },
};

// Category weights per period
const CAT_WEIGHTS = {
  closed:        [0, 0, 5, 15, 5, 0, 5, 5, 65],
  early_morning: [5, 10, 20, 10, 15, 5, 15, 5, 0],
  morning_rush:  [35, 20, 3, 5, 3, 10, 3, 10, 0],
  late_morning:  [10, 10, 20, 10, 10, 15, 10, 10, 0],
  afternoon:     [8, 8, 25, 10, 10, 20, 10, 5, 0],
  post_lunch:    [10, 10, 15, 10, 10, 15, 15, 10, 0],
  evening_rush:  [30, 25, 3, 8, 3, 10, 3, 12, 0],
  late_evening:  [5, 10, 15, 20, 10, 5, 15, 10, 0],
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
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(' Line', ''), value, fill: LINE_COLORS[name] || '#6b7280' })).sort((a, b) => b.value - a.value);
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
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      {/* Top bar */}
      <div className="bg-[#0f1728] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold">📊</div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            <p className="text-[11px] text-gray-400">Delhi Transit — Crowdsourced Feedback Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">{dateStr}</p>
            <p className="text-sm font-semibold text-white">🕐 {timeStr}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[11px] text-green-400">Live</span>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">← Back to App</button>
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right">
                <p className="text-xs text-white font-medium">{user.name || user.username}</p>
                <p className="text-[10px] text-gray-400">{user.role === 'super_admin' ? 'Super Admin' : 'Moderator'}</p>
              </div>
              <button onClick={onLogout} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer">Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* Metro Status Banner */}
        <div className="rounded-xl p-4 border flex items-center justify-between" style={{ borderColor: pInfo.color + '50', backgroundColor: pInfo.color + '10' }}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{pInfo.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{pInfo.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: pInfo.color + '30', color: pInfo.color }}>
                  {metroOpen ? '🟢 Metro Running' : '🔴 Metro Closed'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{pInfo.desc}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Feedback is weighted to current period</p>
            <p className="text-xs mt-1" style={{ color: pInfo.color }}>
              {period === 'closed' ? '📊 Showing: Metro-closed reports, safety concerns' :
               period === 'morning_rush' || period === 'evening_rush' ? '📊 Showing: Overcrowding & delay dominant' :
               period === 'early_morning' ? '📊 Showing: Cleanliness & staff feedback dominant' :
               '📊 Showing: Balanced feedback mix'}
            </p>
          </div>
        </div>

        {/* Live Feed Banner */}
        {liveFeed.length > 0 && (
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Feed — New reports arriving in real-time
            </h3>
            <div className="space-y-1.5">
              {liveFeed.map((f, i) => (
                <div key={f.id} className={`flex items-center gap-3 text-xs px-3 py-2 rounded-lg ${i === 0 ? 'bg-white/[0.06] ring-1 ring-white/10' : 'bg-white/[0.02]'}`}>
                  <span className="text-gray-500 w-16">{f.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  <span className="text-white font-medium w-32">{f.station}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: LINE_COLORS[f.line] + '25', color: LINE_COLORS[f.line] }}>{f.line.replace(' Line', '')}</span>
                  <span className="text-gray-300 flex-1">{f.message}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: SC[f.sentiment] + '20', color: SC[f.sentiment] }}>
                    {f.sentiment === 'Positive' ? '😊' : f.sentiment === 'Neutral' ? '😐' : '😠'} {f.sentiment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: totalReports, icon: '#', color: 'from-blue-600 to-blue-800', sub: `Last ${timeRange}` },
            { label: 'Negative Sentiment', value: `${negPct}%`, icon: '!', color: 'from-red-600 to-red-800', sub: negPct > 50 ? 'Critical' : negPct > 30 ? 'Needs Attention' : 'Acceptable' },
            { label: 'Avg Severity', value: avgSev, icon: '!', color: 'from-orange-600 to-orange-800', sub: 'Out of 5' },
            { label: 'Top Issue', value: topIssue, icon: '*', color: 'from-purple-600 to-purple-800', sub: `${categoryData[0]?.value || 0} reports` },
          ].map((kpi, i) => (
            <div key={i} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 border border-white/10 shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{kpi.icon}</span>
                <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{kpi.sub}</span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-xs text-white/70 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Filters:</span>
            <select value={timeRange} onChange={e => { setTimeRange(e.target.value); setCurrentPage(1); }} style={{ backgroundColor: '#1e293b', color: '#fff' }} className="border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="24h">Last 24h</option>
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="3d">Last 3 days</option>
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="7d">Last 7 days</option>
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="30d">Last 30 days</option>
            </select>
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }} style={{ backgroundColor: '#1e293b', color: '#fff' }} className="border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="All">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c} style={{ backgroundColor: '#1e293b', color: '#fff' }}>{c}</option>)}
            </select>
            <select value={filterLine} onChange={e => { setFilterLine(e.target.value); setCurrentPage(1); }} style={{ backgroundColor: '#1e293b', color: '#fff' }} className="border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="All">All Lines</option>
              {LINES.map(l => <option key={l} value={l} style={{ backgroundColor: '#1e293b', color: '#fff' }}>{l}</option>)}
            </select>
            <select value={filterSentiment} onChange={e => { setFilterSentiment(e.target.value); setCurrentPage(1); }} style={{ backgroundColor: '#1e293b', color: '#fff' }} className="border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option style={{ backgroundColor: '#1e293b', color: '#fff' }} value="All">All Sentiments</option>
              {SENTIMENTS.map(s => <option key={s} value={s} style={{ backgroundColor: '#1e293b', color: '#fff' }}>{s}</option>)}
            </select>
            <input type="text" placeholder="Search feedback..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48" />
            <span className="ml-auto text-[11px] text-gray-500">{filteredFeedbacks.length} results</span>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">📊 Reports by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={85} tick={{ fill: '#d1d5db', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">😊 Sentiment Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {sentimentData.map(e => <Cell key={e.name} fill={SC[e.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">Reports by Metro Line</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#d1d5db', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {lineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">📈 Feedback Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" tick={{ fill: '#d1d5db', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef444440" />
                <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#eab308" fill="#eab30840" />
                <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e40" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#0f1728] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">🔴 Top Complaint Stations</h3>
            <div className="space-y-2">
              {stationHotspots.map((s, i) => {
                const mx = stationHotspots[0]?.value || 1;
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-5 text-right font-mono">#{i + 1}</span>
                    <span className="text-xs text-white font-medium w-36 truncate">{s.name}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(s.value / mx) * 100}%`, backgroundColor: i < 2 ? '#ef4444' : i < 4 ? '#f97316' : '#eab308' }}></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{s.value}</span>
                  </div>
                );
              })}
              {stationHotspots.length === 0 && <p className="text-xs text-gray-500 text-center py-8">No negative reports</p>}
            </div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-[#0f1728] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">📋 Recent Feedback ({filteredFeedbacks.length})</h3>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              Page {currentPage} of {totalPages || 1}
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer">←</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer">→</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Time</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Station</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Line</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Category</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Feedback</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Sentiment</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Severity</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">👍</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(f => (
                  <tr key={f.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                      {f.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {f.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                    <td className="px-4 py-2.5 text-white font-medium">{f.station}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: LINE_COLORS[f.line] + '25', color: LINE_COLORS[f.line] }}>{f.line.replace(' Line', '')}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">{f.category}</td>
                    <td className="px-4 py-2.5 text-gray-300 max-w-[250px] truncate">{f.message}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: SC[f.sentiment] + '20', color: SC[f.sentiment] }}>
                        {f.sentiment === 'Positive' ? '+' : f.sentiment === 'Neutral' ? '~' : '-'} {f.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s <= f.severity ? SEV_C[f.severity] : '#1f2937' }}></div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{f.upvotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
