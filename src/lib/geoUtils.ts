import ngeohash from "ngeohash";

export const CITY_CENTERS = [
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Mumbai", lat: 19.076, lng: 72.8777 },
    { name: "Delhi", lat: 28.6139, lng: 77.209 },
    { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Kochi", lat: 9.9312, lng: 76.2673 },
    { name: "Calicut", lat: 11.2588, lng: 75.7804 },
];

export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

/** Encode a lat/lng into a geohash string */
export function encodeGeohash(lat: number, lng: number, precision = 6): string {
    return ngeohash.encode(lat, lng, precision);
}

/** Decode a geohash to lat/lng center */
export function decodeGeohash(hash: string): { lat: number; lng: number } {
    const point = ngeohash.decode(hash);
    return { lat: point.latitude, lng: point.longitude };
}

/** Get a bounding box around a lat/lng for radius-based queries */
export function getBoundingBox(lat: number, lng: number, radiusKm: number): BoundingBox {
    const R = 6371; // Earth radius in km
    const dLat = (radiusKm / R) * (180 / Math.PI);
    const dLng = (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    return {
        minLat: lat - dLat,
        maxLat: lat + dLat,
        minLng: lng - dLng,
        maxLng: lng + dLng,
    };
}

export interface HotZone {
    lat: number;
    lng: number;
    hotnessScore: number;
    ideaCount: number;
    city: string;
    geohashCell: string;
}

export interface MapIdea {
    id: string;
    title: string;
    idea: string;
    category: string;
    lat: number;
    lng: number;
    city: string;
    engagementScore: number;
    likesCount: number;
    views: number;
    authorUsername?: string;
}

/**
 * Groups ideas by geohash prefix (precision 4 ≈ ~40km cells)
 * and computes a hotness score for each cell.
 */
export function computeHotZones(ideas: MapIdea[]): HotZone[] {
    const cells: Record<string, { ideas: MapIdea[]; lat: number; lng: number; city: string }> = {};

    for (const idea of ideas) {
        const cell = encodeGeohash(idea.lat, idea.lng, 4);
        if (!cells[cell]) {
            cells[cell] = { ideas: [], lat: idea.lat, lng: idea.lng, city: idea.city };
        }
        cells[cell].ideas.push(idea);
    }

    return Object.entries(cells)
        .map(([cell, data]) => {
            const ideaCount = data.ideas.length;
            const totalEngagement = data.ideas.reduce(
                (sum, i) => sum + (i.engagementScore || 0) + (i.likesCount || 0) + (i.views || 0),
                0
            );
            const hotnessScore = ideaCount * 10 + totalEngagement;
            return {
                lat: data.lat,
                lng: data.lng,
                hotnessScore,
                ideaCount,
                city: data.city,
                geohashCell: cell,
            };
        })
        .filter(hz => hz.ideaCount >= 2) // Only show zones with 2+ ideas
        .sort((a, b) => b.hotnessScore - a.hotnessScore);
}

/** Calculate distance between two points in km using Haversine formula */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/** Normalize scores to 0–1 for visual scaling */
export function normalizeScores(zones: HotZone[]): (HotZone & { normalized: number })[] {
    const max = Math.max(...zones.map(z => z.hotnessScore), 1);
    return zones.map(z => ({ ...z, normalized: z.hotnessScore / max }));
}

/** Get current user location via Browser API */
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            (err) => {
                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    });
}

/** Map coordinates to the nearest predefined city */
export function getNearestCity(lat: number, lng: number): string {
    let nearestCity = CITY_CENTERS[0].name;
    let minDistance = Infinity;

    for (const city of CITY_CENTERS) {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city.name;
        }
    }

    return nearestCity;
}

