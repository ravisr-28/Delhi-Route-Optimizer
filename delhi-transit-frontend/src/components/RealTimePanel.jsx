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
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-[#0b0f19] border-l border-white/10 z-[999] flex flex-col overflow-hidden shadow-2xl"
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📡</div>
              <div>
                <h2 className="text-lg font-bold text-white">Real-Time Updates</h2>
                <p className="text-xs text-emerald-100">{timePeriod.emoji} {timePeriod.label} • {metroOpen ? '🟢 Metro Running' : '🔴 Metro Closed'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer">✕</button>
          </div>

          {/* Live indicator + refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
              <span className="text-xs text-emerald-100">
                Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 text-white transition cursor-pointer disabled:opacity-50"
            >
              {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setTab('metro')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                tab === 'metro' ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🚇 Metro ({metroData.length})
            </button>
            <button
              onClick={() => setTab('bus')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                tab === 'bus' ? 'bg-white text-emerald-700' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🚌 Bus ({busData.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'metro' && (
            <>
              {!metroOpen && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                  <span className="text-2xl">🌙</span>
                  <p className="text-sm text-red-400 font-medium mt-1">Metro service closed (11 PM – 6 AM)</p>
                  <p className="text-xs text-gray-500 mt-1">First train at 6:00 AM</p>
                </div>
              )}

              {metroData.map((station, i) => (
                <div key={i} className="bg-[#111827] border border-white/10 rounded-xl p-4 hover:border-white/20 transition">
                  {/* Station Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: station.lineColor }}></div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{station.name}</h3>
                        <p className="text-[11px] text-gray-400">{station.line} • {station.code}</p>
                      </div>
                    </div>
                    {/* Crowd badge */}
                    <div className="text-right">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: station.crowd.color + '20', color: station.crowd.color }}>
                        {station.crowd.level}
                      </span>
                      <div className="w-16 bg-gray-700 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${station.crowd.percent}%`, backgroundColor: station.crowd.color }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrivals */}
                  {station.operational && station.arrivals.length > 0 ? (
                    <div className="space-y-1.5">
                      {station.arrivals.map((arr, j) => (
                        <div key={j} className={`flex items-center justify-between px-3 py-2 rounded-lg ${j === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03]'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Platform {arr.platform}</span>
                            {j === 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">NEXT</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-300">{arr.time}</span>
                            <span className={`text-xs font-bold ${j === 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {arr.mins === 0 ? 'NOW' : `${arr.mins} min`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">Service unavailable</p>
                  )}
                </div>
              ))}
            </>
          )}

          {tab === 'bus' && (
            <>
              {busData.map((bus, i) => (
                <div key={i} className="bg-[#111827] border border-white/10 rounded-xl p-4 hover:border-white/20 transition">
                  {/* Bus Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: bus.color }}>
                        🚌
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{bus.name}</h3>
                        <p className="text-[11px] text-gray-400">{bus.from} → {bus.to}</p>
                      </div>
                    </div>
                    {/* Status badge */}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bus.statusColor + '20', color: bus.statusColor }}>
                      {bus.status}
                    </span>
                  </div>

                  {/* ETA & Details */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-white">{bus.eta} <span className="text-xs text-gray-400">min</span></p>
                      <p className="text-[10px] text-gray-500">Next Bus</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold" style={{ color: bus.occupancy > 60 ? '#F97316' : '#22C55E' }}>{bus.occupancy}%</p>
                      <p className="text-[10px] text-gray-500">Occupancy</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-white">{bus.isPeak ? '🔥' : '✅'}</p>
                      <p className="text-[10px] text-gray-500">{bus.isPeak ? 'Peak Hour' : 'Normal'}</p>
                    </div>
                  </div>

                  {/* Progress bar for ETA */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">ETA</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(10, 100 - bus.eta * 5)}%`, backgroundColor: bus.statusColor }}>
                      </div>
                    </div>
                    <span className="text-[10px]" style={{ color: bus.statusColor }}>{bus.eta} min</span>
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
