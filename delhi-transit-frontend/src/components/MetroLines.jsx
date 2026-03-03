import { useState } from "react";
import delhiMetroLines from "../data/metroData";

// Bus routes data (matches LiveMap.jsx)
const busRoutes = {
  'bus-route-24':  { name: 'Bus Route 24',  color: '#6B8E23', stops: ['ISBT Kashmere Gate','Mori Gate','Pratap Nagar','Shalimar Bagh','Azadpur','Adarsh Nagar','Badli Mor','Bawana','Narela','Rohini Sector 24'], frequency: '15 mins' },
  'bus-route-522': { name: 'Bus Route 522', color: '#D2691E', stops: ['Ambedkar Nagar','Khanpur','Saket','Malviya Nagar','Hauz Khas','AIIMS','Safdarjung','Dhaula Kuan','Naraina','Rajouri Garden'], frequency: '12 mins' },
  'bus-route-423': { name: 'Bus Route 423', color: '#8B4513', stops: ['Nehru Place','Lajpat Nagar','Defence Colony','Lodhi Colony','India Gate','Connaught Place','Karol Bagh','Patel Nagar','Rajouri Garden'], frequency: '10 mins' },
  'bus-route-181': { name: 'Bus Route 181', color: '#556B2F', stops: ['Badarpur Border','Sarita Vihar','Jasola','Okhla','Nehru Place','Moolchand','AIIMS','INA Market','Dilli Haat'], frequency: '10 mins' },
  'bus-route-347': { name: 'Bus Route 347', color: '#2E8B57', stops: ['Dwarka Sector 14','Dwarka Sector 10','Palam Village','Mahavir Enclave','Janakpuri','Tilak Nagar','Subhash Nagar','Rajouri Garden'], frequency: '18 mins' },
  'bus-route-764': { name: 'Bus Route 764', color: '#BDB76B', stops: ['Anand Vihar ISBT','Karkardooma','Preet Vihar','Laxmi Nagar','Akshardham','ITO','India Gate','Central Secretariat','Patel Chowk','Connaught Place'], frequency: '12 mins' },
  'bus-route-620': { name: 'Bus Route 620', color: '#DAA520', stops: ['Mehrauli','Qutub Minar','Chhatarpur','Vasant Kunj','Munirka','RK Puram','Sarojini Nagar','South Extension','Lajpat Nagar'], frequency: '15 mins' },
  'bus-route-413': { name: 'Bus Route 413', color: '#CD853F', stops: ['Old Delhi Rly Stn','Chandni Chowk','Red Fort','Jama Masjid','Delhi Gate','ITO','Pragati Maidan','Nizamuddin','Ashram Chowk','Nehru Place'], frequency: '10 mins' },
  'bus-route-901': { name: 'Bus Route 901', color: '#A0522D', stops: ['Badarpur Border','Tughlakabad','Sangam Vihar','Ambedkar Nagar','Govindpuri','Kalkaji','Nehru Place'], frequency: '12 mins' },
  'bus-route-534': { name: 'Bus Route 534', color: '#8FBC8F', stops: ['ISBT Kashmere Gate','Tis Hazari','Shakti Nagar','Kamla Nagar','Delhi University','GTB Nagar','Model Town','Azadpur','Shalimar Bagh'], frequency: '14 mins' },
};

export default function MetroLines({ onSelectLine, activeLineId }) {
  const [expandedItem, setExpandedItem] = useState(null);

  // Metro lines only (no bus)
  const metroLines = Object.entries(delhiMetroLines).filter(
    ([, line]) => line.type !== "bus"
  );

  return (
    <section id="metro-map" className="mb-12">
      <h3 className="text-2xl font-bold text-gray-100 mb-2">
        Delhi Transit Network
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        Click a line to show on map • Click again to remove
      </p>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN — Metro Lines */}
        <div className="bg-[#020617] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <i className="fas fa-train text-blue-400"></i>
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Metro Lines</h4>
              <p className="text-xs text-gray-500">{metroLines.length} lines • {metroLines.reduce((acc, [,l]) => acc + l.stations.length, 0)} stations</p>
            </div>
          </div>

          <div className="divide-y divide-gray-800/60 max-h-[520px] overflow-y-auto">
            {metroLines.map(([key, line]) => {
              const isActive = activeLineId === key;
              const isExpanded = expandedItem === key;
              const first = line.stations[0]?.name || "";
              const last = line.stations[line.stations.length - 1]?.name || "";

              return (
                <div key={key}>
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer select-none transition-all duration-150
                               ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
                    onClick={() => onSelectLine?.(isActive ? null : key)}
                  >
                    {/* Color dot */}
                    <div
                      className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all ${isActive ? 'scale-125' : ''}`}
                      style={{
                        backgroundColor: isActive ? line.color : 'transparent',
                        borderColor: line.color,
                        boxShadow: isActive ? `0 0 8px ${line.color}80` : 'none',
                      }}
                    />

                    {/* Line info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-100">{line.name}</div>
                      <div className="text-xs text-gray-500 truncate">{first} → {last}</div>
                    </div>

                    {/* Station count + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{line.stations.length} stn</span>
                      {isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">✓</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : key); }}
                        className="text-gray-500 hover:text-gray-300 text-xs px-1"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded station list */}
                  {isExpanded && (
                    <div className="px-5 pb-3 pt-1 bg-white/[0.02]">
                      <div className="flex flex-wrap gap-1">
                        {line.stations.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
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

        {/* RIGHT COLUMN — Bus Routes */}
        <div className="bg-[#020617] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600/20 flex items-center justify-center">
              <i className="fas fa-bus text-orange-400"></i>
            </div>
            <div>
              <h4 className="font-bold text-white text-base">DTC Bus Routes</h4>
              <p className="text-xs text-gray-500">{Object.keys(busRoutes).length} routes • {Object.values(busRoutes).reduce((acc, b) => acc + b.stops.length, 0)} stops</p>
            </div>
          </div>

          <div className="divide-y divide-gray-800/60 max-h-[520px] overflow-y-auto">
            {Object.entries(busRoutes).map(([key, bus]) => {
              const isActive = activeLineId === key;
              const isExpanded = expandedItem === key;

              return (
                <div key={key}>
                  <div
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer select-none transition-all duration-150
                               ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
                    onClick={() => onSelectLine?.(isActive ? null : key)}
                  >
                    {/* Color dot */}
                    <div
                      className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all ${isActive ? 'scale-125' : ''}`}
                      style={{
                        backgroundColor: isActive ? bus.color : 'transparent',
                        borderColor: bus.color,
                        boxShadow: isActive ? `0 0 8px ${bus.color}80` : 'none',
                      }}
                    />

                    {/* Route info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-100">{bus.name}</div>
                      <div className="text-xs text-gray-500 truncate">{bus.stops[0]} → {bus.stops[bus.stops.length - 1]}</div>
                    </div>

                    {/* Frequency + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{bus.frequency}</span>
                      {isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">✓</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : key); }}
                        className="text-gray-500 hover:text-gray-300 text-xs px-1"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded stop list */}
                  {isExpanded && (
                    <div className="px-5 pb-3 pt-1 bg-white/[0.02]">
                      <div className="space-y-0.5">
                        {bus.stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="flex flex-col items-center">
                              <div
                                className="w-2 h-2 rounded-full border"
                                style={{
                                  borderColor: bus.color,
                                  backgroundColor: (i === 0 || i === bus.stops.length - 1) ? bus.color : 'transparent',
                                }}
                              />
                              {i < bus.stops.length - 1 && (
                                <div className="w-px h-2.5" style={{ backgroundColor: `${bus.color}40` }} />
                              )}
                            </div>
                            <span className={`${(i === 0 || i === bus.stops.length - 1) ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                              {stop}
                            </span>
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

      </div>
    </section>
  );
}
