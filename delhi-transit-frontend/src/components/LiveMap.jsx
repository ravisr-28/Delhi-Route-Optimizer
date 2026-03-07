import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStationInfo, markMachineFixed, isMajorStation } from '../utils/stationInfo';
import { searchAll } from '../utils/routeSearch';
import delhiMetroLines from '../data/metroData';

const CATEGORY_ICONS = {
  station: 'fas fa-subway',
  Monument: 'fas fa-landmark',
  Market: 'fas fa-shopping-cart',
  Hospital: 'fas fa-hospital',
  University: 'fas fa-graduation-cap',
  Transport: 'fas fa-bus-alt',
  Government: 'fas fa-building',
  Park: 'fas fa-tree',
  Temple: 'fas fa-place-of-worship',
  Mall: 'fas fa-shopping-bag',
  Stadium: 'fas fa-republican',
  Museum: 'fas fa-palette',
  Office: 'fas fa-briefcase',
  Restaurant: 'fas fa-utensils',
  Residential: 'fas fa-home',
  Cinema: 'fas fa-film',
  Hotel: 'fas fa-hotel',
};

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});




// Custom Metro Icon with SVG logos
const createMetroIcon = (color, type, zoomLevel) => {
  const iconSize = zoomLevel < 13 ? 0 :
    zoomLevel < 14 ? 22 :
      zoomLevel < 16 ? 28 : 34;

  if (iconSize === 0) return null;

  const iconColor = color || '#005BA9';
  const svgSize = Math.round(iconSize * 0.55);

  // Metro train SVG logo
  const metroSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M7 17h10"/></svg>`;

  // Bus SVG logo
  const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 12h16"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><path d="M4 8h1"/><path d="M19 8h1"/></svg>`;

  const svg = type === 'bus' ? busSvg : metroSvg;

  return L.divIcon({
    html: `
      <div style="width: ${iconSize}px; height: ${iconSize}px; background-color: ${iconColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
        ${svg}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2]
  });
};

// Custom circle for low zoom levels
const createCircleMarker = (color, zoomLevel, isActive) => {
  const radius = zoomLevel < 10 ? 2 :
    zoomLevel < 12 ? 3 :
      zoomLevel < 14 ? 4 : 5;

  return {
    radius,
    fillColor: color,
    color: '#ffffff',
    weight: isActive ? 2 : 1,
    opacity: isActive ? 1 : 0.8,
    fillOpacity: isActive ? 0.9 : 0.6
  };
};

// ========== Station Popup Content with Real-Time Info ==========
const StationPopupContent = ({ station, lineData, compact = false }) => {
  const [info, setInfo] = React.useState(() => getStationInfo(station.name));
  const [, forceUpdate] = React.useState(0);

  const handleFix = (machineId) => {
    markMachineFixed(machineId);
    setInfo(getStationInfo(station.name));
    forceUpdate(n => n + 1);
  };

  if (compact) {
    return (
      <div className="p-2 min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-4 rounded-sm" style={{ backgroundColor: lineData.color }}></div>
          <h3 className="font-bold text-gray-800 text-sm">{station.name}</h3>
          {info.isMajor && <span className="px-1 py-0.5 bg-amber-100/50 text-amber-700 text-[9px] font-black rounded uppercase tracking-tighter">â˜… Major Station</span>}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Code: {station.code} â€¢ {lineData.name}</div>
          <div className="flex items-center gap-1.5">
            <span>Flow:</span>
            <span className="font-bold uppercase tracking-tighter" style={{ color: info.crowd.color }}>{info.crowd.level}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
              <div className="h-1.5 rounded-full" style={{ width: `${info.crowd.percent}%`, backgroundColor: info.crowd.color }}></div>
            </div>
          </div>
          {info.defects.length > 0 && (
            <div className="text-red-600 font-bold uppercase tracking-tighter flex items-center gap-1">
              <i className="fas fa-exclamation-triangle"></i> {info.defects.length} ADVISORY
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 min-w-[260px] max-w-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-6 rounded-sm" style={{ backgroundColor: lineData.color }}></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-800">{station.name}</h3>
            {info.isMajor && <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">â˜…</span>}
          </div>
          <p className="text-xs text-gray-500">Code: {station.code} â€¢ {lineData.name}</p>
        </div>
      </div>

      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <i className={info.timePeriod.icon}></i> {info.timePeriod.label} <span className="mx-1">â€¢</span> UPDATED {info.lastUpdated}
      </div>

      {/* Crowd Level */}
      <div className="rounded-lg p-2 mb-2" style={{ backgroundColor: info.crowd.bg }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">Crowd Level</span>
          <span className="text-xs font-bold" style={{ color: info.crowd.color }}>{info.crowd.level}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${info.crowd.percent}%`, backgroundColor: info.crowd.color }}></div>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">{info.crowd.percent}% capacity</div>
      </div>

      {/* Line Info */}
      <div className="flex gap-2 mb-2 text-xs">
        <span className={`px-1.5 py-0.5 rounded font-medium ${lineData.type === 'bus' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {lineData.type === 'bus' ? 'ðŸšŒ BUS' : 'ðŸš‡ METRO'}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Every {lineData.frequency}</span>
      </div>

      {/* Intelligence Reports */}
      {info.defects.length > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <div className="text-[10px] font-black text-red-600 mb-2 uppercase tracking-widest flex items-center gap-1.5">
            <i className="fas fa-exclamation-circle text-xs"></i> {info.defects.length} HARDWARE ADVISORIES
          </div>
          <div className="space-y-1.5">
            {info.defects.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 bg-red-50 rounded px-2 py-1">
                <span className="text-sm">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-gray-800 truncate">{d.label}</div>
                  <div className="text-[10px] text-gray-500">{d.location}</div>
                </div>
                <button
                  onClick={() => handleFix(d.id)}
                  className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded hover:bg-green-600 whitespace-nowrap"
                >
                  âœ“ Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 pt-2 mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
        <i className="fas fa-check-circle"></i> ALL SYSTEMS NOMINAL
      </div>
    </div>
  );
};

const MetroMap = ({
  searchedRoute,
  externalActiveLine,
  externalMapClose,
  from,
  to,
  time,
  setFrom,
  setTo,
  setTime,
  onFindRoute,
  loading
}) => {
  const mapRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const [zoomLevel, setZoomLevel] = useState(12);
  const [activeLine, setActiveLine] = useState(null);
  const [showAllLines, setShowAllLines] = useState(true);
  const [showStationNames, setShowStationNames] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [mapCenter] = useState([28.7041, 77.1025]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  // Autocomplete state for Map Overlay
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [plannerExpanded, setPlannerExpanded] = useState(true);
  const [options, setOptions] = useState({
    fastest: true,
    cheapest: false,
    lessWalking: false
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) setShowFromDropdown(false);
      if (toRef.current && !toRef.current.contains(e.target)) setShowToDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFromChange = (val) => {
    setFrom(val);
    const results = searchAll(val);
    setFromSuggestions(results);
    setShowFromDropdown(results.length > 0);
  };

  const handleToChange = (val) => {
    setTo(val);
    const results = searchAll(val);
    setToSuggestions(results);
    setShowToDropdown(results.length > 0);
  };

  const selectFromStation = (name) => {
    setFrom(name);
    setShowFromDropdown(false);
  };

  const selectToStation = (name) => {
    setTo(name);
    setShowToDropdown(false);
  };

  // Sync external line selection from MetroLines component
  useEffect(() => {
    if (externalActiveLine) {
      setActiveLine(externalActiveLine);
      setShowAllLines(false);
      setMapOpen(true); // Automatically open map when a line is selected below
    }
  }, [externalActiveLine]);

  // Auto-open map when a route is searched
  useEffect(() => {
    if (searchedRoute) {
      setMapOpen(true);
    }
  }, [searchedRoute]);

  // Close map when triggered externally
  useEffect(() => {
    if (externalMapClose) {
      setMapOpen(false);
    }
  }, [externalMapClose]);

  // Filter lines based on type
  const filteredLines = useMemo(() => {
    return Object.entries(delhiMetroLines).filter(([key, line]) => {
      if (filterType === 'all') return true;
      if (filterType === 'metro') return line.type !== 'bus';
      if (filterType === 'bus') return line.type === 'bus';
      return true;
    });
  }, [filterType]);

  // Filter stations for low zoom levels
  const filteredStations = useMemo(() => {
    const line = delhiMetroLines[activeLine];
    if (!line) return [];

    if (zoomLevel < 10) {
      return [
        line.stations[0],
        line.stations[Math.floor(line.stations.length / 2)],
        line.stations[line.stations.length - 1]
      ];
    } else if (zoomLevel < 12) {
      return line.stations.filter((_, index) => index % 3 === 0);
    } else if (zoomLevel < 14) {
      return line.stations.filter((_, index) => index % 2 === 0);
    }
    return line.stations;
  }, [activeLine, zoomLevel]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results = [];

    Object.entries(delhiMetroLines).forEach(([lineId, line]) => {
      line.stations.forEach(station => {
        if (station.name.toLowerCase().includes(query) ||
          station.code.toLowerCase().includes(query)) {
          results.push({
            lineId,
            lineName: line.name,
            station,
            color: line.color
          });
        }
      });
    });

    return results.slice(0, 10); // Limit results
  }, [searchQuery]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      map.on('zoom', () => {
        const newZoom = map.getZoom();
        setZoomLevel(newZoom);
        setShowStationNames(newZoom >= 14);
      });

      // If there's a searched route, fit to it
      if (searchedRoute && searchedRoute.path.length > 0) {
        const bounds = L.latLngBounds(searchedRoute.path.map(s => s.coords));
        map.fitBounds(bounds, { padding: [60, 60] });
      } else {
        // Fit to active line bounds
        const activeLineData = delhiMetroLines[activeLine];
        if (activeLineData && activeLineData.stations.length > 0) {
          const bounds = L.latLngBounds(activeLineData.stations.map(s => s.coords));
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [activeLine, searchedRoute]);

  const handleRouteSelect = (routeName) => {
    setActiveLine(routeName);
    setShowAllLines(false);

    setTimeout(() => {
      setShowAllLines(true);
    }, 300);
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, 12);
      setZoomLevel(12);
      setShowStationNames(false);
    }
  };

  const handleZoomToRoute = () => {
    if (mapRef.current && delhiMetroLines[activeLine]) {
      const bounds = L.latLngBounds(delhiMetroLines[activeLine].stations.map(s => s.coords));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleSearchSelect = (result) => {
    setActiveLine(result.lineId);
    if (mapRef.current) {
      mapRef.current.flyTo(result.station.coords, 15);
    }
  };

  return (
    <div>
      {/* Compact Map Toggle */}
      <div className={mapOpen ? 'mb-4' : ''}>
        <button
          onClick={() => setMapOpen(!mapOpen)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest
                     transition-all cursor-pointer border
                     ${mapOpen
              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 active:scale-95'}`}
        >
          <i className={`fas ${mapOpen ? 'fa-times' : 'fa-map-marked-alt'}`}></i>
          {mapOpen ? 'Close System Map' : 'Launch Network Intelligence'}
        </button>
      </div>

      {mapOpen && (
        <div className="relative">
          {/* DMRC-style Plan Your Journey Overlay */}
          <div className="absolute top-4 left-4 z-[1000] w-72 md:w-80 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
              {/* Overlay Header */}
              <div
                className="bg-blue-600/95 px-4 py-4 flex items-center justify-between cursor-pointer border-b border-white/10"
                onClick={() => setPlannerExpanded(!plannerExpanded)}
              >
                <div className="flex items-center gap-3 text-white">
                  <i className="fas fa-route text-lg"></i>
                  <span className="font-black text-xs uppercase tracking-[0.2em] font-display italic">Network Intelligence</span>
                </div>
                <i className={`fas fa-chevron-up text-white/70 transition-transform duration-500 ${plannerExpanded ? '' : 'rotate-180'}`}></i>
              </div>

              {plannerExpanded && (
                <div className="p-4 space-y-4">
                  {/* From Field */}
                  <div className="space-y-1 relative" ref={fromRef}>
                    <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">From</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={from}
                        onChange={(e) => handleFromChange(e.target.value)}
                        onFocus={() => fromSuggestions.length > 0 && setShowFromDropdown(true)}
                        placeholder="Type station name..."
                        className="w-full bg-white border border-sky-100 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700"
                      />
                      {showFromDropdown && fromSuggestions.length > 0 && (
                        <div className="absolute z-[1100] w-full mt-1 bg-white border border-sky-50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {fromSuggestions.map((item) => (
                            <div
                              key={item.name}
                              className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 text-[11px] border-b border-gray-50 last:border-0 flex items-center gap-2.5 transition-colors"
                              onClick={() => selectFromStation(item.name)}
                            >
                              <i className={`${CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || 'fas fa-location-dot'} text-blue-500 text-[10px]`}></i>
                              <span className="truncate font-bold uppercase tracking-tighter">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* To Field */}
                  <div className="space-y-1 relative" ref={toRef}>
                    <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">To</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={to}
                        onChange={(e) => handleToChange(e.target.value)}
                        onFocus={() => toSuggestions.length > 0 && setShowToDropdown(true)}
                        placeholder="Type station name..."
                        className="w-full bg-white border border-sky-100 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700"
                      />
                      {showToDropdown && toSuggestions.length > 0 && (
                        <div className="absolute z-[1100] w-full mt-1 bg-white border border-sky-50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {toSuggestions.map((item) => (
                            <div
                              key={item.name}
                              className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 text-[11px] border-b border-gray-50 last:border-0 flex items-center gap-2.5 transition-colors"
                              onClick={() => selectToStation(item.name)}
                            >
                              <i className={`${CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || 'fas fa-location-dot'} text-blue-500 text-[10px]`}></i>
                              <span className="truncate font-bold uppercase tracking-tighter">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leaving & Time */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">Leaving</label>
                    <input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-sky-50/50 border border-sky-100 p-2 rounded-xl text-xs outline-none text-gray-600"
                    />
                  </div>

                  {/* Filters */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1 mb-2">Advanced Filter</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions(o => ({ ...o, fastest: !o.fastest }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.fastest ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                      >
                        <span className="text-lg">âš¡</span>
                        <span className="text-[10px] font-bold">Fastest</span>
                      </button>
                      <button
                        onClick={() => setOptions(o => ({ ...o, cheapest: !o.cheapest }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.cheapest ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                      >
                        <span className="text-lg">ðŸ’°</span>
                        <span className="text-[10px] font-bold">Cheapest</span>
                      </button>
                      <button
                        onClick={() => setOptions(o => ({ ...o, lessWalking: !o.lessWalking }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.lessWalking ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                      >
                        <span className="text-lg">ðŸ”„</span>
                        <span className="text-[10px] font-bold">Less Walking</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { setFrom(''); setTo(''); }}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest decoration-blue-500/30 underline underline-offset-4"
                    >
                      Clear
                    </button>
                      <button
                        onClick={() => onFindRoute(undefined, undefined, options)}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 border border-white/10"
                      >
                        {loading ? 'CALCULATING...' : 'SHOW OPTIMAL VECTOR'}
                      </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden h-[600px] z-0">
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              ref={mapRef}
              className="h-full w-full"
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* DMRC-style Plan Your Journey Overlay */}
              <div className="absolute top-4 left-4 z-[1000] w-72 md:w-80 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                  {/* Overlay Header */}
                  <div
                    className="bg-sky-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                    onClick={() => setPlannerExpanded(!plannerExpanded)}
                  >
                    <div className="flex items-center gap-2 text-sky-800">
                      <span className="text-xl">ðŸš‡</span>
                      <span className="font-bold text-sm tracking-tight">Plan Your Journey</span>
                    </div>
                    <span className={`text-sky-600 transition-transform duration-300 ${plannerExpanded ? 'rotate-180' : ''}`}>
                      â–²
                    </span>
                  </div>

                  {plannerExpanded && (
                    <div className="p-4 space-y-4">
                      {/* From Field */}
                      <div className="space-y-1 relative" ref={fromRef}>
                        <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">From</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={from}
                            onChange={(e) => handleFromChange(e.target.value)}
                            onFocus={() => fromSuggestions.length > 0 && setShowFromDropdown(true)}
                            placeholder="Type station name..."
                            className="w-full bg-white border border-sky-100 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700"
                          />
                          {showFromDropdown && fromSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-sky-50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {fromSuggestions.map((item) => (
                                <div
                                  key={item.name}
                                  className="px-3 py-2 hover:bg-sky-50 cursor-pointer text-gray-700 text-xs border-b border-gray-50 last:border-0 flex items-center gap-2"
                                  onClick={() => selectFromStation(item.name)}
                                >
                                  <span>{CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || 'ðŸ“'}</span>
                                  <span className="truncate">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* To Field */}
                      <div className="space-y-1 relative" ref={toRef}>
                        <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">To</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={to}
                            onChange={(e) => handleToChange(e.target.value)}
                            onFocus={() => toSuggestions.length > 0 && setShowToDropdown(true)}
                            placeholder="Type station name..."
                            className="w-full bg-white border border-sky-100 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-200 transition-all font-medium text-gray-700"
                          />
                          {showToDropdown && toSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-sky-50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {toSuggestions.map((item) => (
                                <div
                                  key={item.name}
                                  className="px-3 py-2 hover:bg-sky-50 cursor-pointer text-gray-700 text-xs border-b border-gray-50 last:border-0 flex items-center gap-2"
                                  onClick={() => selectToStation(item.name)}
                                >
                                  <span>{CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || 'ðŸ“'}</span>
                                  <span className="truncate">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Leaving & Time */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1">Leaving</label>
                        <input
                          type="datetime-local"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-sky-50/50 border border-sky-100 p-2 rounded-xl text-xs outline-none text-gray-600"
                        />
                      </div>

                      {/* Filters */}
                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider ml-1 mb-2">Advanced Filter</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setOptions(o => ({ ...o, fastest: !o.fastest }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.fastest ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                          >
                            <span className="text-lg">âš¡</span>
                            <span className="text-[10px] font-bold">Fastest</span>
                          </button>
                          <button
                            onClick={() => setOptions(o => ({ ...o, cheapest: !o.cheapest }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.cheapest ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                          >
                            <span className="text-lg">ðŸ’°</span>
                            <span className="text-[10px] font-bold">Cheapest</span>
                          </button>
                          <button
                            onClick={() => setOptions(o => ({ ...o, lessWalking: !o.lessWalking }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${options.lessWalking ? 'bg-sky-100 border-sky-200 text-sky-800' : 'bg-white border-gray-100 text-gray-400 hover:border-sky-100'}`}
                          >
                            <span className="text-lg">ðŸ”„</span>
                            <span className="text-[10px] font-bold">Less Walking</span>
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          onClick={() => { setFrom(''); setTo(''); }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-800 underline underline-offset-4"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => onFindRoute(undefined, undefined, options)}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                        >
                          {loading ? 'Finding...' : 'Show Route & Fare'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Searched Route Highlight */}
              {searchedRoute && searchedRoute.path.length > 1 && (
                <>
                  {/* Glow background polyline */}
                  <Polyline
                    positions={searchedRoute.path.map(s => s.coords)}
                    pathOptions={{
                      color: '#6366f1',
                      weight: 12,
                      opacity: 0.15,
                    }}
                  />
                  {/* Main highlight polyline */}
                  <Polyline
                    positions={searchedRoute.path.map(s => s.coords)}
                    pathOptions={{
                      color: '#6366f1',
                      weight: 6,
                      opacity: 0.9,
                      dashArray: '12, 8',
                    }}
                  />

                  {/* Source marker */}
                  <Marker
                    position={searchedRoute.from.coords}
                    icon={L.divIcon({
                      html: `<div style="width:32px;height:32px;background:#22c55e;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:16px;font-weight:bold">A</span></div>`,
                      className: 'custom-marker',
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    })}
                  >
                    <Popup>
                      <div className="p-2 min-w-[140px]">
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><i className="fas fa-play-circle text-xs"></i> Origin</h3>
                        <p className="font-black text-gray-800 uppercase tracking-tighter text-sm">{searchedRoute.from.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{searchedRoute.from.lineName}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Destination marker */}
                  <Marker
                    position={searchedRoute.to.coords}
                    icon={L.divIcon({
                      html: `<div style="width:32px;height:32px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:16px;font-weight:bold">B</span></div>`,
                      className: 'custom-marker',
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><i className="fas fa-stop-circle text-xs"></i> Destination</h3>
                        <p className="font-semibold text-gray-800">{searchedRoute.to.name}</p>
                        <p className="text-xs text-gray-500">{searchedRoute.to.lineName}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Transfer station markers */}
                  {searchedRoute.path.filter(s => s.isTransfer).map((step, i) => (
                    <Marker
                      key={`transfer-${i}`}
                      position={step.coords}
                      icon={L.divIcon({
                        html: `<div style="width:26px;height:26px;background:#f59e0b;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:12px;font-weight:bold">T</span></div>`,
                        className: 'custom-marker',
                        iconSize: [26, 26],
                        iconAnchor: [13, 13],
                      })}
                    >
                      <Popup>
                        <div className="p-2 min-w-[140px]">
                          <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><i className="fas fa-exchange-alt text-xs"></i> Transfer Node</h3>
                          <p className="font-black text-gray-800 uppercase tracking-tighter text-sm">{step.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Vector Shift: {step.lineName}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}

              {/* Render only the active/selected metro line */}
              {filteredLines
                .filter(([lineKey]) => activeLine === lineKey)
                .map(([lineKey, lineData]) => {
                  const isActive = true;
                  const positions = lineData.stations.map(station => station.coords);
                  const displayStations = filteredStations;

                  return (
                    <React.Fragment key={lineKey}>
                      {/* Metro/Bus Line */}
                      <Polyline
                        positions={positions}
                        pathOptions={{
                          color: lineData.color,
                          weight: zoomLevel < 12 ? 5 : 6,
                          opacity: zoomLevel < 12 ? 0.9 : 1,
                          dashArray: lineData.type === 'bus' ? '8, 8' : undefined
                        }}
                      />

                      {/* Stations */}
                      {displayStations.map((station, idx) => {
                        const icon = createMetroIcon(
                          lineData.color,
                          lineData.type === 'bus' ? 'bus' : 'metro',
                          zoomLevel
                        );

                        // For low zoom, use CircleMarker
                        if (zoomLevel < 13 || !icon) {
                          return (
                            <CircleMarker
                              key={`${lineKey}-${idx}`}
                              center={station.coords}
                              pathOptions={createCircleMarker(lineData.color, zoomLevel, isActive)}
                            >
                              <Popup>
                                <StationPopupContent station={station} lineData={lineData} compact />
                              </Popup>
                            </CircleMarker>
                          );
                        }

                        // For high zoom, use Marker with icon
                        return (
                          <Marker
                            key={`${lineKey}-${idx}`}
                            position={station.coords}
                            icon={icon}
                          >
                            <Popup>
                              <StationPopupContent station={station} lineData={lineData} />
                            </Popup>
                          </Marker>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

              <ZoomControl position="bottomright" />
            </MapContainer>
          </div>

          {/* Active Route Info */}
          {delhiMetroLines[activeLine] && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Active Route</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-6 h-10 rounded-sm"
                    style={{ backgroundColor: delhiMetroLines[activeLine].color }}
                  ></div>
                  <div>
                    <h4 className="font-bold text-gray-800">{delhiMetroLines[activeLine].name}</h4>
                    <p className="text-xs text-gray-600">
                      {delhiMetroLines[activeLine].type === 'bus' ? 'Bus Route' : 'Metro Line'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{delhiMetroLines[activeLine].stations.length}</div>
                    <div className="text-xs text-gray-500">Stations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{delhiMetroLines[activeLine].frequency}</div>
                    <div className="text-xs text-gray-500">Frequency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {zoomLevel >= 14 ? 'Detail' : 'Normal'}
                    </div>
                    <div className="text-xs text-gray-500">View</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetroMap;
