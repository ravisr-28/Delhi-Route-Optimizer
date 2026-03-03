import { useEffect, useState } from "react";

export default function Footer() {
  const [quickLinks, setQuickLinks] = useState([]);
  const [transportLinks, setTransportLinks] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setQuickLinks([
      "Metro Timings",
      "Bus Routes",
      "Fare Calculator",
      "Metro Map",
      "Mobile App",
    ]);

    setTransportLinks([
      "DMRC Official Site",
      "DTC Bus Services",
      "Cluster Bus Services",
      "Last Metro Timings",
      "First & Last Bus",
    ]);
  }, []);

  const handleSubscribe = () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    alert(`Subscribed with: ${email}`);
    setEmail("");
  };

  return (
    <footer className="bg-[#020617] border-t border-gray-800 text-gray-400 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center
                           shadow-[0_0_20px_rgba(59,130,246,0.7)]"
              >
                <i className="fas fa-subway text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  Delhi Route Optimizer
                </h3>
                <p className="text-sm text-gray-500">
                  Smart Commute Planning
                </p>
              </div>
            </div>

            <p className="text-gray-500 mb-4 text-sm leading-relaxed">
              Your intelligent partner for navigating Delhi's public transport
              system efficiently.
            </p>

            <div className="flex space-x-4 text-lg">
              {["twitter", "facebook", "instagram", "linkedin"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="text-gray-500 hover:text-blue-400 transition
                             hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                >
                  <i className={`fab fa-${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-200 mb-4 tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Transport Info */}
          <div>
            <h4 className="font-semibold text-gray-200 mb-4 tracking-wide">
              Transport Info
            </h4>
            <ul className="space-y-2 text-sm">
              {transportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-gray-200 mb-4 tracking-wide">
              Newsletter
            </h4>
            <p className="text-gray-500 mb-4 text-sm">
              Get updates on route changes and new features
            </p>

            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow p-3 rounded-l-lg bg-black
                           border border-gray-700 text-gray-200
                           placeholder-gray-500 outline-none"
              />
              <button
                onClick={handleSubscribe}
                className="bg-blue-600 px-4 rounded-r-lg
                           hover:bg-blue-500 transition
                           shadow-[0_0_15px_rgba(59,130,246,0.6)]"
              >
                <i className="fas fa-paper-plane text-white"></i>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-xs">
          <p>
            © 2026 Delhi Route Optimizer • Data provided by DMRC & DTC
          </p>
          <p className="mt-1">
            Demonstration project for route optimization concepts.
          </p>
        </div>
      </div>
    </footer>
  );
}