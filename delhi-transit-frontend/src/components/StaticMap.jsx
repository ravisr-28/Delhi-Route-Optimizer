import { useState } from "react";

export default function StaticMap({ onClose }) {
    const [fullscreen, setFullscreen] = useState(false);
    const mapImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Delhi_metro_rail_network.svg/2000px-Delhi_metro_rail_network.svg.png";
    const officialPdfUrl = "https://delhimetrorail.com/static/media/DMRC-Network-Map-Jan2026-Hindi-&-English-20.02.26.70b6cd03.pdf";

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
            <div className="relative w-full max-w-6xl max-h-full bg-[#020617] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 font-display">
                            <i className="fas fa-subway text-blue-500"></i>
                            NETWORK SCHEMATIC
                        </h2>
                        <p className="text-gray-400 text-xs mt-1 font-bold uppercase tracking-widest">
                            Official network layout • Updated Jan 2026
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={officialPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition items-center gap-2"
                        >
                            <i className="fas fa-file-pdf text-red-400"></i>
                            Download PDF
                        </a>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition cursor-pointer text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-4 md:p-6">
                    <div className="relative h-full rounded-2xl overflow-hidden border border-white/5 bg-black/20 group">
                        <div
                            className="w-full h-full overflow-auto custom-scrollbar cursor-zoom-in"
                            onClick={() => setFullscreen(true)}
                        >
                            <img
                                src={mapImageUrl}
                                alt="Delhi Metro Schematic Map"
                                className="w-full h-auto min-w-[1000px] transition-transform duration-700 group-hover:scale-[1.01]"
                                loading="lazy"
                            />
                        </div>

                        {/* Floating zoom button */}
                        <button
                            onClick={() => setFullscreen(true)}
                            className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 rounded-full text-white shadow-xl hover:bg-blue-500 transition flex items-center justify-center text-lg"
                        >
                            <i className="fas fa-search-plus"></i>
                        </button>
                    </div>
                </div>

                {/* Footer info */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 font-medium">
                    <span>© DMRC Official Network Layout • Feb 2026</span>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Active Lines</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Planned Phases</span>
                    </div>
                </div>
            </div>

            {/* Full-Full-screen Modal (Highest Level Zoom) */}
            {fullscreen && (
                <div className="fixed inset-0 z-[2000] bg-black/98 backdrop-blur-3xl flex flex-col">
                    <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/40">
                        <div className="flex items-center gap-3 font-display">
                            <i className="fas fa-expand-arrows-alt text-blue-500"></i>
                            <span className="font-extrabold text-white uppercase tracking-tight">HIGH-RESOLUTION VECTOR SCHEMATIC</span>
                        </div>
                        <button
                            onClick={() => setFullscreen(false)}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition cursor-pointer text-xl"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#f8f9fa] custom-scrollbar">
                        <img
                            src={mapImageUrl}
                            alt="Delhi Metro Map Full"
                            className="max-w-none w-[2800px] h-auto shadow-2xl rounded-xl"
                        />
                    </div>
                    <div className="p-4 bg-black/60 border-t border-white/10 text-center">
                        <p className="text-xs text-gray-400">Pinch or use scroll bars to explore details</p>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.25);
          border-radius: 10px;
          border: 3px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.45);
          background-clip: padding-box;
        }
      `}</style>
        </div>
    );
}