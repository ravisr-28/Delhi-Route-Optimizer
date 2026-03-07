import { useState, useEffect, useCallback } from 'react';
import { getCrowdLevel, getTimePeriod } from '../utils/stationInfo';

// Key stations for real-time tracking
const METRO_STATIONS = [
  { name: 'Rajiv Chowk', line: 'Blue Line', lineColor: '#005BA9', code: 'RJC' },
  { name: 'Kashmere Gate', line: 'Yellow Line', lineColor: '#FFD700', code: 'KSG' },
  { name: 'New Delhi', line: 'Yellow Line', lineColor: '#FFD700', code: 'ND' },
  { name: 'Hauz Khas', line: 'Magenta Line', lineColor: '#FF00FF', code: 'HK' },
  { name: 'Central Secretariat', line: 'Violet Line', lineColor: '#8A2BE2', code: 'CS' },
  { name: 'Dwarka Sector 21', line: 'Blue Line', lineColor: '#005BA9', code: 'D21' },
  { name: 'Huda City Centre', line: 'Yellow Line', lineColor: '#FFD700', code: 'HCC' },
  { name: 'Noida Sector 18', line: 'Blue Line', lineColor: '#005BA9', code: 'NS18' },
  { name: 'AIIMS', line: 'Yellow Line', lineColor: '#FFD700', code: 'AIIMS' },
  { name: 'Chandni Chowk', line: 'Yellow Line', lineColor: '#FFD700', code: 'CC' },
  { name: 'Lajpat Nagar', line: 'Violet Line', lineColor: '#8A2BE2', code: 'LJN' },
  { name: 'Karol Bagh', line: 'Blue Line', lineColor: '#005BA9', code: 'KLB' },
];

const BUS_ROUTES = [
  { name: 'Route 423', from: 'Nehru Place', to: 'Rajouri Garden', color: '#8B4513' },
  { name: 'Route 522', from: 'Ambedkar Nagar', to: 'Rajouri Garden', color: '#D2691E' },
  { name: 'Route 764', from: 'Anand Vihar', to: 'Connaught Place', color: '#BDB76B' },
  { name: 'Route 24', from: 'Kashmere Gate', to: 'Rohini Sec 24', color: '#6B8E23' },
  { name: 'Route 181', from: 'Badarpur Border', to: 'Dilli Haat', color: '#556B2F' },
  { name: 'Route 347', from: 'Dwarka Sec 14', to: 'Rajouri Garden', color: '#2E8B57' },
  { name: 'Route 620', from: 'Mehrauli', to: 'Lajpat Nagar', color: '#DAA520' },
  { name: 'Route 534', from: 'Kashmere Gate', to: 'Shalimar Bagh', color: '#8FBC8F' },
];

// Generate realistic next arrival times based on current time
function generateArrivals(frequency, count = 3) {
  const now = new Date();
  const arrivals = [];
  const freqMinutes = parseInt(frequency) || 5;
  // Random offset for realism (0 to frequency)
  const offset = Math.floor(Math.random() * freqMinutes);

  for (let i = 0; i < count; i++) {
    const mins = offset + i * freqMinutes;
    const arrival = new Date(now.getTime() + mins * 60000);
    arrivals.push({
      time: arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      mins,
      platform: Math.random() > 0.5 ? 1 : 2,
    });
  }
  return arrivals;
}

// Generate bus ETA
function generateBusETA() {
  const now = new Date();
  const hour = now.getHours();
  const isPeak = (hour >= 8 && hour < 10) || (hour >= 17 && hour < 20);

  const baseDelay = isPeak ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 8) + 2;
  const status = baseDelay > 12 ? 'Delayed' : baseDelay > 8 ? 'Slightly Delayed' : 'On Time';
  const statusColor = baseDelay > 12 ? '#EF4444' : baseDelay > 8 ? '#F97316' : '#22C55E';

  return { eta: baseDelay, status, statusColor, isPeak };
}

export default function RealTimePanel({ isOpen, onClose }) {
  const [tab, setTab] = useState('metro'); // 'metro' | 'bus'
  const [metroData, setMetroData] = useState([]);
  const [busData, setBusData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const metroOpen = hour >= 6 && hour < 23;
  const timePeriod = getTimePeriod();

  const refreshData = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      // Generate metro data
      const metro = METRO_STATIONS.map(station => {
        const crowd = getCrowdLevel(station.name);
        const arrivals = metroOpen ? generateArrivals('4', 3) : [];
        return { ...station, crowd, arrivals, operational: metroOpen };
      });
      setMetroData(metro);

      // Generate bus data
      const buses = BUS_ROUTES.map(route => {
        const eta = generateBusETA();
        const occupancy = Math.floor(Math.random() * 40) + 30;
        return { ...route, ...eta, occupancy };
      });
      setBusData(buses);

      setLastRefresh(new Date());
      setRefreshing(false);
    }, 600);
  }, [metroOpen]);

  // Refresh on open and every 30s
  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, refreshData]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-[#020617]/80 backdrop-blur-2xl border-l border-white/10 z-[999] flex flex-col overflow-hidden shadow-2xl"
        style={{ animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="bg-[#0f172a]/80 backdrop-blur-md p-6 border-b border-white/5 flex-shrink-0 relative overflow-hidden group">
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full"></div>

          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                <i className="fas fa-satellite-dish text-white"></i>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Real-Time Intelligence</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-blue-400 font-medium flex items-center gap-2">
                    <i className={timePeriod.icon}></i> {timePeriod.label}
                  </p>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${metroOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {metroOpen ? 'NETWORK ACTIVE' : 'NETWORK CLOSED'}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer border border-white/5">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Live indicator + refresh */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Sync</span>
              </div>
              <span className="text-[10px] text-gray-500">
                Last: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-all cursor-pointer disabled:opacity-50 border border-blue-500/20"
            >
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-sync fa-spin"></i> Syncing
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className="fas fa-sync"></i> Refresh
                </span>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 p-1 bg-[#020617] rounded-2xl border border-white/5">
            <button
              onClick={() => setTab('metro')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === 'metro' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <i className="fas fa-subway"></i> Metro Network
            </button>
            <button
              onClick={() => setTab('bus')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${tab === 'bus' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <i className="fas fa-bus"></i> Bus Fleet
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {tab === 'metro' && (
            <>
              {!metroOpen && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-moon text-3xl text-red-500"></i>
                  </div>
                  <h3 className="text-white font-bold">Network Offline</h3>
                  <p className="text-sm text-red-400/80 mt-1">Metro service is currently closed (11 PM – 6 AM)</p>
                  <div className="mt-4 pt-4 border-t border-red-500/10 flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>First Train: 06:00 AM</span>
                  </div>
                </div>
              )}

              {metroData.map((station, i) => (
                <div key={i} className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                  {/* Station Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 rounded-full shadow-lg shadow-black/50" style={{ backgroundColor: station.lineColor }}></div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{station.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{station.line} <span className="mx-1 opacity-30">•</span> {station.code}</p>
                      </div>
                    </div>
                    {/* Crowd badge */}
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <i className="fas fa-users text-[10px]" style={{ color: station.crowd.color }}></i>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider"
                          style={{ color: station.crowd.color }}>
                          {station.crowd.level}
                        </span>
                      </div>
                      <div className="w-20 bg-gray-800/50 rounded-full h-1 mt-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${station.crowd.percent}%`, backgroundColor: station.crowd.color }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrivals */}
                  {station.operational && station.arrivals.length > 0 ? (
                    <div className="space-y-2">
                      {station.arrivals.map((arr, j) => (
                        <div key={j} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${j === 0 ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-white/[0.02] border border-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border ${j === 0 ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-gray-800/50 border-white/5 text-gray-500'}`}>
                              P{arr.platform}
                            </div>
                            {j === 0 && <span className="text-[9px] font-extrabold text-blue-400 tracking-tighter uppercase px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">Arriving Soon</span>}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-medium text-gray-400">{arr.time}</span>
                            <span className={`text-sm font-black italic tracking-tight ${j === 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                              {arr.mins === 0 ? 'DUE' : `${arr.mins} MIN`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No Active Telemetry</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {tab === 'bus' && (
            <>
              {busData.map((bus, i) => (
                <div key={i} className="bg-[#0f172a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                  {/* Bus Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-xl shadow-black/30 relative overflow-hidden"
                        style={{ backgroundColor: bus.color }}>
                        <div className="absolute inset-0 bg-white/10"></div>
                        <i className="fas fa-bus relative text-white"></i>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight uppercase">{bus.name}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">{bus.from} <i className="fas fa-arrow-right mx-1 text-[8px] opacity-30"></i> {bus.to}</p>
                      </div>
                    </div>
                    {/* Status badge */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border"
                        style={{ backgroundColor: bus.statusColor + '10', color: bus.statusColor, borderColor: bus.statusColor + '20' }}>
                        {bus.status}
                      </span>
                    </div>
                  </div>

                  {/* ETA & Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#020617]/40 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-white italic tracking-tighter">{bus.eta}<span className="text-[10px] text-gray-500 uppercase not-italic ml-1">min</span></p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Arrival</p>
                    </div>
                    <div className="bg-[#020617]/40 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-black italic tracking-tighter" style={{ color: bus.occupancy > 70 ? '#EF4444' : bus.occupancy > 40 ? '#F97316' : '#22C55E' }}>{bus.occupancy}%</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Load</p>
                    </div>
                    <div className="bg-[#020617]/40 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                      <div className={`text-sm ${bus.isPeak ? 'text-orange-500' : 'text-blue-500'}`}>
                        <i className={`fas ${bus.isPeak ? 'fa-fire' : 'fa-check-double'}`}></i>
                      </div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{bus.isPeak ? 'Peak' : 'Free'}</p>
                    </div>
                  </div>

                  {/* Progress bar for ETA */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Route Progress</span>
                      <span className="text-[10px] font-black italic" style={{ color: bus.statusColor }}>{100 - bus.eta * 2}% Complete</span>
                    </div>
                    <div className="w-full bg-[#020617] rounded-full h-1.5 p-0.5 border border-white/5">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(10, 100 - bus.eta * 2)}%`, backgroundColor: bus.statusColor, boxShadow: `0 0 10px ${bus.statusColor}40` }}>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#0f1728]">
          <p className="text-[10px] text-gray-500 text-center">
            Data refreshes every 30 seconds • {metroData.length + busData.length} services tracked • Simulated data for demo
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}