import { popularRoutes } from "../data/routesData";

export default function PopularRoutes({ onPlanRoute }) {
  return (
    <section className="mt-12">
      <h3 className="text-2xl font-bold text-gray-100 mb-8">
        Popular Delhi Routes
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularRoutes.map((route) => (
          <div
            key={route.id}
            className="bg-[#020617] border border-gray-800
                       rounded-xl p-6
                       hover:border-blue-500 transition
                       hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]"
          >
            {/* Top */}
            <div className="flex items-start mb-4">
              <img
                src={route.image}
                alt={`${route.from} to ${route.to}`}
                className="w-20 h-20 rounded-lg object-cover
                           border border-gray-700"
              />

              <div className="ml-4">
                <h4 className="font-semibold text-lg text-gray-100">
                  {route.from} → {route.to}
                </h4>

                <div className="flex items-center mt-2 text-sm text-gray-400">
                  <span>
                    <i className="fas fa-clock mr-1"></i>
                    {route.time}
                  </span>

                  <span className="mx-2">•</span>

                  <span>{route.fare}</span>
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => onPlanRoute(route)}
              className="text-blue-400 font-medium
                         hover:text-blue-300 transition
                         hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]"
            >
              Plan this route →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}