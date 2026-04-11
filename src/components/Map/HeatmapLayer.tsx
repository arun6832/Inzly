"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { HotZone } from "@/lib/geoUtils";

interface HeatmapLayerProps {
    points: [number, number, number][]; // [lat, lng, intensity]
}

/**
 * A declarative React-Leaflet component for the Leaflet.heat plugin.
 * Handles automatic cleanup and point updates.
 */
export default function HeatmapLayer({ points }: HeatmapLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Leaflet.heat adds an 'heatLayer' method to the L object
        // We cast L to any to avoid TypeScript errors since leaflet.heat 
        // doesn't have official TS types.
        const heatLayer = (L as any).heatLayer(points, {
            radius: 35,
            blur: 25,
            maxZoom: 15,
            gradient: {
                0.2: '#4f46e5', // Indigo
                0.4: '#7c3aed', // Purple
                0.6: '#a855f7', // Electric Purple
                0.8: '#ec4899', // Pink
                1.0: '#ef4444', // Red (Tactical Heat)
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}
