import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Routes({ selectedRoute, onSelectRoute, onRoutesLoaded }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Fastest");
  const [expanded, setExpanded] = useState(null);

  // nearby | all
  const [mode, setMode] = useState("nearby");

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);

        let res;
        if (mode === "nearby") {
          res = await api.get(
            "/routes/nearby?lat=28.6328&lng=77.2197&radius=3000"
          );
        } else {
          res = await api.get("/routes");
        }

        // ✅ CORRECT RESPONSE KEY
        setRoutes(res.data.data || []);
        onRoutesLoaded?.(res.data.data || []);

      } catch (err) {
        console.error("Failed to load routes", err);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [mode]);

  const sortedRoutes = useMemo(() => {
    const list = Array.isArray(routes) ? [...routes] : [];

    if (sortBy === "Fastest") {
      return list.sort(
        (a, b) => (a.frequency ?? 999) - (b.frequency ?? 999)
      );
    }

    if (sortBy === "Cheapest") {
      return list.sort(
        (a, b) => (a.fare?.min ?? 9999) - (b.fare?.min ?? 9999)
      );
    }

    return list;
  }, [routes, sortBy]);

  if (loading) {
    return (
      <section className="text-gray-400 text-center py-12">
        Loading routes...
      </section>
    );
  }

  if (sortedRoutes.length === 0) {
    return null;
  }

  return (
    <section id="routes" className="mb-16">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-gray-100">
          Recommended Routes
        </h3>

        <div className="flex gap-3">
          {/* Mode Toggle */}
          <button
            onClick={() => setMode("nearby")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === "nearby"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-white/5"
              }`}
          >
            <i className="fas fa-location-arrow text-[10px]"></i>
            Nearby
          </button>

          <button
            onClick={() => setMode("all")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-white/5"
              }`}
          >
            <i className="fas fa-globe-asia text-[10px]"></i>
            All Routes
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#020617] border border-gray-700 text-gray-200 p-2 rounded-lg"
          >
            <option value="Fastest">Fastest</option>
            <option value="Cheapest">Cheapest</option>
          </select>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedRoutes.map((route) => {
          const isSelected = selectedRoute?._id === route._id;
          const isOpen = expanded === route._id;

          return (
            <div
              key={route._id}
              className={`bg-[#020617] border border-gray-800 rounded-xl p-6 shadow-lg transition-all ${isSelected
                  ? "ring-2 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                  : ""
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-100">
                    {route.name}
                  </h4>
                  <span className="inline-block mt-2 bg-black text-gray-300 px-3 py-1 rounded-full text-xs">
                    {route.type?.toUpperCase()}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    Every {route.frequency ?? "—"} mins
                  </p>
                </div>
              </div>

              {/* Stops */}
              {route.stops?.length > 0 && (
                <>
                  <button
                    onClick={() =>
                      setExpanded(isOpen ? null : route._id)
                    }
                    className="text-sm text-blue-400 hover:underline mb-3"
                  >
                    {isOpen ? "Hide details" : "View route details"}
                  </button>

                  {isOpen && (
                    <ul className="mb-4 space-y-2 text-gray-400 text-sm">
                      {route.stops.map((stop, i) => (
                        <li key={i}>
                          {i + 1}. {stop.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              <button
                onClick={() => onSelectRoute(route)}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-[#0f172a] text-gray-400 hover:bg-gray-800 border border-white/5 cursor-pointer"
                  }`}
              >
                <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                {isSelected ? "ACTIVE" : "SELECT VECTOR"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}