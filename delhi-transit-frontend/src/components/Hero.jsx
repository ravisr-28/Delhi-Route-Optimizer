import { useState, useRef, useEffect } from "react";
import { searchAll } from "../utils/routeSearch";

const CATEGORY_ICONS = {
  station: '🚇',
  Monument: '🏛️',
  Market: '🛒',
  Hospital: '🏥',
  University: '🎓',
  Transport: '🚉',
  Government: '🏛️',
  Park: '🌳',
  Temple: '🛕',
  Mall: '🏬',
  Stadium: '🏟️',
  Museum: '🖼️',
  Office: '🏢',
  Restaurant: '🍴',
  Residential: '🏘️',
  Cinema: '🎬',
  Hotel: '🏨',
};

export default function Hero({
  from,
  to,
  time,
  setFrom,
  setTo,
  setTime,
  onFindRoute,
  loading,
  searchError,
}) {
  const [fastest, setFastest] = useState(true);
  const [cheapest, setCheapest] = useState(false);
  const [lessWalking, setLessWalking] = useState(true);

  // Autocomplete state
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target)) {
        setShowToDropdown(false);
      }
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

  return (
    <section
      id="home"
      className="bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617] py-20"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Smart Route Planning for Delhi Commuters
          </h2>

          <p className="text-lg text-gray-400 mb-10">
            Find the fastest, cheapest, and most convenient routes combining
            Delhi Metro and DTC buses
          </p>

          {/* Form Card */}
          <div
            className="bg-[#020617] border border-gray-800 rounded-2xl p-6 md:p-8
                       shadow-[0_0_40px_rgba(0,0,0,0.9)]"
          >
            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* From input with autocomplete */}
              <div className="relative" ref={fromRef}>
                <input
                  id="from-input"
                  value={from}
                  onChange={(e) => handleFromChange(e.target.value)}
                  onFocus={() => {
                    if (fromSuggestions.length > 0) setShowFromDropdown(true);
                  }}
                  placeholder="Starting Point (e.g. India Gate, Rajiv Chowk)"
                  className="dark-input w-full"
                />
                {showFromDropdown && fromSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#0f1728] border border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {fromSuggestions.map((item) => (
                      <div
                        key={item.name}
                        className="px-4 py-2.5 hover:bg-blue-900/40 cursor-pointer text-left text-gray-200 text-sm border-b border-gray-800 last:border-b-0 transition-colors flex items-center gap-2"
                        onClick={() => selectFromStation(item.name)}
                      >
                        <span>{CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || '📍'}</span>
                        <span>{item.name}</span>
                        {item.type === 'place' && <span className="text-[10px] text-gray-500 ml-auto">{item.category}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* To input with autocomplete */}
              <div className="relative" ref={toRef}>
                <input
                  value={to}
                  onChange={(e) => handleToChange(e.target.value)}
                  onFocus={() => {
                    if (toSuggestions.length > 0) setShowToDropdown(true);
                  }}
                  placeholder="Destination (e.g. Red Fort, Hauz Khas)"
                  className="dark-input w-full"
                />
                {showToDropdown && toSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#0f1728] border border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {toSuggestions.map((item) => (
                      <div
                        key={item.name}
                        className="px-4 py-2.5 hover:bg-blue-900/40 cursor-pointer text-left text-gray-200 text-sm border-b border-gray-800 last:border-b-0 transition-colors flex items-center gap-2"
                        onClick={() => selectToStation(item.name)}
                      >
                        <span>{CATEGORY_ICONS[item.type === 'station' ? 'station' : item.category] || '📍'}</span>
                        <span>{item.name}</span>
                        {item.type === 'place' && <span className="text-[10px] text-gray-500 ml-auto">{item.category}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="dark-input"
              />
            </div>

            {/* Options + Button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Checkboxes */}
              <div className="flex gap-6 text-gray-300 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastest}
                    onChange={() => setFastest(!fastest)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  Fastest
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cheapest}
                    onChange={() => setCheapest(!cheapest)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  Cheapest
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessWalking}
                    onChange={() => setLessWalking(!lessWalking)}
                    className="accent-blue-500 w-4 h-4"
                  />
                  Less Walking
                </label>
              </div>

              {/* Button */}
              <button
                onClick={onFindRoute}
                disabled={loading}
                className="flex items-center justify-center gap-2
                           px-8 py-3 rounded-xl font-medium text-white
                           bg-blue-600 hover:bg-blue-500 transition
                           disabled:opacity-60
                           shadow-[0_0_20px_rgba(59,130,246,0.6)]"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Finding Routes...
                  </>
                ) : (
                  <>
                    <i className="fas fa-route"></i>
                    Find Optimal Route
                  </>
                )}
              </button>
            </div>

            {/* Error message */}
            {searchError && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
                ! {searchError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tailwind helper styles */}
      <style>
        {`
          .dark-input {
            background-color: #020617;
            border: 1px solid #1f2933;
            color: #e5e7eb;
            padding: 0.75rem;
            border-radius: 0.75rem;
            outline: none;
            transition: all 0.2s ease;
          }

          .dark-input::placeholder {
            color: #6b7280;
          }

          .dark-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 1px #3b82f6;
          }
        `}
      </style>
    </section>
  );
}