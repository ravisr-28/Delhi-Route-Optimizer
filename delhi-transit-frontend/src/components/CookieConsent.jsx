import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(true);

  // 🔹 Check cookie/localStorage on load
  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent) {
      setVisible(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
      <div
        className="bg-[#020617] border border-gray-800 rounded-xl p-4 md:p-5
                   shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Text */}
          <p className="text-sm text-gray-300 text-center md:text-left leading-relaxed">
            We use cookies to improve your experience and provide personalized
            route suggestions. By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Cookie Policy
            </a>.
          </p>

          {/* Actions */}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-lg text-sm
                         bg-gray-800 text-gray-300
                         hover:bg-gray-700 transition"
            >
              Reject
            </button>

            <button
              onClick={handleAccept}
              className="px-5 py-2 rounded-lg text-sm font-medium
                         bg-blue-600 text-white
                         hover:bg-blue-500 transition
                         shadow-[0_0_15px_rgba(59,130,246,0.7)]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}