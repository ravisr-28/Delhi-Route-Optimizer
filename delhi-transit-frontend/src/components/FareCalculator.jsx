import { useEffect, useState, useMemo } from "react";

// Delhi Metro Fare Chart (based on distance in km)
function getMetroFare(distanceKm) {
  if (distanceKm <= 2) return 10;
  if (distanceKm <= 5) return 20;
  if (distanceKm <= 12) return 30;
  if (distanceKm <= 21) return 40;
  if (distanceKm <= 32) return 50;
  return 60;
}

// DTC Bus Fare (distance-based)
function getBusFare(distanceKm, isAC = false) {
  if (isAC) {
    if (distanceKm <= 4) return 10;
    if (distanceKm <= 10) return 15;
    return 25;
  }
  // Non-AC
  if (distanceKm <= 4) return 5;
  if (distanceKm <= 10) return 10;
  return 15;
}

// Auto/E-Rickshaw fare estimation
function getAutoFare(distanceKm) {
  // Delhi auto: ₹25 for first 1.5km, then ₹9.5/km
  if (distanceKm <= 1.5) return 25;
  return Math.round(25 + (distanceKm - 1.5) * 9.5);
}

// Cab/Uber/Ola estimation
function getCabFare(distanceKm) {
  // Approx: ₹6/km base + ₹50 base fare
  return Math.round(50 + distanceKm * 6);
}

export default function FareCalculator({ selectedRoute }) {
  const [distance, setDistance] = useState("");
  const [showFares, setShowFares] = useState(false);

  useEffect(() => {
    if (!selectedRoute) return;
    // Handle both formats: searchedRoute has 'path', selectedRoute has 'stops'
    const stationCount = selectedRoute.path?.length || selectedRoute.stops?.length || 0;
    const estimatedKm = Math.round(stationCount * 1.8);
    setDistance(estimatedKm);
    setShowFares(false);
  }, [selectedRoute]);

  const fares = useMemo(() => {
    const km = Number(distance);
    if (!km || km <= 0) return null;

    const metro = getMetroFare(km);
    const busNonAC = getBusFare(km, false);
    const busAC = getBusFare(km, true);
    const auto = getAutoFare(km);
    const cab = getCabFare(km);

    // Combined: metro + auto for last mile (assume 2km auto at each end)
    const lastMileAuto = getAutoFare(2);
    const metroWithAuto = metro + lastMileAuto;
    const metroWithBus = metro + busNonAC;

    return { metro, busNonAC, busAC, auto, cab, metroWithAuto, metroWithBus, lastMileAuto };
  }, [distance]);

  if (!selectedRoute) {
    return (
      <section
        id="fare-calculator"
        className="bg-[#020617] border border-gray-800 rounded-2xl p-8"
      >
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-white mb-2">Fare Calculator</h3>
          <p className="text-gray-400 text-sm">Search a route first to see detailed fare breakdown</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="fare-calculator"
      className="bg-[#020617] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            Fare Calculator
          </h3>
          <p className="text-sm text-gray-400 mt-1">{selectedRoute.name || 'Your Route'}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Stations</div>
          <div className="text-lg font-bold text-blue-400">{selectedRoute.path?.length || selectedRoute.stops?.length || 0}</div>
        </div>
      </div>

      {/* Distance Input */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Distance (km)</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={distance}
            onChange={(e) => { setDistance(e.target.value); setShowFares(false); }}
            placeholder="Enter distance in km"
            min="1"
            className="flex-1 p-3 rounded-xl bg-black/50 border border-gray-700 text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={() => setShowFares(true)}
            disabled={!distance || Number(distance) <= 0}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white
                       font-semibold hover:from-blue-500 hover:to-purple-500 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all
                       shadow-lg shadow-blue-500/20"
          >
            Calculate
          </button>
        </div>
      </div>

      {/* Fare Results */}
      {showFares && fares && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">

          {/* Individual Fares Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metro */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Metro</div>
              <div className="text-xl font-bold text-blue-400">₹{fares.metro}</div>
            </div>

            {/* Bus Non-AC */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Bus (Non-AC)</div>
              <div className="text-xl font-bold text-green-400">₹{fares.busNonAC}</div>
            </div>

            {/* Bus AC */}
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Bus (AC)</div>
              <div className="text-xl font-bold text-teal-400">₹{fares.busAC}</div>
            </div>

            {/* Auto */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Auto</div>
              <div className="text-xl font-bold text-yellow-400">₹{fares.auto}</div>
            </div>
          </div>

          {/* Combined Fares */}
          <div className="bg-white/5 border border-gray-700 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              Combined Travel Options
            </h4>

            <div className="space-y-3">
              {/* Metro + Auto */}
              <div className="flex items-center justify-between bg-blue-500/5 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Metro + Auto (last mile)</div>
                  <div className="text-[11px] text-gray-500">₹{fares.metro} metro + ₹{fares.lastMileAuto} auto (2km)</div>
                </div>
                <div className="text-lg font-bold text-violet-400">₹{fares.metroWithAuto}</div>
              </div>

              {/* Metro + Bus */}
              <div className="flex items-center justify-between bg-green-500/5 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Metro + Bus</div>
                  <div className="text-[11px] text-gray-500">₹{fares.metro} metro + ₹{fares.busNonAC} bus</div>
                </div>
                <div className="text-lg font-bold text-emerald-400">₹{fares.metroWithBus}</div>
              </div>

              {/* Cab */}
              <div className="flex items-center justify-between bg-orange-500/5 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Cab (Uber/Ola)</div>
                  <div className="text-[11px] text-gray-500">Estimated, may vary with surge</div>
                </div>
                <div className="text-lg font-bold text-orange-400">₹{fares.cab}</div>
              </div>
            </div>
          </div>

          {/* Cheapest Option Highlight */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-sm font-semibold text-emerald-400">Cheapest Option</div>
            <div className="text-xs text-gray-400">
              {fares.busNonAC <= fares.metro
                ? `Non-AC Bus at just ₹${fares.busNonAC} — saves ₹${fares.cab - fares.busNonAC} vs cab`
                : `Metro at ₹${fares.metro} — saves ₹${fares.cab - fares.metro} vs cab`}
            </div>
          </div>

          {/* Fare Disclaimer */}
          <p className="text-[10px] text-gray-600 text-center">
            * Fares based on DMRC & DTC official rates. Cab fares are estimates and may vary.
          </p>
        </div>
      )}
    </section>
  );
}