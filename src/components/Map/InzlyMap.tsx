"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import HeatmapLayer from "./HeatmapLayer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { computeHotZones, getBoundingBox, calculateDistance, normalizeScores, CITY_CENTERS, type MapIdea } from "@/lib/geoUtils";
import IdeaPreviewCard from "./IdeaPreviewCard";
import FilterBar, { type FilterMode, type RadiusKm } from "./FilterBar";
import { Loader2, LocateFixed } from "lucide-react";

// Default center: Bangalore (major startup hub)
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 6;

const CATEGORY_COLORS: Record<string, string> = {
    "AI/ML": "#6366f1",
    "FinTech": "#10b981",
    "HealthTech": "#f43f5e",
    "EdTech": "#f59e0b",
    "SaaS": "#a855f7",
    "CleanTech": "#14b8a6",
    "AgriTech": "#84cc16",
    "Social": "#ec4899",
};

function getColor(category: string) {
    return CATEGORY_COLORS[category] || "#6366f1";
}

// Fires on map move — used to refetch ideas for visible bounds
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
    useMapEvents({
        moveend(e) {
            onBoundsChange(e.target.getBounds());
        },
        zoomend(e) {
            onBoundsChange(e.target.getBounds());
        },
    });
    return null;
}

// Controls map zoom and bounds dynamically based on mode and radius
function MapController({ center, mode, radius }: { center: [number, number], mode: FilterMode, radius: RadiusKm }) {
    const map = useMapEvents({});
    const initializedRef = useRef(false);

    useEffect(() => {
        const handleRecenter = () => {
            if (center) {
                map.setView(center, 14, { animate: true });
            }
        };

        window.addEventListener("recenter-map", handleRecenter);

        return () => window.removeEventListener("recenter-map", handleRecenter);
    }, [center, map]);

    useEffect(() => {
        if (!center || center[0] === DEFAULT_CENTER[0]) return;
        
        // Initial setup zooms to user location
        if (!initializedRef.current) {
             map.setView(center, 14, { animate: true });
             initializedRef.current = true;
             return; 
        }

        // Dynamically adjust map view based on filter bounds
        if (mode === "nearby") {
             const effectiveRadius = radius === "25+" ? 75 : radius;
             const degLat = effectiveRadius / 111;
             const degLng = effectiveRadius / (111 * Math.cos(center[0] * (Math.PI / 180)));
             const bounds = L.latLngBounds(
                 [center[0] - degLat, center[1] - degLng],
                 [center[0] + degLat, center[1] + degLng]
             );
             map.flyToBounds(bounds, { animate: true, duration: 1.0 });
        } else if (mode === "city") {
             map.flyTo(center, 12, { animate: true, duration: 1.5, easeLinearity: 0.25 });
        } else if (mode === "global") {
             map.flyTo(center, 3, { animate: true, duration: 2.0, easeLinearity: 0.1 });
        }
    }, [center, mode, radius, map]);

    return null;
}

export default function InzlyMap() {
    const [features, setFeatures] = useState<MapIdea[]>([]);
    const [hotZones, setHotZones] = useState<ReturnType<typeof normalizeScores>>([]);
    const [selectedFeature, setSelectedFeature] = useState<MapIdea | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<FilterMode>("nearby");
    const [radius, setRadius] = useState<RadiusKm>("25+");
    const [showIdeas, setShowIdeas] = useState(true);
    const [showProblems, setShowProblems] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [userCity, setUserCity] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.warn("Geolocation warning/timeout:", err.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );
        }
    }, []);


    const fetchFeatures = useCallback(async (mode: FilterMode, radiusKm: RadiusKm, userLoc: typeof userLocation, toggleI: boolean, toggleP: boolean) => {
        setLoading(true);
        try {
            let raw: MapIdea[] = [];

            // 1. Fetch Ideas if toggled
            if (toggleI) {
                const ideaQ = query(collection(db, "ideas"), where("visibility", "==", "public"));
                const ideaSnap = await getDocs(ideaQ);
                ideaSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    if (!d.location?.lat || !d.location?.lng) return;
                    raw.push({
                        id: docSnap.id,
                        title: d.title || "",
                        idea: d.idea || "",
                        category: d.category || "Other",
                        lat: d.location.lat,
                        lng: d.location.lng,
                        city: d.location.city || "",
                        engagementScore: d.engagementScore || 0,
                        likesCount: d.likesCount || 0,
                        views: d.views || 0,
                        authorUsername: d.authorUsername,
                        type: 'idea'
                    });
                });
            }

            // 2. Fetch Problems if toggled
            if (toggleP) {
                const probQ = query(collection(db, "problems"), where("visibility", "==", "public"));
                const probSnap = await getDocs(probQ);
                probSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    if (!d.location?.lat || !d.location?.lng) return;
                    raw.push({
                        id: docSnap.id,
                        title: d.title || "",
                        idea: d.description || "",
                        category: d.sector || "Other",
                        lat: d.location.lat,
                        lng: d.location.lng,
                        city: d.location.city || "",
                        engagementScore: d.severity === 'high' ? 50 : 20,
                        likesCount: 0,
                        views: 0,
                        authorUsername: d.creatorId,
                        type: 'problem'
                    });
                });
            }

            // Apply space/time filters
            if (mode === "city" && userCity) {
                raw = raw.filter(i => i.city === userCity);
            } else if (mode === "nearby" && userLoc) {
                const effectiveRadius = radiusKm === "25+" ? 75 : (radiusKm as number);
                const bbox = getBoundingBox(userLoc.lat, userLoc.lng, effectiveRadius);
                raw = raw.filter(
                    i =>
                        i.lat >= bbox.minLat && i.lat <= bbox.maxLat &&
                        i.lng >= bbox.minLng && i.lng <= bbox.maxLng
                );
            }

            setFeatures(raw);

            if (!userCity && raw.length > 0) {
                setUserCity(raw[0].city);
            }

            const zones = computeHotZones(raw);
            setHotZones(normalizeScores(zones));
        } catch (err) {
            console.error("Map fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, [userCity]);

    useEffect(() => {
        fetchFeatures(filterMode, radius, userLocation, showIdeas, showProblems);
    }, [filterMode, radius, userLocation, showIdeas, showProblems, fetchFeatures]);

    const mapCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : DEFAULT_CENTER;

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0d0d18]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Syncing Engine...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">

            {/* Filter bar */}
            <FilterBar
                mode={filterMode}
                radius={radius}
                city={userCity}
                hasLocation={!!userLocation}
                onModeChange={mode => { setFilterMode(mode); }}
                onRadiusChange={r => setRadius(r)}
                showIdeas={showIdeas}
                showProblems={showProblems}
                onToggleIdeas={() => setShowIdeas(!showIdeas)}
                onToggleProblems={() => setShowProblems(!showProblems)}
            />

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-indigo-300"
                        style={{ background: "rgba(13,13,24,0.9)", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Scanning Innovation Vectors...
                    </div>
                </div>
            )}

            {/* Stats badge */}
            {!loading && (
                <div
                    className="absolute bottom-4 right-4 z-[1000] px-4 py-2 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-4"
                    style={{ background: "rgba(13,13,24,0.85)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        {features.filter(f => f.type === 'idea').length} Ideas
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        {features.filter(f => f.type === 'problem').length} Problems
                    </div>
                </div>
            )}

            {/* Recenter Button */}
            {userLocation && (
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent("recenter-map"));
                    }}
                    className="absolute bottom-16 right-4 z-[1000] p-3 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group overflow-hidden"
                    style={{ background: "rgba(13,13,24,0.9)", border: "1px solid rgba(239, 68, 68, 0.4)" }}
                >
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-red-500 group-hover:h-full group-hover:opacity-10 transition-all opacity-20" />
                    <LocateFixed className="w-5 h-5 text-red-500 group-hover:text-red-400 relative z-10" />
                </button>
            )}

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full"
                style={{ background: "#0d0d18" }}
                zoomControl={false}
                attributionControl={false}
                minZoom={3}
                worldCopyJump={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    maxZoom={19}
                />

                <BoundsWatcher onBoundsChange={() => {}} />
                <MapController 
                    center={mapCenter} 
                    mode={filterMode}
                    radius={radius}
                />

                {/* Tactical Innovation Heatmap */}
                <HeatmapLayer 
                    points={hotZones.map(z => [z.lat, z.lng, z.normalized * 0.8])} 
                />

                {/* User Location Radar */}
                {userLocation && (
                    <>
                        <CircleMarker 
                            center={[userLocation.lat, userLocation.lng]} 
                            radius={10}
                            className="radar-user-marker"
                            pathOptions={{
                                fillColor: filterMode === "nearby" ? "#a855f7" : "#ef4444",
                                fillOpacity: 1,
                                color: "#fff",
                                weight: 2,
                            }}
                        />
                        {/* Discovery Bubble visualization */}
                        {filterMode === "global" && (
                            <Circle 
                                center={[userLocation.lat, userLocation.lng]} 
                                radius={75000} // 75km
                                pathOptions={{
                                    color: "#ef4444",
                                    weight: 2,
                                    fillColor: "#ef4444",
                                    fillOpacity: 0.08,
                                    opacity: 0.5,
                                    dashArray: "10 10",
                                }}
                                interactive={false}
                            />
                        )}
                        {filterMode === "nearby" && (
                            <Circle 
                                center={[userLocation.lat, userLocation.lng]} 
                                radius={(radius === "25+" ? 75 : radius) * 1000} // radius km to meters
                                pathOptions={{
                                    color: "#a855f7",
                                    weight: 2,
                                    fillColor: "#a855f7",
                                    fillOpacity: 0.08,
                                    opacity: 0.5,
                                    dashArray: "10 10",
                                }}
                                interactive={false}
                            />
                        )}
                    </>
                )}


                {/* Innovation nodes with industrial clustering */}
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                    showCoverageOnHover={false}
                    iconCreateFunction={(cluster: any) => {
                        const count = cluster.getChildCount();
                        const markers = cluster.getAllChildMarkers();
                        const hasProblem = markers.some((m: any) => m.options.icon?.options?.className?.includes('marker-problem'));
                        
                        const size = count < 10 ? 32 : count < 50 ? 40 : 48;
                        const borderColor = hasProblem ? "rgba(168,85,247,0.5)" : "rgba(99,102,241,0.5)";
                        const textColor = hasProblem ? "#c084fc" : "#818cf8";
                        
                        return L.divIcon({
                            html: `<div style="
                                width:${size}px;height:${size}px;
                                background:rgba(13,13,24,0.8);
                                border:1.5px solid ${borderColor};
                                border-radius:12px;
                                display:flex;align-items:center;justify-content:center;
                                color:${textColor};font-size:11px;font-weight:900;
                                backdrop-filter:blur(12px);
                                shadow: 0 4px 20px rgba(0,0,0,0.5);
                            ">${count}</div>`,
                            className: "",
                            iconSize: [size, size],
                            iconAnchor: [size / 2, size / 2],
                        });
                    }}
                >
                    {features.map(feat => {
                        const color = feat.type === 'problem' ? '#a855f7' : getColor(feat.category);
                        const isHot = (feat.engagementScore || 0) > 20;
                        const r = isHot ? 10 : 7;

                        return (
                            <CircleMarker
                                key={feat.id}
                                center={[feat.lat, feat.lng]}
                                radius={r}
                                className={feat.type === 'problem' ? 'marker-problem' : 'marker-idea'}
                                pathOptions={{
                                    color: feat.type === 'problem' ? "#d8b4fe" : "#fff",
                                    weight: feat.type === 'problem' ? 2 : 1.5,
                                    fillColor: color,
                                    fillOpacity: 1,
                                    opacity: 1,
                                }}
                                eventHandlers={{
                                    click: () => setSelectedFeature(feat),
                                }}
                            >
                                <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                                    <div className="px-2 py-1 bg-[#121218] border border-white/10 rounded-lg shadow-2xl">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{feat.type}</p>
                                        <p className="text-[11px] font-bold text-white whitespace-nowrap">{feat.title}</p>
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Feature preview card */}
            <IdeaPreviewCard idea={selectedFeature} onClose={() => setSelectedFeature(null)} />
        </div>
    );
}
