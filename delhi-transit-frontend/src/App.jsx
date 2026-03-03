import { useEffect, useRef, useState } from "react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Routes from "./components/Routes";
import Features from "./components/Features";
import MetroLines from "./components/MetroLines";
import FareCalculator from "./components/FareCalculator";
import PopularRoutes from "./components/PopularRoutes";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import LiveMap from "./components/LiveMap";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import RealTimePanel from "./components/RealTimePanel";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { findRoute as searchRoute, resolvePlace } from "./utils/routeSearch";
import { getCrowdLevel, getTimePeriod, isMajorStation } from "./utils/stationInfo";
import { getPlatformWalk, estimateBus, getMetroCrowdSummary } from "./utils/transitHelpers";




function App() {
  const { user, logout, isAuthenticated } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchedRoute, setSearchedRoute] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [selectedMetroLine, setSelectedMetroLine] = useState(null);
  const [placeInfo, setPlaceInfo] = useState({ from: null, to: null });
  const [realTimeTick, setRealTimeTick] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRealTime, setShowRealTime] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFareCalc, setShowFareCalc] = useState(false);

  // Guard: if not logged in, show login modal instead of performing the action
  const requireAuth = (action) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const mapRef = useRef(null);

  useEffect(() => {
    const now = new Date().toISOString().slice(0, 16);
    setTime(now);
  }, []);

  // Auto-close login modal when user logs in
  useEffect(() => {
    if (isAuthenticated && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [isAuthenticated]);

  // Lock body scroll when fare calculator modal is open
  useEffect(() => {
    document.body.style.overflow = showFareCalc ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showFareCalc]);

  // Real-time ticker — forces re-render every 30s so crowd levels,
  // metro operating status, and bus delays update live
  useEffect(() => {
    const interval = setInterval(() => setRealTimeTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const findRoute = () => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    if (!from || !to) {
      alert("Please enter both starting point and destination");
      return;
    }

    setLoading(true);
    setSearchError("");
    setSearchedRoute(null);
    setPlaceInfo({ from: null, to: null });

    // Small delay for UX feel
    setTimeout(() => {
      // Resolve places to nearest stations
      const fromPlace = resolvePlace(from);
      const toPlace = resolvePlace(to);
      const actualFrom = fromPlace ? fromPlace.nearest.station.name : from;
      const actualTo = toPlace ? toPlace.nearest.station.name : to;

      setPlaceInfo({ from: fromPlace, to: toPlace });

      const result = searchRoute(actualFrom, actualTo);
      setLoading(false);

      if (result) {
        setSearchedRoute(result);
        // Auto-scroll to map
        requestAnimationFrame(() => {
          mapRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } else {
        setSearchError(
          `No route found between "${from}" and "${to}". Please check the names.`
        );
      }
    }, 600);
  };

  const selectRoute = (route) => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    setSelectedRoute(route);
  };

  if (showAdmin) {
    return (
      <AdminDashboard
        onClose={() => setShowAdmin(false)}
        user={user}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      <Header onAdminClick={() => requireAuth(() => setShowAdmin(true))} />

      <Hero
        from={from}
        to={to}
        time={time}
        setFrom={setFrom}
        setTo={setTo}
        setTime={setTime}
        onFindRoute={findRoute}
        loading={loading}
        searchError={searchError}
      />

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Route Search Result Summary */}
        {searchedRoute && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  🚇 Route Found!
                </h3>
                <p className="text-gray-300">
                  {searchedRoute.from.name} → {searchedRoute.to.name}
                </p>
              </div>
              <div className="flex gap-6">

            {/* Place proximity cards */}
            {(placeInfo.from || placeInfo.to) && (
              <div className="flex flex-col gap-2 mb-3">
                {[
                  { label: 'From', place: placeInfo.from, type: 'source' },
                  { label: 'To', place: placeInfo.to, type: 'dest' },
                ].filter(p => p.place).map(({ label, place }) => {
                  const n = place.nearest;
                  return (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">📍</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{place.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400">{place.category}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs text-gray-400">{label === 'From' ? 'Start from' : 'Get off at'}:</span>
                            <span className="text-xs font-semibold" style={{ color: n.lineColor }}>{n.station.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">{n.line}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px]">
                            <span className="text-gray-300 font-medium">📏 {n.distanceText} away</span>
                            <span className="text-gray-400">⏱ {n.walkMin} min walk</span>
                            <span className="text-gray-400">🧭 {n.direction}</span>
                          </div>
                          <div className="mt-1.5 text-xs text-blue-300">
                            {n.howToReach}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {searchedRoute.stationCount}
                  </p>
                  <p className="text-xs text-gray-400">Stations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    ~{searchedRoute.estimatedTime} min
                  </p>
                  <p className="text-xs text-gray-400">Est. Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {searchedRoute.transfers}
                  </p>
                  <p className="text-xs text-gray-400">Transfers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    ₹{searchedRoute.estimatedFare}
                  </p>
                  <p className="text-xs text-gray-400">Est. Fare</p>
                </div>
              </div>
            </div>
            {/* Lines used */}
            <div className="mt-4 flex flex-wrap gap-2">
              {searchedRoute.linesUsed.map((line) => (
                <span
                  key={line}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white"
                >
                  {line}
                </span>
              ))}
            </div>

            {/* 🚇 vs 🚌 Metro vs Bus Comparison */}
            {(() => {
              void realTimeTick; // triggers re-render every 30s
              const fromC = searchedRoute.from.coords;
              const toC = searchedRoute.to.coords;
              const bus = estimateBus(fromC, toC);
              const metroMin = searchedRoute.estimatedTime;
              const metroFare = searchedRoute.estimatedFare;
              const now = new Date();
              const hour = now.getHours();
              const metroOpen = hour >= 6 && hour < 23; // 6 AM to 11 PM
              const diff = bus.travelMin - metroMin;
              const fasterMode = metroOpen ? (diff > 0 ? 'metro' : diff < 0 ? 'bus' : 'tie') : 'bus';
              const savedMin = Math.abs(diff);
              const metroCrowd = getMetroCrowdSummary(searchedRoute.path);
              const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              return (
                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      ⚡ Metro vs Bus — Which is Faster?
                      {bus.isPeak && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full">Peak Traffic</span>}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">🕐 {timeStr}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        metroOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {metroOpen ? '🟢 Metro Running' : '🔴 Metro Closed'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Metro card */}
                    <div className={`rounded-lg p-3 border relative overflow-hidden ${
                      !metroOpen ? 'border-red-500/30 bg-red-500/5 opacity-75' :
                      fasterMode === 'metro' ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/[0.03]'
                    }`}>
                      {!metroOpen && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 rounded-lg">
                          <span className="text-2xl mb-1">🚫</span>
                          <span className="text-sm font-bold text-red-400">NOT AVAILABLE</span>
                          <span className="text-[10px] text-red-300 mt-0.5">Service hours: 6:00 AM – 11:00 PM</span>
                          <span className="text-[10px] text-gray-400 mt-1">Resumes at 6:00 AM</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🚇</span>
                        <span className="text-sm font-bold text-white">Metro</span>
                        {metroOpen && fasterMode === 'metro' && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/30 text-green-300 rounded-full ml-auto">⚡ {savedMin} min faster</span>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Time</span>
                          <span className="text-white font-semibold">~{metroMin} min</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Fare</span>
                          <span className="text-white font-semibold">₹{metroFare}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Transfers</span>
                          <span className="text-white font-semibold">{searchedRoute.transfers}</span>
                        </div>
                      </div>
                      {/* Metro crowd status */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Crowd Level</span>
                          <span className="font-semibold flex items-center gap-1" style={{ color: metroCrowd.color }}>
                            {metroCrowd.emoji} {metroCrowd.level}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${metroCrowd.percent}%`, backgroundColor: metroCrowd.color }}></div>
                        </div>
                      </div>
                    </div>
                    {/* Bus card */}
                    <div className={`rounded-lg p-3 border ${
                      fasterMode === 'bus' ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/[0.03]'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🚌</span>
                        <span className="text-sm font-bold text-white">DTC Bus</span>
                        {fasterMode === 'bus' && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/30 text-green-300 rounded-full ml-auto">⚡ {savedMin} min faster</span>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Time</span>
                          <span className="text-white font-semibold">~{bus.travelMin} min</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Fare (Non-AC)</span>
                          <span className="text-white font-semibold">₹{bus.fareNonAC}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Fare (AC)</span>
                          <span className="text-white font-semibold">₹{bus.fareAC}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Road Dist</span>
                          <span className="text-white font-semibold">{bus.roadKm} km</span>
                        </div>
                      </div>
                      {/* Bus delay status */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Bus Status</span>
                          <span className="font-semibold" style={{ color: bus.delayColor }}>
                            {bus.delayStatus === 'On Time' ? '✅' : bus.delayStatus === 'Slightly Delayed' ? '⚠️' : bus.delayStatus === 'Delayed' ? '🟠' : '🔴'} {bus.delayStatus}
                          </span>
                        </div>
                        {bus.delayMin > 0 && (
                          <div className="text-[10px] mt-1 px-2 py-1 rounded" style={{ backgroundColor: bus.delayColor + '15', color: bus.delayColor }}>
                            Expected delay: ~{bus.delayMin} min due to {bus.isPeak ? 'peak hour traffic' : 'road conditions'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Recommendation */}
                  <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                    !metroOpen ? 'bg-red-500/10 text-red-300' :
                    fasterMode === 'metro' ? 'bg-blue-500/10 text-blue-300' :
                    fasterMode === 'bus' ? 'bg-orange-500/10 text-orange-300' :
                    'bg-gray-500/10 text-gray-300'
                  }`}>
                    {!metroOpen && '🚫 Metro is currently closed (operates 6:00 AM – 11:00 PM). Take a DTC bus, auto-rickshaw, or cab for this journey.'}
                    {metroOpen && fasterMode === 'metro' && `💡 Metro is ${savedMin} min faster and more reliable. Take metro unless you prefer door-to-door convenience.`}
                    {metroOpen && fasterMode === 'bus' && `💡 Bus is ${savedMin} min faster for this short route. Consider a DTC bus for direct connectivity.`}
                    {metroOpen && fasterMode === 'tie' && '💡 Both options take roughly the same time. Metro is more predictable; bus offers door-to-door convenience.'}
                  </div>
                </div>
              );
            })()}
            {/* Station chain */}
            <div className="mt-4 flex flex-wrap items-center gap-1 text-sm">
              {searchedRoute.path.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      step.isTransfer
                        ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/50"
                        : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {step.name}
                  </span>
                  {i < searchedRoute.path.length - 1 && (
                    <span className="text-gray-500">→</span>
                  )}
                </span>
              ))}
            </div>

            {/* Detailed Station Crowd Info */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  📊 Station Crowd Status
                  <span className="text-xs font-normal text-gray-400">({searchedRoute.path.length} stations)</span>
                </h4>
                {(() => {
                  const tp = getTimePeriod();
                  const isPeak = tp.label.includes('Rush');
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isPeak ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40'
                    }`}>
                      {tp.emoji} {tp.label}
                    </span>
                  );
                })()}
              </div>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {searchedRoute.path.map((step, i) => {
                  const crowd = getCrowdLevel(step.name);
                  const major = isMajorStation(step.name);
                  const isFirst = i === 0;
                  const isLast = i === searchedRoute.path.length - 1;
                  return (
                    <div key={i} className="flex items-center gap-3 group">
                      {/* Station number & connector */}
                      <div className="flex flex-col items-center w-6">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                            isFirst || isLast
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : step.isTransfer
                                ? 'bg-yellow-500 border-yellow-400 text-white'
                                : 'bg-transparent border-gray-500 text-gray-400'
                          }`}
                          style={!(isFirst || isLast || step.isTransfer) ? { borderColor: step.lineColor } : {}}
                        >
                          {isFirst ? 'S' : isLast ? 'D' : step.isTransfer ? 'T' : ''}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-3 mt-0.5" style={{ backgroundColor: step.lineColor + '60' }}></div>
                        )}
                      </div>

                      {/* Station info */}
                      <div className="flex-1 flex items-center gap-2 min-w-0 py-1 px-2 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white truncate">{step.name}</span>
                            {major && <span className="text-[9px] text-amber-400">★</span>}
                            {step.isTransfer && <span className="text-[9px] px-1 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">Transfer</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500" style={{ color: step.lineColor }}>{step.lineName}</span>
                            {step.isTransfer && (() => {
                              const pw = getPlatformWalk(step.name);
                              return (
                                <span className="text-[10px] text-yellow-400/80 flex items-center gap-1">
                                  · 🚶 {pw.distance}m ({pw.time} min) · <span className="text-gray-500">{pw.note}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Crowd indicator */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-14 bg-gray-700 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${crowd.percent}%`, backgroundColor: crowd.color }}></div>
                          </div>
                          <span className="text-[10px] font-semibold min-w-[55px] text-right" style={{ color: crowd.color }}>
                            {crowd.level}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Routes */}
        <Routes
          selectedRoute={selectedRoute}
          onSelectRoute={selectRoute}
        />


        {/* Live Metro & Bus Map — always visible */}
        <div ref={mapRef}>
          <LiveMap searchedRoute={searchedRoute} externalActiveLine={selectedMetroLine} externalMapClose={showFareCalc} />
        </div>



        <Features
          onRealTime={() => requireAuth(() => setShowRealTime(true))}
          onFareCompare={() => requireAuth(() => setShowFareCalc(true))}
        />
        <MetroLines
          activeLineId={selectedMetroLine}
          onSelectLine={(lineKey) => requireAuth(() => {
            setSelectedMetroLine(lineKey);
            if (lineKey) {
              requestAnimationFrame(() => {
                mapRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              });
            }
          })}
        />

        <PopularRoutes
          onPlanRoute={(route) => requireAuth(() => {
            setFrom(route.from);
            setTo(route.to);
            setTimeout(() => findRoute(), 0);
          })}
        />
      </main>

      <Footer />
      <CookieConsent />



      {/* Real-Time Panel */}
      <RealTimePanel isOpen={showRealTime} onClose={() => setShowRealTime(false)} />

      {/* Fare Calculator Modal */}
      {showFareCalc && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center py-8 px-4">
            <div className="relative w-full max-w-2xl">
              <button
                onClick={() => setShowFareCalc(false)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-gray-800 border border-gray-700
                           text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center justify-center text-lg cursor-pointer"
              >
                ×
              </button>
              <FareCalculator selectedRoute={searchedRoute} />
            </div>
          </div>
        </div>
      )}

      {/* Login Modal — shown when unauthenticated user tries an action */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center py-8 px-4">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-gray-800 border border-gray-700
                           text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center justify-center text-lg"
              >
                ×
              </button>
              <div className="bg-[#0f172a] border border-gray-700 rounded-2xl p-2 shadow-2xl shadow-blue-500/10">
                <div className="text-center py-3">
                  <p className="text-sm text-gray-400">Please log in to use this feature</p>
                </div>
                <AdminLogin onBack={() => setShowLoginModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}