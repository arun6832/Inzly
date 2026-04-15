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
             map.flyTo(center, 12, { animate: true, duration: 1.0 });
        } else if (mode === "global") {
             map.flyTo(center, 3, { animate: true, duration: 1.5 });
        }
    }, [center, mode, radius, map]);

    return null;
}

export default function InzlyMap() {
    const [ideas, setIdeas] = useState<MapIdea[]>([]);
    const [hotZones, setHotZones] = useState<ReturnType<typeof normalizeScores>>([]);
    const [selectedIdea, setSelectedIdea] = useState<MapIdea | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<FilterMode>("nearby");
    const [radius, setRadius] = useState<RadiusKm>("25+");
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
                    console.error("Geolocation error:", err.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, []);


    const fetchIdeas = useCallback(async (mode: FilterMode, radiusKm: RadiusKm, userLoc: typeof userLocation) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "ideas"),
                where("visibility", "==", "public")
            );
            const snap = await getDocs(q);
            let raw: MapIdea[] = [];

            snap.forEach(docSnap => {
                const d = docSnap.data();
                if (!d.location?.lat || !d.location?.lng) return;
                raw.push({
                    id: docSnap.id,
                    title: d.title || "",
                    idea: d.idea || d.problem || "",
                    category: d.category || "Other",
                    lat: d.location.lat,
                    lng: d.location.lng,
                    city: d.location.city || "",
                    engagementScore: d.engagementScore || 0,
                    likesCount: d.likesCount || 0,
                    views: d.views || 0,
                    authorUsername: d.authorUsername,
                });
            });

            // Apply filter
            if (mode === "global") {
                // World wide search - no distance restrictions applied for PRO users
            } else if (mode === "city" && userCity) {
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

            setIdeas(raw);

            // Auto-detect city from first idea near user
            if (!userCity && raw.length > 0) {
                setUserCity(raw[0].city);
            }

            // Compute hot zones
            const zones = computeHotZones(raw);
            setHotZones(normalizeScores(zones));
        } catch (err) {
            console.error("Map fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, [userCity]);

    useEffect(() => {
        fetchIdeas(filterMode, radius, userLocation);
    }, [filterMode, radius, userLocation, fetchIdeas]);

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
            />

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-indigo-300"
                        style={{ background: "rgba(13,13,24,0.9)", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading ideas...
                    </div>
                </div>
            )}

            {/* Stats badge */}
            {!loading && (
                <div
                    className="absolute bottom-4 right-4 z-[1000] px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400"
                    style={{ background: "rgba(13,13,24,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {ideas.length} ideas · {hotZones.length} hot zones
                </div>
            )}

            {/* Recenter Button */}
            {userLocation && (
                <button
                    onClick={() => {
                        // We need a way to tell the MapRecenter to fire again.
                        // For now, we can just use setView on the map directly if we had the instance.
                        // Or we can just use a simple state flip.
                        window.dispatchEvent(new CustomEvent("recenter-map"));
                    }}
                    className="absolute bottom-16 right-4 z-[1000] p-3 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group"
                    style={{ background: "rgba(13,13,24,0.9)", border: "1px solid rgba(239, 68, 68, 0.4)" }}
                    title="Recenter to my location"
                >
                    <LocateFixed className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                </button>
            )}

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full"
                style={{ background: "#0d0d18" }}
                zoomControl={false}
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


                {/* Idea pins with clustering */}
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                    showCoverageOnHover={false}
                    iconCreateFunction={(cluster: any) => {
                        const count = cluster.getChildCount();
                        const size = count < 10 ? 32 : count < 50 ? 40 : 48;
                        return L.divIcon({
                            html: `<div style="
                                width:${size}px;height:${size}px;
                                background:rgba(99,102,241,0.2);
                                border:1.5px solid rgba(99,102,241,0.5);
                                border-radius:50%;
                                display:flex;align-items:center;justify-content:center;
                                color:#818cf8;font-size:11px;font-weight:800;
                                backdrop-filter:blur(8px);
                            ">${count}</div>`,
                            className: "",
                            iconSize: [size, size],
                            iconAnchor: [size / 2, size / 2],
                        });
                    }}
                >
                    {ideas.map(idea => {
                        const color = getColor(idea.category);
                        const isHot = (idea.engagementScore || 0) > 20;
                        const r = isHot ? 9 : 6;

                        return (
                            <CircleMarker
                                key={idea.id}
                                center={[idea.lat, idea.lng]}
                                radius={r}
                                pathOptions={{
                                    color: "#fff",
                                    weight: 1.5,
                                    fillColor: color,
                                    fillOpacity: 0.9,
                                    opacity: 0.7,
                                }}
                                eventHandlers={{
                                    click: () => setSelectedIdea(idea),
                                }}
                            />
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Idea preview card */}
            <IdeaPreviewCard idea={selectedIdea} onClose={() => setSelectedIdea(null)} />
        </div>
    );
}
