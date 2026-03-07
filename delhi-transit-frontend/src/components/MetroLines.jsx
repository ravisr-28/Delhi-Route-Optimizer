import { useState } from "react";
import delhiMetroLines from "../data/metroData";

// Bus routes data (matches LiveMap.jsx)
const busRoutes = {
  'bus-route-24': { name: 'Bus Route 24', color: '#6B8E23', stops: ['ISBT Kashmere Gate', 'Mori Gate', 'Pratap Nagar', 'Shalimar Bagh', 'Azadpur', 'Adarsh Nagar', 'Badli Mor', 'Bawana', 'Narela', 'Rohini Sector 24'], frequency: '15 mins' },
  'bus-route-522': { name: 'Bus Route 522', color: '#D2691E', stops: ['Ambedkar Nagar', 'Khanpur', 'Saket', 'Malviya Nagar', 'Hauz Khas', 'AIIMS', 'Safdarjung', 'Dhaula Kuan', 'Naraina', 'Rajouri Garden'], frequency: '12 mins' },
  'bus-route-423': { name: 'Bus Route 423', color: '#8B4513', stops: ['Nehru Place', 'Lajpat Nagar', 'Defence Colony', 'Lodhi Colony', 'India Gate', 'Connaught Place', 'Karol Bagh', 'Patel Nagar', 'Rajouri Garden'], frequency: '10 mins' },
  'bus-route-181': { name: 'Bus Route 181', color: '#556B2F', stops: ['Badarpur Border', 'Sarita Vihar', 'Jasola', 'Okhla', 'Nehru Place', 'Moolchand', 'AIIMS', 'INA Market', 'Dilli Haat'], frequency: '10 mins' },
  'bus-route-347': { name: 'Bus Route 347', color: '#2E8B57', stops: ['Dwarka Sector 14', 'Dwarka Sector 10', 'Palam Village', 'Mahavir Enclave', 'Janakpuri', 'Tilak Nagar', 'Subhash Nagar', 'Rajouri Garden'], frequency: '18 mins' },
  'bus-route-764': { name: 'Bus Route 764', color: '#BDB76B', stops: ['Anand Vihar ISBT', 'Karkardooma', 'Preet Vihar', 'Laxmi Nagar', 'Akshardham', 'ITO', 'India Gate', 'Central Secretariat', 'Patel Chowk', 'Connaught Place'], frequency: '12 mins' },
  'bus-route-620': { name: 'Bus Route 620', color: '#DAA520', stops: ['Mehrauli', 'Qutub Minar', 'Chhatarpur', 'Vasant Kunj', 'Munirka', 'RK Puram', 'Sarojini Nagar', 'South Extension', 'Lajpat Nagar'], frequency: '15 mins' },
  'bus-route-413': { name: 'Bus Route 413', color: '#CD853F', stops: ['Old Delhi Rly Stn', 'Chandni Chowk', 'Red Fort', 'Jama Masjid', 'Delhi Gate', 'ITO', 'Pragati Maidan', 'Nizamuddin', 'Ashram Chowk', 'Nehru Place'], frequency: '10 mins' },
  'bus-route-901': { name: 'Bus Route 901', color: '#A0522D', stops: ['Badarpur Border', 'Tughlakabad', 'Sangam Vihar', 'Ambedkar Nagar', 'Govindpuri', 'Kalkaji', 'Nehru Place'], frequency: '12 mins' },
  'bus-route-534': { name: 'Bus Route 534', color: '#8FBC8F', stops: ['ISBT Kashmere Gate', 'Tis Hazari', 'Shakti Nagar', 'Kamla Nagar', 'Delhi University', 'GTB Nagar', 'Model Town', 'Azadpur', 'Shalimar Bagh'], frequency: '14 mins' },
};

export default function MetroLines({ onSelectLine, activeLineId }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('metro'); // 'metro' or 'bus'

  // Metro lines only (no bus)
  const metroLines = Object.entries(delhiMetroLines).filter(
    ([, line]) => line.type !== "bus"
  );

  return (
    <section id="transit-network-inner" className="mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="text-3xl font-bold text-white tracking-tight font-display mb-2">
            Delhi Transit Network
          </h3>
          <p className="text-gray-400 text-sm max-w-md">
            Explore the backbone of Delhi's mobility. Toggle between Metro and DTC systems to view all available routes.
          </p>
        </div>

        {/* Category Switcher */}
        <div className="flex p-1 bg-[#020617] border border-gray-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('metro')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer
                       ${activeTab === 'metro' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <i className="fas fa-train"></i> Metro Lines
          </button>
          <button
            onClick={() => setActiveTab('bus')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer
                       ${activeTab === 'bus' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <i className="fas fa-bus"></i> DTC Bus Routes
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

        {/* METRO CONTAINER */}
        {activeTab === 'metro' && (
          <div className="bg-[#020617]/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-xl text-blue-400 border border-blue-500/20 shadow-lg">
                  <i className="fas fa-train"></i>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Integrated Metro System</h4>
                  <p className="text-xs text-gray-500">{metroLines.length} Heavy Rail Lines • Operates 06:00 – 23:00</p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Network Scan</p>
                <p className="text-xs text-blue-400 font-bold">100% Operational</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {metroLines.map(([key, line]) => {
                const isActive = activeLineId === key;
                const isExpanded = expandedItem === key;
                return (
                  <div
                    key={key}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer border
                               ${isActive ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                    onClick={() => onSelectLine?.(isActive ? null : key)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-10 rounded-full shadow-sm" style={{ backgroundColor: line.color }}></div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-wide">{line.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 tracking-wider">
                            {line.stations.length} Stations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <i className="fas fa-check-circle text-emerald-500 text-xs animate-in zoom-in"></i>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : key); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 transition-colors"
                        >
                          <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-1 animate-in fade-in duration-300">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Detailed Hubs</p>
                        <div className="flex flex-wrap gap-1.5">
                          {line.stations.map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/5">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUS CONTAINER */}
        {activeTab === 'bus' && (
          <div className="bg-[#020617]/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-orange-600/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center text-xl text-orange-400 border border-orange-500/20 shadow-lg">
                  <i className="fas fa-bus"></i>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">DTC Surface Transit</h4>
                  <p className="text-xs text-gray-500">{Object.keys(busRoutes).length} Primary Road Vectors • 24/7 Operations</p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Traffic Flow</p>
                <p className="text-xs text-orange-400 font-bold">Standard Delay: 12m</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {Object.entries(busRoutes).map(([key, bus]) => {
                const isActive = activeLineId === key;
                const isExpanded = expandedItem === key;
                return (
                  <div
                    key={key}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer border
                               ${isActive ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                    onClick={() => onSelectLine?.(isActive ? null : key)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-10 rounded-full shadow-sm" style={{ backgroundColor: bus.color }}></div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-wide">{bus.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 tracking-wider">
                            Frequency: {bus.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <i className="fas fa-check-circle text-emerald-500 text-xs animate-in zoom-in"></i>}
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : key); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 transition-colors"
                        >
                          <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Route Vector</p>
                        <div className="space-y-1.5">
                          {bus.stops.map((stop, i) => (
                            <div key={i} className="flex items-center gap-3 pl-1">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: (i === 0 || i === bus.stops.length - 1) ? bus.color : 'transparent' }} />
                                {i < bus.stops.length - 1 && <div className="w-px h-2 bg-white/10" />}
                              </div>
                              <span className={`text-[10px] font-bold ${i === 0 || i === bus.stops.length - 1 ? 'text-white' : 'text-gray-500'}`}>{stop}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </section>
  );
}