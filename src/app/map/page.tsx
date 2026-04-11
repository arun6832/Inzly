"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import "./map.css";

// Leaflet is browser-only — must disable SSR
const InzlyMap = dynamic(() => import("@/components/Map/InzlyMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0d0d18]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Initializing Map</p>
            </div>
        </div>
    ),
});

export default function MapPage() {
    return (
        <div className="fixed inset-0 top-0 z-0">
            <InzlyMap />
        </div>
    );
}
