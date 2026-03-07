import { useEffect, useState } from "react";

export default function Features({ onRealTime, onFareCompare, onMetroMap, onPopularRoutes }) {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    setFeatures([
      {
        id: 1,
        title: "Real-time Updates",
        description: "Live metro & bus timings with instant delay alerts and platform info.",
        icon: "fa-bolt",
        action: onRealTime,
        actionLabel: "Open Live Panel",
        gradient: "from-blue-600 to-cyan-500"
      },
      {
        id: 2,
        title: "Fare Comparison",
        description: "Compare Metro, DTC Bus, and Auto fares to find the most economical way.",
        icon: "fa-indian-rupee-sign",
        action: onFareCompare,
        actionLabel: "Compare Fares",
        gradient: "from-emerald-600 to-teal-500"
      },
      {
        id: 3,
        title: "Live Crowd Status",
        description: "Check station occupancy levels before you travel to avoid peak hour rush.",
        icon: "fa-users",
        action: onRealTime,
        actionLabel: "View Occupancy",
        gradient: "from-orange-600 to-amber-500"
      },
      {
        id: 4,
        title: "Interactive Maps",
        description: "High-resolution metro network map with all lines and interchange points.",
        icon: "fa-map-location-dot",
        action: onMetroMap,
        actionLabel: "View Metro Map",
        gradient: "from-purple-600 to-indigo-500"
      },
      {
        id: 5,
        title: "Smart Routing",
        description: "Proprietary algorithm finding the fastest combination of metro and bus.",
        icon: "fa-route",
        action: onPopularRoutes,
        actionLabel: "Try Routing",
        gradient: "from-rose-600 to-pink-500"
      },
      {
        id: 6,
        title: "Eco-Savings",
        description: "Track your carbon footprint reduction by choosing public transport over cars.",
        icon: "fa-leaf",
        action: () => alert("Eco-Tracker feature launching next month!"),
        actionLabel: "Learn More",
        gradient: "from-green-600 to-lime-500"
      },
    ]);
  }, [onRealTime, onFareCompare, onMetroMap, onPopularRoutes]);

  return (
    <section id="features" className="mb-20">
      <div className="text-center mb-16">
        <h3 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
          Intelligent Transit Features
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Everything you need for a seamless, predictable, and smart commute across the National Capital Region.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="bg-[#020617]/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8
                       text-center relative overflow-hidden group
                       hover:border-blue-500/50 transition-all duration-300
                       hover:shadow-[0_20px_50px_rgba(30,58,138,0.3)]
                       flex flex-col items-center"
          >
            {/* Background Gradient Glow */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`}></div>

            {/* Glowing Icon Container */}
            <div className="relative w-20 h-20 mb-6">
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}
              ></div>

              <div
                className="relative w-20 h-20 rounded-2xl
                           bg-[#0f172a] border border-gray-800
                           flex items-center justify-center
                           group-hover:border-blue-500/50 transition-colors"
              >
                <i
                  className={`fas ${feature.icon} text-3xl bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`}
                ></i>
              </div>
            </div>

            <h4 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
              {feature.title}
            </h4>

            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {feature.description}
            </p>

            {/* Action Button */}
            <div className="mt-auto">
              <button
                onClick={feature.action}
                className={`px-6 py-2.5 text-xs font-bold rounded-xl
                           bg-gradient-to-r ${feature.gradient}
                           text-white hover:scale-105 active:scale-95
                           shadow-lg shadow-black/50
                           transition-all duration-300 cursor-pointer
                           border border-white/10 uppercase tracking-wider`}
              >
                {feature.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}