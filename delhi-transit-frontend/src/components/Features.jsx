import { useEffect, useState } from "react";

export default function Features({ onRealTime, onFareCompare }) {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    setFeatures([
      {
        id: 1,
        title: "Real-time Updates",
        description: "Live metro & bus timings",
        icon: "fa-bolt",
        action: onRealTime,
        actionLabel: "Open Live Panel",
      },
      {
        id: 2,
        title: "Fare Comparison",
        description: "Choose cheapest route",
        icon: "fa-indian-rupee-sign",
        action: onFareCompare,
        actionLabel: "Compare Fares",
      },
    ]);
  }, [onRealTime, onFareCompare]);

  return (
    <section id="features" className="mb-20">
      <h3 className="text-3xl font-bold text-white mb-12 text-center">
        Why Choose Delhi Route Optimizer?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="bg-[#020617] border border-gray-800 rounded-2xl p-8
                       text-center relative overflow-hidden
                       shadow-[0_0_30px_rgba(0,0,0,0.9)]
                       hover:border-blue-500 transition group"
          >
            {/* Glowing Icon */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full
                           bg-blue-600 opacity-30 blur-xl
                           group-hover:opacity-50 transition-opacity"
              ></div>

              <div
                className="relative w-16 h-16 rounded-full
                           bg-[#020617] border border-blue-500
                           flex items-center justify-center"
              >
                <i
                  className={`fas ${feature.icon} text-blue-400 text-xl`}
                ></i>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-white mb-2">
              {feature.title}
            </h4>

            <p className="text-sm text-gray-400 mb-5">
              {feature.description}
            </p>

            {/* Action Button */}
            {feature.action && (
              <button
                onClick={feature.action}
                className="px-5 py-2 text-xs font-semibold rounded-full
                           bg-gradient-to-r from-blue-600 to-blue-800
                           text-white hover:from-blue-500 hover:to-blue-700
                           shadow-md shadow-blue-900/40 hover:shadow-blue-500/30
                           transition-all cursor-pointer
                           border border-blue-500/30"
              >
                {feature.actionLabel} →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}