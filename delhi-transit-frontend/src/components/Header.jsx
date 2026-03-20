import { useState } from "react";

export default function Header({ onAdminClick, onMetroMapClick }) {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="bg-[#020617] border-b border-gray-800 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center">

          {/* LOGO */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
            onClick={() => scrollTo("home")}
          >
            {/* SVG LOGO */}
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0
                         bg-gradient-to-br from-blue-600 to-cyan-400
                         shadow-[0_0_25px_rgba(59,130,246,0.8)]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="5" cy="12" r="2" fill="white" />
                <circle cx="19" cy="5" r="2" fill="white" />
                <circle cx="19" cy="19" r="2" fill="white" />
                <path
                  d="M7 12 L17 6 M7 12 L17 18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* TEXT */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-100 tracking-wide truncate">
                Delhi Route Optimizer
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                Smart Metro + Bus Routing
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm">
            <button onClick={() => scrollTo("home")} className="nav-dark">
              Home
            </button>
            <button onClick={() => scrollTo("features")} className="nav-dark">
              Features
            </button>
            <button onClick={onMetroMapClick} className="nav-dark">
              Metro Map
            </button>
            <button onClick={() => scrollTo("transit-network")} className="nav-dark">
              Routes
            </button>

            <button
              onClick={onAdminClick}
              className="px-5 py-2 rounded-lg text-white text-sm
                         bg-blue-600 hover:bg-blue-500 transition
                         shadow-[0_0_15px_rgba(59,130,246,0.7)] cursor-pointer"
            >
              Login
            </button>
          </div>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-gray-300 text-2xl p-1"
            onClick={() => setOpen(!open)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="md:hidden mt-3 bg-[#020617] border border-gray-800 rounded-xl p-4 space-y-1">
            {[
              ["Home", "home"],
              ["Features", "features"],
              ["Metro Map", "onMetroMapClick"],
              ["Routes", "transit-network"],
              ["Fare Calculator", "fare-calculator"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={label === "Metro Map" ? () => { setOpen(false); onMetroMapClick?.(); } : () => scrollTo(id)}
                className="block w-full text-left py-2.5 px-3 rounded-lg text-gray-300
                           hover:text-blue-400 hover:bg-white/5 transition text-sm"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); onAdminClick?.(); }}
              className="block w-full text-center px-4 py-2.5 rounded-lg text-white
                         bg-blue-600 hover:bg-blue-500 transition
                         shadow-[0_0_15px_rgba(59,130,246,0.7)] mt-3 text-sm font-medium"
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* NAV BUTTON STYLE */}
      <style>{`
        .nav-dark {
          color: #9ca3af;
          transition: all 0.2s ease;
        }
        .nav-dark:hover {
          color: #60a5fa;
          text-shadow: 0 0 10px rgba(96,165,250,0.8);
        }
      `}
      </style>
    </header>
  );
}