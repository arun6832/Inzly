"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { HotZone } from "@/lib/geoUtils";

if (typeof window !== "undefined") {
    // Suppress "Canvas2D: Multiple readback operations..." warning from leaflet.heat
    // by injecting willReadFrequently: true into all 2d contexts on the client.
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    (HTMLCanvasElement as any).prototype.getContext = function(type: string, attributes?: any) {
        if (type === '2d') {
            attributes = { ...attributes, willReadFrequently: true };
        }
        return originalGetContext.call(this, type, attributes);
    };
}

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
            radius: 40,
            blur: 30,
            maxZoom: 15,
            gradient: {
                0.2: '#00ff00', // Green
                0.5: '#ffff00', // Yellow
                0.8: '#ff8c00', // Orange
                1.0: '#ff0000', // Red
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}
